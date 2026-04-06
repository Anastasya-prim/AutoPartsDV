/**
 * HistoryService — работа с историей поисковых запросов пользователя.
 *
 * - findAll — получить всю историю (отсортировано по дате, новые сверху)
 * - clear   — очистить всю историю
 * - remove  — удалить одну запись (с проверкой, что она принадлежит пользователю)
 */
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';

@Injectable()
export class HistoryService {
  constructor(
    private prisma: PrismaService,
    private readonly structuredLog: StructuredLoggerService,
  ) {}

  async findAll(userId: string) {
    const history = await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { history };
  }

  async clear(userId: string) {
    await this.prisma.searchHistory.deleteMany({ where: { userId } });
    this.structuredLog.logBusiness('search_history_cleared', { userId });
    return { message: 'История очищена' };
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.searchHistory.findUnique({ where: { id } });
    if (!item) return { message: 'Запись удалена' };
    if (item.userId !== userId) throw new ForbiddenException();

    await this.prisma.searchHistory.delete({ where: { id } });
    this.structuredLog.logBusiness('search_history_entry_deleted', {
      userId,
      entryId: id,
    });
    return { message: 'Запись удалена' };
  }
}
