import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { hashPassword } from '../../utils/password.js';

describe('Auth', () => {
  let empresaA;
  let empresaB;
  let admin;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresaA = await prisma.empresa.create({ data: { nombre: 'Auth A', ruc: '1', prefijoFolio: 'COT-AA' } });
    empresaB = await prisma.empresa.create({ data: { nombre: 'Auth B', ruc: '2', prefijoFolio: 'COT-BB' } });
    const passwordHash = await hashPassword('demo1234');
    admin = await prisma.usuario.create({
      data: { empresaId: empresaA.id, nombre: 'Admin', email: 'admin.auth@cotiza.demo', passwordHash, rol: 'ADMIN' },
    });
    await prisma.usuario.create({
      data: { empresaId: empresaA.id, nombre: 'Vendedor Demo', email: 'vendedor.auth@cotiza.demo', passwordHash, rol: 'VENDEDOR' },
    });
  });

  afterAll(async () => {
    const empresaIds = [empresaA?.id, empresaB?.id].filter(Boolean);
    await prisma.usuario.deleteMany({ where: { empresaId: { in: empresaIds } } });
    await prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } });
    await prisma.$disconnect();
  });

  it('login con credenciales correctas devuelve un token y el usuario', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin.auth@cotiza.demo', password: 'demo1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.rol).toBe('ADMIN');
  });

  it('login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin.auth@cotiza.demo', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('demo-login por rol autentica sin pedir contraseña', async () => {
    const res = await request(app).post('/api/auth/demo-login').send({ rol: 'VENDEDOR' });
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('VENDEDOR');
  });

  it('GET /me devuelve el usuario autenticado', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin.auth@cotiza.demo', password: 'demo1234' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('admin.auth@cotiza.demo');
  });

  it('switch-empresa solo funciona para ADMIN y reemite el token con otra empresaId', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'admin.auth@cotiza.demo', password: 'demo1234' });

    const switchRes = await request(app)
      .post('/api/auth/switch-empresa')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ empresaId: empresaB.id });
    expect(switchRes.status).toBe(200);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${switchRes.body.token}`);
    expect(me.body.empresaId).toBe(empresaB.id);
  });

  it('switch-empresa devuelve 403 para un rol distinto de ADMIN', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'vendedor.auth@cotiza.demo', password: 'demo1234' });
    const switchRes = await request(app)
      .post('/api/auth/switch-empresa')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ empresaId: empresaB.id });
    expect(switchRes.status).toBe(403);
  });
});
