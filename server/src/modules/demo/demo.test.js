import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Demo reset', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('reseeds the database and returns ok', async () => {
    const token = firmarToken({ sub: 'placeholder', empresaId: 'placeholder', rol: 'ADMIN' });
    const res = await request(app).post('/api/demo/reset').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });

    const empresas = await prisma.empresa.count();
    expect(empresas).toBe(2);
    const cotizaciones = await prisma.cotizacion.count();
    expect(cotizaciones).toBe(24);
  }, 20000);
});
