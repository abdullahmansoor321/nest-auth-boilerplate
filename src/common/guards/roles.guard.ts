import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      // If no roles are required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { role?: Role } | undefined;

    if (!user || !user.role) return false;

    // User now has a single role field from JWT payload
    return requiredRoles.includes(user.role);
  }
}
