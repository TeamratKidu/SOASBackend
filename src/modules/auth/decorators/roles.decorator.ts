import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for role-based access control
 * Usage: @Roles('admin', 'seller')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
