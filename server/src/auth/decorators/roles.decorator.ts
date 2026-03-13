/**
 * Декоратор @Roles('admin', 'user') — указывает, какие роли допущены к эндпоинту.
 * Работает в паре с RolesGuard, который читает эти метаданные и проверяет req.user.role.
 *
 * Пример: @Roles('admin') → только пользователи с role='admin' получат доступ.
 */
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
