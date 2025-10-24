import { SetMetadata } from '@nestjs/common';

// Keep a local Role type in sync with Prisma's Role enum.
// We avoid importing the Prisma enum directly to prevent
// type mismatches if Prisma types are not yet regenerated.
export type Role = 'USER' | 'ADMIN';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
