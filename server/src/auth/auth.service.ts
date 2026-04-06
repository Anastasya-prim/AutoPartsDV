/**
 * AuthService — сервис аутентификации (регистрация и вход).
 *
 * Как работает:
 * - Пароли хранятся НЕ в открытом виде, а в виде хэша (bcrypt)
 * - При входе bcrypt сравнивает введённый пароль с хэшем в БД
 * - При успехе выдаётся JWT-токен (строка, содержащая userId, email, role)
 * - Токен действителен 7 дней (настроено в auth.module.ts)
 * - Фронтенд сохраняет токен в localStorage и отправляет его в заголовке Authorization
 */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly structuredLog: StructuredLoggerService,
  ) {}

  /** Регистрация нового пользователя: хэшируем пароль, создаём запись, выдаём токен */
  async register(name: string, email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email уже занят');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        id: uuid(),
        name,
        email,
        passwordHash,
      },
    });

    const token = this.jwtService.sign({ userId: user.id, email: user.email, role: user.role });

    // Fire-and-forget: письмо-приветствие не блокирует ответ клиенту
    this.mailService.sendWelcome(user.email, user.name).catch(() => {});

    this.structuredLog.logBusiness('user_registered', {
      userId: user.id,
      email: user.email,
    });

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  /** Вход: ищем пользователя по email, проверяем пароль через bcrypt, выдаём токен */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Неверный email или пароль');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Неверный email или пароль');

    const token = this.jwtService.sign({ userId: user.id, email: user.email, role: user.role });

    this.structuredLog.logBusiness('user_login', {
      userId: user.id,
      email: user.email,
    });

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
