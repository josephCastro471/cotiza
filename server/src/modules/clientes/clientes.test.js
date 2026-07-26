import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Clientes CRUD', () => {
  let empresa;
  let tokenAdmin;
  let tokenVendedor;
  let tokenCliente;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Clientes Co', ruc: '888', prefijoFolio: 'COT-CL' } });
    const admin = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Admin', email: 'admin.cli@cotiza.demo', passwordHash: 'x', rol: 'ADMIN' } });
    const vendedor = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Vendedor', email: 'vendedor.cli@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' } });
    tokenAdmin = firmarToken({ sub: admin.id, empresaId: empresa.id, rol: 'ADMIN' });
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
    tokenCliente = firmarToken({ sub: 'placeholder-cliente', empresaId: empresa.id, rol: 'CLIENTE', clienteId: 'placeholder-cliente-id' });
  });

  afterAll(async () => {
    await prisma.cotizacionEvento.deleteMany({ where: { cotizacion: { empresaId: empresa.id } } });
    await prisma.cotizacionLinea.deleteMany({ where: { cotizacion: { empresaId: empresa.id } } });
    await prisma.cotizacion.deleteMany({ where: { empresaId: empresa.id } });
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

  it('un CLIENTE recibe 403 en GET /clientes y GET /clientes/:id (I4)', async () => {
    const crear = await request(app).post('/api/clientes').set('Authorization', `Bearer ${tokenVendedor}`).send({ nombre: 'Visible Solo Interno', ruc: '0977777777001' });

    const listar = await request(app).get('/api/clientes').set('Authorization', `Bearer ${tokenCliente}`);
    expect(listar.status).toBe(403);

    const obtener = await request(app).get(`/api/clientes/${crear.body.id}`).set('Authorization', `Bearer ${tokenCliente}`);
    expect(obtener.status).toBe(403);
  });

  // I6: deleting a cliente still referenced by a cotización used to surface
  // Prisma's raw P2003 foreign-key error as an uncaught 500.
  it('eliminar un cliente con cotizaciones asociadas devuelve 409 (I6)', async () => {
    const cliente = await request(app).post('/api/clientes').set('Authorization', `Bearer ${tokenVendedor}`).send({ nombre: 'Con Cotización', ruc: '0966666666001' });

    const cotizacion = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: cliente.body.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 10, descuentoPct: 0 }],
      });
    expect(cotizacion.status).toBe(201);

    const eliminar = await request(app).delete(`/api/clientes/${cliente.body.id}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(eliminar.status).toBe(409);
    expect(eliminar.body.error.code).toBe('FK_CONSTRAINT');
  });
});
