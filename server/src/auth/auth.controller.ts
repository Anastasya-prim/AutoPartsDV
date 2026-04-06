/**
 * AuthController — обработчик HTTP-запросов авторизации.
 *
 * Эндпоинты:
 * - POST /api/auth/register — регистрация нового пользователя
 * - POST /api/auth/login    — вход (получение JWT-токена)
 * - PUT  /api/auth/password  — смена пароля (требует авторизацию)
 */
import { Controller, Post, Put, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 запросов в минуту с одного IP на login/register
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private mailService: MailService,
    private readonly structuredLog: StructuredLoggerService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /** Смена пароля: требует JWT-токен + старый пароль для подтверждения */
  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Неверный текущий пароль');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newHash },
    });

    // Fire-and-forget: уведомление о смене пароля не блокирует ответ
    this.mailService.sendPasswordChanged(user.email, user.name).catch(() => {});

    this.structuredLog.logBusiness('password_changed', {
      userId: req.user.userId,
    });

    return { message: 'Пароль успешно изменён' };
  }
}
