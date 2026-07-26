import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Dashboard', () => {
  let empresa;
  let token;
  let tokenCliente;
  let clienteA;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Dash Co', ruc: '111', prefijoFolio: 'COT-D' } });
    const admin = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Admin', email: 'admin.dash@cotiza.demo', passwordHash: 'x', rol: 'ADMIN' } });
    token = firmarToken({ sub: admin.id, empresaId: empresa.id, rol: 'ADMIN' });
    clienteA = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'C', ruc: '1' } }));
    const clienteB = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'C2', ruc: '2' } }));
    tokenCliente = firmarToken({ sub: 'placeholder-cliente', empresaId: empresa.id, rol: 'CLIENTE', clienteId: clienteA.id });

    const filas = [
      { estado: 'BORRADOR', total: 100, cliente: clienteA },
      { estado: 'BORRADOR', total: 200, cliente: clienteB },
      { estado: 'ENVIADO', total: 300, cliente: clienteB },
      { estado: 'APROBADO', total: 500, cliente: clienteA },
      { estado: 'APROBADO', total: 700, cliente: clienteB },
    ];
    for (const f of filas) {
      // eslint-disable-next-line no-await-in-loop
      await runWithTenant({ empresaId: empresa.id }, () =>
        prisma.cotizacion.create({
          data: { folio: `COT-D-${Math.random()}`, clienteId: f.cliente.id, vendedorId: admin.id, estado: f.estado, subtotal: f.total, iva: 0, total: f.total, fechaValidez: new Date() },
        })
      );
    }
  });

  afterAll(async () => {
    await prisma.cotizacion.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.usuario.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.cliente.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.empresa.deleteMany({ where: { id: empresa.id } });
    await prisma.$disconnect();
  });

  it('devuelve los conteos por estado y el monto aprobado (ADMIN, sin scoping)', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.borradores).toBe(2);
    expect(res.body.enviadas).toBe(1);
    expect(res.body.aprobadas).toBe(2);
    expect(res.body.montoAprobado).toBe(1200);
  });

  // I3: dashboard previously had no role scoping — a CLIENTE saw company-wide
  // KPIs. It must now reflect only its own cotizaciones (via alcanceLectura).
  it('un CLIENTE recibe números limitados a sus propias cotizaciones, no al total del tenant (I3)', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.borradores).toBe(1);
    expect(res.body.enviadas).toBe(0);
    expect(res.body.aprobadas).toBe(1);
    expect(res.body.montoAprobado).toBe(500);
  });
});
