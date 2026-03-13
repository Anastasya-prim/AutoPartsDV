/**
 * JwtStrategy — стратегия Passport для проверки JWT-токенов.
 *
 * Когда запрос приходит с заголовком Authorization: Bearer <токен>,
 * Passport автоматически:
 * 1. Извлекает токен из заголовка
 * 2. Проверяет подпись (secretOrKey) и срок действия
 * 3. Вызывает validate() — мы возвращаем данные пользователя
 * 4. Эти данные становятся доступны через req.user в контроллерах
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /** Payload из JWT → объект req.user в контроллерах */
  async validate(payload: any) {
    return { userId: payload.userId, email: payload.email, role: payload.role };
  }
}
