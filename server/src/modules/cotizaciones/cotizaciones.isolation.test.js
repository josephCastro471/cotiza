import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

// Regression tests for the whole-branch review's multi-tenant / role-isolation
// findings (C1-C4, I1, I11). Each of these was invisible from an individual
// task's diff and only showed up when the cotizaciones module was reviewed as
// a whole, so they're grouped in their own file rather than folded into
// cotizaciones.crud.test.js / cotizaciones.acciones.test.js.
describe('Cotizaciones — aislamiento multi-tenant y por rol', () => {
  let empresa;
  let otraEmpresa;
  let gerente;
  let vendedor;
  let otroVendedor;
  let clienteA;
  let clienteB;
  let clienteAjeno;
  let cotVendedor;
  let cotOtroVendedor;
  let tokenGerente;
  let tokenVendedor;
  let tokenOtroVendedor;
  let tokenClienteA;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    empresa = await prisma.empresa.create({ data: { nombre: 'Aislamiento Co', ruc: '444', prefijoFolio: 'COT-ISO' } });
    otraEmpresa = await prisma.empresa.create({ data: { nombre: 'Otra Aislamiento Co', ruc: '445', prefijoFolio: 'COT-ISOB' } });

    clienteAjeno = await runWithTenant({ empresaId: otraEmpresa.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Cliente Ajeno', ruc: '9' } })
    );

    await runWithTenant({ empresaId: empresa.id }, async () => {
      clienteA = await prisma.cliente.create({ data: { nombre: 'Cliente A', ruc: '1' } });
      clienteB = await prisma.cliente.create({ data: { nombre: 'Cliente B', ruc: '2' } });
      gerente = await prisma.usuario.create({
        data: { nombre: 'Gerente Iso', email: 'gerente.iso@cotiza.demo', passwordHash: 'hash-secreto', rol: 'GERENTE' },
      });
      vendedor = await prisma.usuario.create({
        data: { nombre: 'Vendedor Iso', email: 'vendedor.iso@cotiza.demo', passwordHash: 'hash-secreto', rol: 'VENDEDOR' },
      });
      otroVendedor = await prisma.usuario.create({
        data: { nombre: 'Otro Vendedor Iso', email: 'otro.vendedor.iso@cotiza.demo', passwordHash: 'hash-secreto', rol: 'VENDEDOR' },
      });
    });

    tokenGerente = firmarToken({ sub: gerente.id, empresaId: empresa.id, rol: 'GERENTE' });
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
    tokenOtroVendedor = firmarToken({ sub: otroVendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
    tokenClienteA = firmarToken({ sub: 'placeholder-cliente-a', empresaId: empresa.id, rol: 'CLIENTE', clienteId: clienteA.id });

    async function crearBorrador(token, clienteId) {
      const res = await request(app)
        .post('/api/cotizaciones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clienteId,
          fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
          lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 50, descuentoPct: 0 }],
        });
      return res.body;
    }

    cotVendedor = await crearBorrador(tokenVendedor, clienteA.id);
    cotOtroVendedor = await crearBorrador(tokenOtroVendedor, clienteB.id);
  });

  afterAll(async () => {
    const empresaIds = [empresa.id, otraEmpresa.id].filter(Boolean);
    await prisma.cotizacionEvento.deleteMany({ where: { cotizacion: { empresaId: { in: empresaIds } } } });
    await prisma.cotizacionLinea.deleteMany({ where: { cotizacion: { empresaId: { in: empresaIds } } } });
    await prisma.cotizacion.deleteMany({ where: { empresaId: { in: empresaIds } } });
    await prisma.usuario.deleteMany({ where: { empresaId: { in: empresaIds } } });
    await prisma.cliente.deleteMany({ where: { empresaId: { in: empresaIds } } });
    await prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } });
    await prisma.$disconnect();
  });

  // --- C1: passwordHash must never leak in a nested vendedor/actor object ---
  it('C1: passwordHash nunca aparece en GET /cotizaciones, GET /:id, ni en una acción como aprobar', async () => {
    const lista = await request(app).get('/api/cotizaciones').set('Authorization', `Bearer ${tokenVendedor}`);
    expect(lista.status).toBe(200);
    expect(JSON.stringify(lista.body)).not.toContain('passwordHash');
    expect(JSON.stringify(lista.body)).not.toContain('hash-secreto');

    const detalle = await request(app).get(`/api/cotizaciones/${cotVendedor.id}`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(detalle.status).toBe(200);
    expect(JSON.stringify(detalle.body)).not.toContain('passwordHash');
    expect(JSON.stringify(detalle.body)).not.toContain('hash-secreto');

    await request(app).post(`/api/cotizaciones/${cotVendedor.id}/enviar`).set('Authorization', `Bearer ${tokenVendedor}`);
    const aprobar = await request(app).post(`/api/cotizaciones/${cotVendedor.id}/aprobar`).set('Authorization', `Bearer ${tokenGerente}`);
    expect(aprobar.status).toBe(200);
    expect(JSON.stringify(aprobar.body)).not.toContain('passwordHash');
    expect(JSON.stringify(aprobar.body)).not.toContain('hash-secreto');
  });

  // --- C2: PATCH must not accept another tenant's clienteId ---
  it('C2: PATCH rechaza un clienteId de otra empresa y no modifica la cotización', async () => {
    const creada = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: clienteA.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 10, descuentoPct: 0 }],
      });
    expect(creada.status).toBe(201);

    const patch = await request(app)
      .patch(`/api/cotizaciones/${creada.body.id}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: clienteAjeno.id,
        lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 10, descuentoPct: 0 }],
      });
    expect(patch.status).toBe(400);

    const sinCambios = await prisma.cotizacion.findUnique({ where: { id: creada.body.id } });
    expect(sinCambios.clienteId).toBe(clienteA.id);
  });

  // --- C3: ?clienteId= query filter must not override the CLIENTE scope guard ---
  it('C3: un CLIENTE no puede usar ?clienteId= para ver cotizaciones de otro cliente', async () => {
    const res = await request(app)
      .get(`/api/cotizaciones?clienteId=${clienteB.id}`)
      .set('Authorization', `Bearer ${tokenClienteA}`);
    expect(res.status).toBe(200);
    expect(res.body.every((c) => c.clienteId === clienteA.id)).toBe(true);
    expect(res.body.some((c) => c.clienteId === clienteB.id)).toBe(false);
  });

  // --- C4: alcanceLectura must fail closed, not open ---
  it('C4: un token CLIENTE sin clienteId es rechazado (403), no cae a una lectura sin alcance', async () => {
    const tokenSinClienteId = firmarToken({ sub: 'placeholder-sin-cliente', empresaId: empresa.id, rol: 'CLIENTE' });
    const res = await request(app).get('/api/cotizaciones').set('Authorization', `Bearer ${tokenSinClienteId}`);
    expect(res.status).toBe(403);
  });

  it('C4/I11: un token CLIENTE con clienteId válido obtiene 200 con solo sus propias filas', async () => {
    const res = await request(app).get('/api/cotizaciones').set('Authorization', `Bearer ${tokenClienteA}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((c) => c.clienteId === clienteA.id)).toBe(true);
  });

  // --- I5: invalid query filters must return a normal 400, not a raw Prisma 500 ---
  it('I5: un filtro ?estado= inválido devuelve 400 VALIDATION_ERROR, no un 500 crudo de Prisma', async () => {
    const res = await request(app)
      .get('/api/cotizaciones?estado=NO_EXISTE')
      .set('Authorization', `Bearer ${tokenVendedor}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // --- I1: write paths must respect the same read scope as listar/obtener ---
  it('I1: un VENDEDOR que recibe 404 en GET de otra cotización también recibe 404 en PATCH y en la transición', async () => {
    const detalle = await request(app)
      .get(`/api/cotizaciones/${cotOtroVendedor.id}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);
    expect(detalle.status).toBe(404);

    const patch = await request(app)
      .patch(`/api/cotizaciones/${cotOtroVendedor.id}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ lineas: [{ descripcion: 'Intento ajeno', cantidad: 1, precioUnitario: 1, descuentoPct: 0 }] });
    expect(patch.status).toBe(404);

    const enviar = await request(app)
      .post(`/api/cotizaciones/${cotOtroVendedor.id}/enviar`)
      .set('Authorization', `Bearer ${tokenVendedor}`);
    expect(enviar.status).toBe(404);

    const duplicar = await request(app)
      .post(`/api/cotizaciones/${cotOtroVendedor.id}/duplicar`)
      .set('Authorization', `Bearer ${tokenVendedor}`);
    expect(duplicar.status).toBe(404);
  });
});
