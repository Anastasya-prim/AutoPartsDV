/**
 * RolesGuard — проверка роли пользователя.
 *
 * Работает в связке с декоратором @Roles('admin'):
 * 1. Считывает требуемые роли из метаданных маршрута
 * 2. Проверяет, есть ли у req.user нужная роль
 * 3. Если нет — возвращает 403 Forbidden
 *
 * Используется на эндпоинтах управления поставщиками (только для admin).
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Считываем роли, указанные через @Roles('admin', ...) на методе/контроллере
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Если роли не указаны — доступ открыт
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}
