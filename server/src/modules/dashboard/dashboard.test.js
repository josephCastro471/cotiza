import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Dashboard', () => {
  let empresa;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Dash Co', ruc: '111', prefijoFolio: 'COT-D' } });
    const admin = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Admin', email: 'admin.dash@cotiza.demo', passwordHash: 'x', rol: 'ADMIN' } });
    token = firmarToken({ sub: admin.id, empresaId: empresa.id, rol: 'ADMIN' });
    const cliente = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'C', ruc: '1' } }));

    const filas = [
      { estado: 'BORRADOR', total: 100 },
      { estado: 'BORRADOR', total: 200 },
      { estado: 'ENVIADO', total: 300 },
      { estado: 'APROBADO', total: 500 },
      { estado: 'APROBADO', total: 700 },
    ];
    for (const f of filas) {
      // eslint-disable-next-line no-await-in-loop
      await runWithTenant({ empresaId: empresa.id }, () =>
        prisma.cotizacion.create({
          data: { folio: `COT-D-${Math.random()}`, clienteId: cliente.id, vendedorId: admin.id, estado: f.estado, subtotal: f.total, iva: 0, total: f.total, fechaValidez: new Date() },
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

  it('devuelve los conteos por estado y el monto aprobado', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.borradores).toBe(2);
    expect(res.body.enviadas).toBe(1);
    expect(res.body.aprobadas).toBe(2);
    expect(res.body.montoAprobado).toBe(1200);
  });
});
