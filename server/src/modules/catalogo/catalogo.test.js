import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Catálogo CRUD', () => {
  let empresa;
  let tokenGerente;
  let tokenVendedor;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Catalogo Co', ruc: '999', prefijoFolio: 'COT-CA' } });
    const gerente = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Gerente', email: 'gerente.cat@cotiza.demo', passwordHash: 'x', rol: 'GERENTE' } });
    const vendedor = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Vendedor', email: 'vendedor.cat@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' } });
    tokenGerente = firmarToken({ sub: gerente.id, empresaId: empresa.id, rol: 'GERENTE' });
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
  });

  afterAll(async () => {
    await prisma.catalogoItem.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.usuario.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.empresa.deleteMany({ where: { id: empresa.id } });
    await prisma.$disconnect();
  });

  it('un GERENTE puede crear ítems de catálogo', async () => {
    const res = await request(app)
      .post('/api/catalogo')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({ nombre: 'Servicio nuevo', tipo: 'SERVICIO', precioUnitario: 100 });
    expect(res.status).toBe(201);
  });

  it('un VENDEDOR no puede crear ítems de catálogo', async () => {
    const res = await request(app)
      .post('/api/catalogo')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'No permitido', tipo: 'PRODUCTO', precioUnitario: 10 });
    expect(res.status).toBe(403);
  });

  it('cualquier rol autenticado puede leer el catálogo', async () => {
    const res = await request(app).get('/api/catalogo').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(200);
  });
});
