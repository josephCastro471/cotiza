import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('PDF export', () => {
  let empresa;
  let token;
  let cotizacionId;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'PDF Co', ruc: '222', prefijoFolio: 'COT-P' } });
    const admin = await prisma.usuario.create({ data: { empresaId: empresa.id, nombre: 'Admin', email: 'admin.pdf@cotiza.demo', passwordHash: 'x', rol: 'ADMIN' } });
    token = firmarToken({ sub: admin.id, empresaId: empresa.id, rol: 'ADMIN' });
    const cliente = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'Cliente PDF', ruc: '1' } }));
    const cot = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.cotizacion.create({
        data: {
          folio: 'COT-P-0001',
          clienteId: cliente.id,
          vendedorId: admin.id,
          estado: 'APROBADO',
          subtotal: 100,
          iva: 15,
          total: 115,
          fechaValidez: new Date(),
          lineas: { create: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 100, descuentoPct: 0, subtotal: 100, orden: 1 }] },
        },
      })
    );
    cotizacionId = cot.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('descarga un PDF válido para una cotización existente', async () => {
    const res = await request(app).get(`/api/cotizaciones/${cotizacionId}/pdf`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });
});
