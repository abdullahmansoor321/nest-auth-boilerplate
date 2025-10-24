import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`[JwtStrategy] Validating payload: ${JSON.stringify(payload)}`);
    // Fetch the full user to include roles in the request object
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      this.logger.warn(`[JwtStrategy] No user found for id ${payload.sub}`);
      throw new UnauthorizedException();
    }

    // Normalize roles as an array for the RolesGuard to consume
    this.logger.log(`[JwtStrategy] Authenticated user id: ${user.id}, role: ${user.role}`);
    return { id: user.id, email: user.email, roles: [user.role] };
  }
}
