import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthService, UserPayload } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser extends ExpressRequest {
  user: Omit<UserPayload, 'password'>;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user credentials and returns JWT access token (includes user role) and refresh token. Access token expires in 15 minutes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@example.com', description: 'User email address' },
        password: { type: 'string', example: 'password123', description: 'User password' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT access token with user role embedded in payload.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description:
                'JWT access token (15 min expiry). Payload includes: { sub, email, role }',
            },
            refresh_token: {
              type: 'string',
              example: '878b73cde2ad8889d1eb337588b8494039a865316d80c969...',
              description: 'Refresh token (7 days expiry, stored in database)',
            },
            expires_in: {
              type: 'number',
              example: 900,
              description: 'Access token expiration time in seconds (900 = 15 minutes)',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(@Request() req: RequestWithUser) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description:
      'Exchanges a valid refresh token for a new access token (with updated role) and rotates the refresh token. Old tokens are invalidated.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example: '878b73cde2ad8889d1eb337588b8494039a865316d80c969...',
          description: 'Valid refresh token from login response',
        },
      },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Token refresh successful. Returns new access token with current user role from database.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'New JWT access token with updated user role (15 min expiry)',
            },
            refresh_token: {
              type: 'string',
              example: 'a1b2c3d4e5f6...',
              description: 'New refresh token (old one is invalidated)',
            },
            expires_in: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid or expired refresh token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async refresh(@Body() { refresh_token }: RefreshTokenDto) {
    return this.authService.refreshTokens(refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout (invalidates refresh token)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Body() { refresh_token }: RefreshTokenDto) {
    return this.authService.logout(refresh_token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices (invalidates all refresh tokens)' })
  @ApiResponse({
    status: 200,
    description: 'Logged out from all devices',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(@Request() req: RequestWithUser) {
    return this.authService.logoutAllDevices(req.user.id);
  }
}
