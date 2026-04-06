/**
 * SuppliersService — CRUD-операции с поставщиками в БД.
 * Используется в админ-панели для управления списком поставщиков.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private readonly structuredLog: StructuredLoggerService,
  ) {}

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany();
    return { suppliers };
  }

  async create(data: any) {
    const created = await this.prisma.supplier.create({ data });
    this.structuredLog.logBusiness('supplier_created', { supplierId: created.id });
    return created;
  }

  async update(id: string, data: any) {
    const updated = await this.prisma.supplier.update({ where: { id }, data });
    this.structuredLog.logBusiness('supplier_updated', { supplierId: id });
    return updated;
  }

  async remove(id: string) {
    const removed = await this.prisma.supplier.delete({ where: { id } });
    this.structuredLog.logBusiness('supplier_deleted', { supplierId: id });
    return removed;
  }
}
