/**
 * OptionalJwtAuthGuard — «мягкая» проверка токена.
 *
 * В отличие от JwtAuthGuard, этот guard НЕ блокирует запрос без токена.
 * Если токен есть и он валидный — заполняет req.user.
 * Если токена нет или он невалидный — пропускает запрос (req.user = undefined).
 *
 * Используется на эндпоинте поиска: если пользователь авторизован —
 * запрос сохранится в историю; если нет — поиск всё равно сработает.
 */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
        request.user = payload;
      } catch {
        // Токен невалидный — ничего страшного, просто пропускаем
      }
    }
    // Всегда возвращаем true — запрос пройдёт в любом случае
    return true;
  }
}
