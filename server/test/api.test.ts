import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

let app: INestApplication;
let token: string;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe('Auth', () => {
  const email = `test-${Date.now()}@test.com`;

  it('POST /api/auth/register — создание пользователя', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password: '123456' })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ name: 'Test User', email, role: 'user' });
    token = res.body.token;
  });

  it('POST /api/auth/register — дубль email → 409', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Another', email, password: '123456' })
      .expect(409);
  });

  it('POST /api/auth/login — вход', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: '123456' })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);
    token = res.body.token;
  });

  it('POST /api/auth/login — неверный пароль → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrong' })
      .expect(401);
  });

  it('PUT /api/auth/password — смена пароля', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '123456', newPassword: '654321' })
      .expect(200);

    expect(res.body.message).toContain('успешно');

    await request(app.getHttpServer())
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '654321', newPassword: '123456' })
      .expect(200);
  });

  it('PUT /api/auth/password — неверный текущий → 401', async () => {
    await request(app.getHttpServer())
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: '654321' })
      .expect(401);
  });

  it('PUT /api/auth/password — без токена → 401', async () => {
    await request(app.getHttpServer())
      .put('/api/auth/password')
      .send({ currentPassword: '123456', newPassword: '654321' })
      .expect(401);
  });
});

describe('Profile', () => {
  it('GET /api/profile — данные профиля', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('role');
    expect(res.body).toHaveProperty('registeredAt');
  });

  it('GET /api/profile — без токена → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/profile')
      .expect(401);
  });

  it('PUT /api/profile — обновление имени', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });
});

describe('Search', () => {
  it('GET /api/search?q=48157-33062 — поиск запчастей', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/search?q=48157-33062')
      .expect(200);

    expect(res.body).toHaveProperty('query', '48157-33062');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('exact');
    expect(res.body).toHaveProperty('analogs');
    expect(res.body.total).toBeGreaterThan(0);

    const first = res.body.exact[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('brand');
    expect(first).toHaveProperty('article');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('inStock');
    expect(first.supplier).toHaveProperty('id');
    expect(first.supplier).toHaveProperty('name');
    expect(first.supplier).toHaveProperty('apiType');
  });

  it('GET /api/search — без q → 400', async () => {
    await request(app.getHttpServer())
      .get('/api/search')
      .expect(400);
  });

  it('GET /api/search?q=... — записывает историю для авторизованного', async () => {
    const query = `test-${Date.now()}`;
    await request(app.getHttpServer())
      .get(`/api/search?q=${query}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const histRes = await request(app.getHttpServer())
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const found = histRes.body.history.find((h: any) => h.query === query);
    expect(found).toBeDefined();
  });
});

describe('Parts', () => {
  it('GET /api/parts/48157-33062 — предложения по артикулу', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/parts/48157-33062')
      .expect(200);

    expect(res.body).toHaveProperty('article', '48157-33062');
    expect(res.body).toHaveProperty('offers');
    expect(res.body).toHaveProperty('analogs');
    expect(res.body.offers.length).toBeGreaterThan(0);
    expect(res.body.analogs.length).toBeGreaterThan(0);

    const offer = res.body.offers[0];
    expect(offer.supplier).toHaveProperty('apiType');
    expect(offer).toHaveProperty('inStock');
    expect(typeof offer.inStock).toBe('boolean');
  });
});

describe('History', () => {
  it('GET /api/history — список истории', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('history');
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('DELETE /api/history — очистка истории', async () => {
    const res = await request(app.getHttpServer())
      .delete('/api/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/history — без токена → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/history')
      .expect(401);
  });
});

describe('Suppliers', () => {
  it('GET /api/suppliers — список поставщиков', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/suppliers')
      .expect(200);

    expect(res.body).toHaveProperty('suppliers');
    expect(res.body.suppliers.length).toBeGreaterThan(0);

    const s = res.body.suppliers[0];
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('name');
    expect(s).toHaveProperty('apiType');
  });
});
