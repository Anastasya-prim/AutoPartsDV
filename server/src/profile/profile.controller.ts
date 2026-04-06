/**
 * ProfileController — просмотр и редактирование профиля пользователя.
 *
 * GET /api/profile  — получить данные текущего пользователя
 * PUT /api/profile  — обновить имя и/или email
 *
 * Все эндпоинты требуют JWT-токен (JwtAuthGuard на уровне контроллера).
 */
import { Controller, Get, Put, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';

@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private prisma: PrismaService,
    private readonly structuredLog: StructuredLoggerService,
  ) {}

  @Get()
  async getProfile(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, registeredAt: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  @Put()
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const data: Record<string, string> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;

    const user = await this.prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, name: true, email: true, role: true, registeredAt: true },
    });

    this.structuredLog.logBusiness('profile_updated', {
      userId: req.user.userId,
      fields: Object.keys(data),
    });

    return user;
  }
}
