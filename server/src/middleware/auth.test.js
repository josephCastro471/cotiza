import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from 'vitest';
import { requireAuth } from './auth.js';
import { firmarToken } from '../utils/jwt.js';
import { tenantContext } from '../config/db.js';

function buildApp() {
  const app = express();
  app.get('/protegido', requireAuth, (req, res) => {
    const store = tenantContext.getStore();
    res.json({ usuario: req.usuario, tenantActivo: store ? store.empresaId : null });
  });
  return app;
}

describe('requireAuth', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects requests without a token', async () => {
    const res = await request(buildApp()).get('/protegido');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_TOKEN');
  });

  it('rejects an invalid token', async () => {
    const res = await request(buildApp()).get('/protegido').set('Authorization', 'Bearer basura');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('accepts a valid token and activates the tenant context', async () => {
    const token = firmarToken({ sub: 'u1', empresaId: 'e1', rol: 'ADMIN' });
    const res = await request(buildApp()).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario).toEqual({ id: 'u1', empresaId: 'e1', rol: 'ADMIN' });
    expect(res.body.tenantActivo).toBe('e1');
  });
});
