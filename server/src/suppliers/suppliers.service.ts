/**
 * SuppliersService — CRUD-операции с поставщиками в БД.
 * Используется в админ-панели для управления списком поставщиков.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany();
    return { suppliers };
  }

  async create(data: any) {
    return this.prisma.supplier.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
