/**
 * AuthModule — модуль аутентификации.
 *
 * Объединяет:
 * - PassportModule — фреймворк стратегий аутентификации
 * - JwtModule — создание и проверка JWT-токенов
 * - AuthService — бизнес-логика (регистрация, вход)
 * - JwtStrategy — стратегия Passport для проверки Bearer-токенов
 *
 * Экспортирует AuthService и JwtModule для использования в других модулях
 * (например, OptionalJwtAuthGuard использует JwtService из JwtModule).
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },  // Токен действителен 7 дней
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
