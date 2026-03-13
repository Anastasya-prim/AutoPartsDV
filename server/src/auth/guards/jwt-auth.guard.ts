/**
 * JwtAuthGuard — защита эндпоинтов: требует валидный JWT-токен.
 * Если токен отсутствует или невалидный — возвращает 401 Unauthorized.
 * Используется через @UseGuards(JwtAuthGuard) на контроллерах/методах.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
