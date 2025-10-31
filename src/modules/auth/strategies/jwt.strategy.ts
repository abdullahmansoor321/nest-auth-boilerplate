import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  validate(payload: JwtPayload) {
    this.logger.log(`[JwtStrategy] Validating payload: ${JSON.stringify(payload)}`);

    // Role is now in the JWT payload - no database query needed
    this.logger.log(`[JwtStrategy] Authenticated user id: ${payload.sub}, role: ${payload.role}`);
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
