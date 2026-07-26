import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Demo reset', () => {
  const demoModeOriginal = process.env.DEMO_MODE;

  afterAll(async () => {
    process.env.DEMO_MODE = demoModeOriginal;
    await prisma.$disconnect();
  });

  it('reseeds the database and returns ok when DEMO_MODE is enabled and caller is ADMIN', async () => {
    process.env.DEMO_MODE = 'true';
    const token = firmarToken({ sub: 'placeholder', empresaId: 'placeholder', rol: 'ADMIN' });
    const res = await request(app).post('/api/demo/reset').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });

    const empresas = await prisma.empresa.count();
    expect(empresas).toBe(2);
    const cotizaciones = await prisma.cotizacion.count();
    expect(cotizaciones).toBe(24);
  }, 20000);

  it('rejects a non-ADMIN caller even when DEMO_MODE is enabled', async () => {
    process.env.DEMO_MODE = 'true';
    const token = firmarToken({ sub: 'placeholder', empresaId: 'placeholder', rol: 'VENDEDOR' });
    const res = await request(app).post('/api/demo/reset').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('404s when DEMO_MODE is not enabled, even for an ADMIN caller', async () => {
    delete process.env.DEMO_MODE;
    const token = firmarToken({ sub: 'placeholder', empresaId: 'placeholder', rol: 'ADMIN' });
    const res = await request(app).post('/api/demo/reset').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
