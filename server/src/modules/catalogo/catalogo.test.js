import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Catálogo CRUD', () => {
  let empresa;
  let tokenGerente;
  let tokenVendedor;
  let tokenCliente;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Catalogo Co', ruc: '999', prefijoFolio: 'COT-CA' } });
    const gerente = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Gerente', email: 'gerente.cat@cotiza.demo', passwordHash: 'x', rol: 'GERENTE' } });
    const vendedor = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Vendedor', email: 'vendedor.cat@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' } });
    tokenGerente = firmarToken({ sub: gerente.id, empresaId: empresa.id, rol: 'GERENTE' });
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
    tokenCliente = firmarToken({ sub: 'placeholder-cliente', empresaId: empresa.id, rol: 'CLIENTE', clienteId: 'placeholder-cliente-id' });
  });

  afterAll(async () => {
    await prisma.cotizacionLinea.deleteMany({ where: { catalogoItem: { empresaId: empresa.id } } });
    await prisma.cotizacionEvento.deleteMany({ where: { cotizacion: { empresaId: empresa.id } } });
    await prisma.cotizacion.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.catalogoItem.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.usuario.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.cliente.deleteMany({ where: { empresaId: empresa.id } });
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

  it('ADMIN/GERENTE/VENDEDOR pueden leer el catálogo, pero un CLIENTE recibe 403 (I4)', async () => {
    const res = await request(app).get('/api/catalogo').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(200);

    const rechazado = await request(app).get('/api/catalogo').set('Authorization', `Bearer ${tokenCliente}`);
    expect(rechazado.status).toBe(403);
  });

  // I2: precioUnitario is a Prisma Decimal — every response path must convert
  // it to a JS number, not let it serialize as a quoted string.
  it('precioUnitario se serializa como number, no como string (I2)', async () => {
    const creado = await request(app)
      .post('/api/catalogo')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({ nombre: 'Ítem numérico', tipo: 'PRODUCTO', precioUnitario: 12.5 });
    expect(creado.status).toBe(201);
    expect(typeof creado.body.precioUnitario).toBe('number');

    const listado = await request(app).get('/api/catalogo').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(listado.body.every((item) => typeof item.precioUnitario === 'number')).toBe(true);

    const obtenido = await request(app).get(`/api/catalogo/${creado.body.id}`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(typeof obtenido.body.precioUnitario).toBe('number');

    const actualizado = await request(app)
      .patch(`/api/catalogo/${creado.body.id}`)
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({ precioUnitario: 20 });
    expect(typeof actualizado.body.precioUnitario).toBe('number');
  });

  // I6: deleting an item still referenced by a cotización línea used to
  // surface Prisma's raw P2003 foreign-key error as an uncaught 500.
  it('eliminar un ítem con líneas de cotización asociadas devuelve 409 (I6)', async () => {
    const item = await request(app)
      .post('/api/catalogo')
      .set('Authorization', `Bearer ${tokenGerente}`)
      .send({ nombre: 'Ítem referenciado', tipo: 'PRODUCTO', precioUnitario: 30 });

    const cliente = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'Cliente Catálogo', ruc: '3' } }));

    const cotizacion = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: cliente.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ catalogoItemId: item.body.id, descripcion: 'Item referenciado', cantidad: 1, precioUnitario: 30, descuentoPct: 0 }],
      });
    expect(cotizacion.status).toBe(201);

    const eliminar = await request(app).delete(`/api/catalogo/${item.body.id}`).set('Authorization', `Bearer ${tokenGerente}`);
    expect(eliminar.status).toBe(409);
    expect(eliminar.body.error.code).toBe('FK_CONSTRAINT');
  });
});
