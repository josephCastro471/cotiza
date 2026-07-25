import request from 'supertest';
import express from 'express';
import { describe, it, expect } from 'vitest';
import { requireRole } from './requireRole.js';

function buildApp(rolDelUsuario) {
  const app = express();
  app.get('/solo-admin', (req, res, next) => {
    req.usuario = { id: 'u1', empresaId: 'e1', rol: rolDelUsuario };
    next();
  }, requireRole('ADMIN'), (req, res) => res.json({ ok: true }));
  return app;
}

describe('requireRole', () => {
  it('allows a matching role through', async () => {
    const res = await request(buildApp('ADMIN')).get('/solo-admin');
    expect(res.status).toBe(200);
  });

  it('rejects a non-matching role with 403', async () => {
    const res = await request(buildApp('VENDEDOR')).get('/solo-admin');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
