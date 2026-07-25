import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { hashPassword } from '../../utils/password.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Cotizaciones CRUD', () => {
  let empresa;
  let vendedor;
  let cliente;
  let tokenVendedor;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({
      data: { nombre: 'CRUD Co', ruc: '555', prefijoFolio: 'COT-X', siguienteFolio: 1 },
    });
    cliente = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Cliente CRUD', ruc: '1' } })
    );
    vendedor = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.usuario.create({
        data: { nombre: 'Vendedor CRUD', email: 'vendedor.crud@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' },
      })
    );
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('crea un borrador con líneas y calcula los totales en el servidor', async () => {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: cliente.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [
          { descripcion: 'Cemento', cantidad: 10, precioUnitario: 8.5, descuentoPct: 0 },
          { descripcion: 'Varilla', cantidad: 5, precioUnitario: 14.2, descuentoPct: 10 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('BORRADOR');
    expect(res.body.folio).toBe('COT-X-0001');
    expect(res.body.subtotal).toBe(148.9); // 85 + 63.9
    expect(res.body.iva).toBe(22.34);
    expect(res.body.total).toBe(171.24);
  });

  it('rechaza crear una cotización con datos de otra empresa (clienteId ajeno)', async () => {
    const otraEmpresa = await prisma.empresa.create({
      data: { nombre: 'Otra Co', ruc: '556', prefijoFolio: 'COT-Y' },
    });
    const clienteAjeno = await runWithTenant({ empresaId: otraEmpresa.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Cliente ajeno', ruc: '2' } })
    );

    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: clienteAjeno.id,
        fechaValidez: new Date().toISOString(),
        lineas: [{ descripcion: 'X', cantidad: 1, precioUnitario: 1, descuentoPct: 0 }],
      });

    expect(res.status).toBe(400);
  });

  it('permite editar un BORRADOR pero no una cotización ENVIADO', async () => {
    const creada = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        clienteId: cliente.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 10, descuentoPct: 0 }],
      });

    const editar = await request(app)
      .patch(`/api/cotizaciones/${creada.body.id}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ lineas: [{ descripcion: 'Item editado', cantidad: 2, precioUnitario: 10, descuentoPct: 0 }] });
    expect(editar.status).toBe(200);
    expect(editar.body.subtotal).toBe(20);

    await prisma.cotizacion.update({ where: { id: creada.body.id }, data: { estado: 'ENVIADO' } });

    const editarEnviada = await request(app)
      .patch(`/api/cotizaciones/${creada.body.id}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ lineas: [] });
    expect(editarEnviada.status).toBe(409);
  });

  it('lista solo las cotizaciones propias para un VENDEDOR', async () => {
    const otroVendedor = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.usuario.create({
        data: { nombre: 'Otro Vendedor', email: 'otro.vendedor@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' },
      })
    );
    const tokenOtro = firmarToken({ sub: otroVendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });

    await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${tokenOtro}`)
      .send({
        clienteId: cliente.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ descripcion: 'Solo del otro', cantidad: 1, precioUnitario: 5, descuentoPct: 0 }],
      });

    const listaDeOtro = await request(app).get('/api/cotizaciones').set('Authorization', `Bearer ${tokenOtro}`);
    expect(listaDeOtro.body.every((c) => c.vendedorId === otroVendedor.id)).toBe(true);
  });
});
