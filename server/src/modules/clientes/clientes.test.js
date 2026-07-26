import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Clientes CRUD', () => {
  let empresa;
  let tokenAdmin;
  let tokenVendedor;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Clientes Co', ruc: '888', prefijoFolio: 'COT-CL' } });
    const admin = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Admin', email: 'admin.cli@cotiza.demo', passwordHash: 'x', rol: 'ADMIN' } });
    const vendedor = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Vendedor', email: 'vendedor.cli@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' } });
    tokenAdmin = firmarToken({ sub: admin.id, empresaId: empresa.id, rol: 'ADMIN' });
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
  });

  afterAll(async () => {
    await prisma.cliente.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.usuario.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.empresa.deleteMany({ where: { id: empresa.id } });
    await prisma.$disconnect();
  });

  it('un VENDEDOR puede crear y listar clientes', async () => {
    const crear = await request(app).post('/api/clientes').set('Authorization', `Bearer ${tokenVendedor}`).send({ nombre: 'Cliente Nuevo', ruc: '0999999999001' });
    expect(crear.status).toBe(201);

    const listar = await request(app).get('/api/clientes').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(listar.body.some((c) => c.nombre === 'Cliente Nuevo')).toBe(true);
  });

  it('un VENDEDOR no puede eliminar un cliente (solo ADMIN/GERENTE)', async () => {
    const crear = await request(app).post('/api/clientes').set('Authorization', `Bearer ${tokenVendedor}`).send({ nombre: 'Para Borrar', ruc: '0988888888001' });
    const eliminar = await request(app).delete(`/api/clientes/${crear.body.id}`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(eliminar.status).toBe(403);

    const eliminarAdmin = await request(app).delete(`/api/clientes/${crear.body.id}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(eliminarAdmin.status).toBe(204);
  });
});
