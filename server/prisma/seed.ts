import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

/** Как в PrismaService: Docker использует DATABASE_URL=file:./data/autoparts.db, не /app/autoparts.db */
function sqliteFileUrl(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv?.startsWith('file:')) {
    return fromEnv;
  }
  return `file:${path.join(process.cwd(), 'autoparts.db')}`;
}

const adapter = new PrismaBetterSqlite3({ url: sqliteFileUrl() });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingSupplier = await prisma.supplier.findFirst();
  if (existingSupplier) {
    console.log('База уже содержит данные — seed пропущен.');
    return;
  }

  const suppliers = [
    { id: 'rossko',    name: 'Rossko',    url: 'https://ussuri.rossko.ru', region: 'Уссурийск',   status: 'online',      apiType: 'api' },
    { id: 'mxgroup',   name: 'MX Group',  url: 'https://mxgroup.ru',      region: 'Владивосток', status: 'online',      apiType: 'api' },
    { id: 'autotrade', name: 'AutoTrade', url: 'https://autotrade.su',    region: 'Уссурийск',   status: 'online',      apiType: 'api' },
    { id: 'tiss',      name: 'TISS',      url: 'https://my.tiss.ru',      region: 'Владивосток', status: 'online',      apiType: 'api' },
    { id: 'autobiz',   name: 'AutoBiz',   url: 'https://autobiz.ru',      region: 'Владивосток', status: 'online',      apiType: 'api' },
    { id: 'am25',      name: 'AM25',      url: 'https://am25.ru',         region: 'Владивосток', status: 'online',      apiType: 'scraper' },
    { id: 'trustauto', name: 'TrustAuto', url: 'https://trustautovl.ru',  region: 'Владивосток', status: 'online',      apiType: 'scraper' },
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({ data: s });
  }
  console.log(`Создано ${suppliers.length} поставщиков.`);

  const parts = [
    { supplierId: 'rossko',    brand: 'TOYOTA', article: '48157-33062', name: 'Опора амортизатора передняя левая',   price: 1350, quantity: 5,  inStock: 1, deliveryDays: 0, isAnalog: 0 },
    { supplierId: 'mxgroup',   brand: 'TOYOTA', article: '48157-33062', name: 'Опора амортизатора передняя левая',   price: 1280, quantity: 12, inStock: 1, deliveryDays: 0, isAnalog: 0 },
    { supplierId: 'autotrade', brand: 'TOYOTA', article: '48157-33062', name: 'Опора амортизатора передняя левая',   price: 1420, quantity: 2,  inStock: 1, deliveryDays: 1, isAnalog: 0 },
    { supplierId: 'tiss',      brand: 'TOYOTA', article: '48157-33062', name: 'Опора стойки передняя левая',         price: 1500, quantity: 0,  inStock: 0, deliveryDays: 3, isAnalog: 0 },
    { supplierId: 'autobiz',   brand: 'TOYOTA', article: '48157-33062', name: 'Опора амортизатора передняя левая',   price: 1310, quantity: 8,  inStock: 1, deliveryDays: 0, isAnalog: 0 },
    { supplierId: 'mxgroup',   brand: 'FEBEST', article: 'TSB-ACR50F',  name: 'Опора амортизатора передняя',         price: 640,  quantity: 25, inStock: 1, deliveryDays: 0, isAnalog: 1, analogFor: '48157-33062' },
    { supplierId: 'rossko',    brand: 'CTR',    article: 'CVKH-109',    name: 'Опора стойки передняя',               price: 580,  quantity: 8,  inStock: 1, deliveryDays: 0, isAnalog: 1, analogFor: '48157-33062' },
    { supplierId: 'autotrade', brand: 'MASUMA', article: 'SAM-1102',    name: 'Опора амортизатора',                  price: 720,  quantity: 4,  inStock: 1, deliveryDays: 1, isAnalog: 1, analogFor: '48157-33062' },
    { supplierId: 'trustauto', brand: 'SAT',    article: 'ST-48157-33062', name: 'Опора амортизатора передняя лев.', price: 490,  quantity: 15, inStock: 1, deliveryDays: 0, isAnalog: 1, analogFor: '48157-33062' },
    { supplierId: 'tiss',      brand: 'JIKIU',  article: 'JM-12015',    name: 'Опора передней стойки',               price: 850,  quantity: 0,  inStock: 0, deliveryDays: 5, isAnalog: 1, analogFor: '48157-33062' },
  ];

  for (const p of parts) {
    await prisma.part.create({ data: p });
  }
  console.log(`Создано ${parts.length} запчастей.`);

  const userHash = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: {
      name: 'Тестовый пользователь',
      email: 'test@test.com',
      passwordHash: userHash,
    },
  });
  console.log('Создан пользователь: test@test.com / 123456 (role: user)');

  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Администратор',
      email: 'admin@test.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log('Создан администратор: admin@test.com / admin123 (role: admin)');

  console.log('Seed завершён.');
}

main()
  .catch((e) => {
    console.error('Ошибка seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
