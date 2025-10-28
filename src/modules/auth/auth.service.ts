import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';

export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<UserPayload, 'password'> | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password field for security
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(user: UserPayload) {
    const payload = { sub: user.id, email: user.email };

    // Generate access token (short-lived: 15 minutes)
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    // Generate refresh token (long-lived: 7 days)
    const refreshToken = this.refreshTokenService.generateRefreshToken();

    // Store refresh token in database
    await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  async refreshTokens(refreshToken: string) {
    // Validate refresh token from database
    const tokenData = await this.refreshTokenService.validateRefreshToken(refreshToken);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = tokenData.user;
    const payload = { sub: user.id, email: user.email };

    // Generate new access token
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    // Optional: Rotate refresh token (generate new one and delete old one)
    const newRefreshToken = this.refreshTokenService.generateRefreshToken();
    await this.refreshTokenService.deleteRefreshToken(refreshToken);
    await this.refreshTokenService.storeRefreshToken(user.id, newRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  async logout(refreshToken: string) {
    // Delete the refresh token from database - THIS IS THE ACTUAL LOGOUT LOGIC
    await this.refreshTokenService.deleteRefreshToken(refreshToken);

    return {
      message: 'Logout successful',
    };
  }

  async logoutAllDevices(userId: string) {
    // Delete all refresh tokens for the user - logout from all devices
    await this.refreshTokenService.deleteAllUserRefreshTokens(userId);

    return {
      message: 'Logged out from all devices',
    };
  }
}
