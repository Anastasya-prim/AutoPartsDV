import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  private formatResult(p: any) {
    return {
      id: p.id,
      supplier: {
        id: p.supplier.id,
        name: p.supplier.name,
        url: p.supplier.url,
        region: p.supplier.region,
        status: p.supplier.status,
        apiType: p.supplier.apiType,
      },
      brand: p.brand,
      article: p.article,
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      inStock: p.inStock === 1,
      deliveryDays: p.deliveryDays,
      isAnalog: p.isAnalog === 1,
      analogFor: p.analogFor,
    };
  }

  async search(q: string, userId?: string) {
    const query = (q || '').trim();
    if (!query) throw new BadRequestException('Параметр q обязателен');
    if (query.length > 100) throw new BadRequestException('Запрос слишком длинный');

    const parts = await this.prisma.part.findMany({
      where: {
        OR: [
          { article: { contains: query } },
          { name: { contains: query } },
          { brand: { contains: query } },
        ],
      },
      include: { supplier: true },
    });

    const results = parts.map((p) => this.formatResult(p));
    const exact = results.filter((r) => !r.isAnalog);
    const analogs = results.filter((r) => r.isAnalog);

    if (userId) {
      try {
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const duplicate = await this.prisma.searchHistory.findFirst({
          where: {
            userId,
            query,
            createdAt: { gte: fiveSecondsAgo },
          },
        });

        if (!duplicate) {
          await this.prisma.searchHistory.create({
            data: {
              id: uuid(),
              userId,
              query,
              resultsCount: results.length,
            },
          });
        }
      } catch {
        // Ошибка записи истории не должна ломать результаты поиска
      }
    }

    return { query, total: results.length, exact, analogs };
  }

  async findByArticle(article: string) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(article);
    } catch {
      throw new BadRequestException('Некорректный артикул');
    }

    const parts = await this.prisma.part.findMany({
      where: { article: decoded },
      include: { supplier: true },
    });

    const allResults = parts.map((p) => this.formatResult(p));
    const offers = allResults.filter((r) => !r.isAnalog);
    const analogs = allResults.filter((r) => r.isAnalog);

    const analogParts = await this.prisma.part.findMany({
      where: { analogFor: decoded },
      include: { supplier: true },
    });
    const extraAnalogs = analogParts.map((p) => this.formatResult(p));

    const analogIds = new Set(analogs.map((a) => a.id));
    for (const a of extraAnalogs) {
      if (!analogIds.has(a.id)) {
        analogs.push(a);
        analogIds.add(a.id);
      }
    }

    return { article: decoded, offers, analogs };
  }
}
