import { Controller, Post, Put, Body, UseGuards, Request, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  async register(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.register(body.name, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.currentPassword) throw new BadRequestException('Введите текущий пароль');
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('Новый пароль — минимум 6 символов');
    }

    const user = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const isMatch = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Неверный текущий пароль');

    const newHash = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Пароль успешно изменён' };
  }
}
