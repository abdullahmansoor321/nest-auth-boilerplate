import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    try {
      const headers = request?.headers ?? {};
      // Use normal log level so messages are visible in console
      this.logger.log(`[JwtAuthGuard] Incoming Headers: ${JSON.stringify(Object.keys(headers))}`);
      const authHeader =
        (headers as Record<string, unknown>)['authorization'] ??
        (headers as Record<string, unknown>)['Authorization'];
      this.logger.log(`[JwtAuthGuard] Authorization header present: ${!!authHeader}`);
      if (typeof authHeader === 'string') {
        this.logger.log(`[JwtAuthGuard] Authorization header length: ${authHeader.length}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.warn('[JwtAuthGuard] Failed to log headers', err.stack ?? err.message);
      } else {
        this.logger.warn(`[JwtAuthGuard] Failed to log headers: ${String(err)}`);
      }
    }
    return super.canActivate(context);
  }

  // Called after passport validates the token
  // Keep the same signature as the base AuthGuard to avoid type incompatibilities
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    // Mark unused params as used to satisfy lint rules
    void _context;
    void _status;

    if (err || !user) {
      let infoMsg = 'No user found';
      if (typeof info === 'object' && info !== null) {
        const maybe = (info as Record<string, unknown>)['message'];
        if (typeof maybe === 'string') infoMsg = maybe;
      }
      this.logger.error(`[JwtAuthGuard] Authentication Failed: ${infoMsg}`);
      if (err instanceof Error) throw err;
      throw new UnauthorizedException();
    }
    return user as TUser;
  }
}
