import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../app.js';
import { prisma, runWithTenant } from '../../config/db.js';
import { firmarToken } from '../../utils/jwt.js';

describe('Cotizaciones — acciones de flujo', () => {
  let empresa;
  let vendedor;
  let gerente;
  let cliente;
  let tokenVendedor;
  let tokenGerente;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    empresa = await prisma.empresa.create({ data: { nombre: 'Acciones Co', ruc: '777', prefijoFolio: 'COT-Z' } });
    cliente = await runWithTenant({ empresaId: empresa.id }, () => prisma.cliente.create({ data: { nombre: 'Cliente', ruc: '1' } }));
    vendedor = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.usuario.create({ data: { nombre: 'Vendedor', email: 'vendedor.acc@cotiza.demo', passwordHash: 'x', rol: 'VENDEDOR' } })
    );
    gerente = await runWithTenant({ empresaId: empresa.id }, () =>
      prisma.usuario.create({ data: { nombre: 'Gerente', email: 'gerente.acc@cotiza.demo', passwordHash: 'x', rol: 'GERENTE' } })
    );
    tokenVendedor = firmarToken({ sub: vendedor.id, empresaId: empresa.id, rol: 'VENDEDOR' });
    tokenGerente = firmarToken({ sub: gerente.id, empresaId: empresa.id, rol: 'GERENTE' });
  });

  afterAll(async () => {
    await prisma.cotizacionEvento.deleteMany({ where: { cotizacion: { empresaId: empresa.id } } });
    await prisma.cotizacionLinea.deleteMany({ where: { cotizacion: { empresaId: empresa.id } } });
    await prisma.cotizacion.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.usuario.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.cliente.deleteMany({ where: { empresaId: empresa.id } });
    await prisma.empresa.deleteMany({ where: { id: empresa.id } });
    await prisma.$disconnect();
  });

  async function crearBorrador(token) {
    const res = await request(app)
      .post('/api/cotizaciones')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteId: cliente.id,
        fechaValidez: new Date(Date.now() + 15 * 86400000).toISOString(),
        lineas: [{ descripcion: 'Item', cantidad: 1, precioUnitario: 100, descuentoPct: 0 }],
      });
    return res.body;
  }

  it('un VENDEDOR puede enviar su borrador, pero no puede aprobarlo', async () => {
    const cot = await crearBorrador(tokenVendedor);
    const enviar = await request(app).post(`/api/cotizaciones/${cot.id}/enviar`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(enviar.status).toBe(200);
    expect(enviar.body.estado).toBe('ENVIADO');

    const aprobar = await request(app).post(`/api/cotizaciones/${cot.id}/aprobar`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(aprobar.status).toBe(403);
  });

  it('un GERENTE puede aprobar una cotización ENVIADO y queda un evento con su autoría', async () => {
    const cot = await crearBorrador(tokenVendedor);
    await request(app).post(`/api/cotizaciones/${cot.id}/enviar`).set('Authorization', `Bearer ${tokenVendedor}`);

    const aprobar = await request(app).post(`/api/cotizaciones/${cot.id}/aprobar`).set('Authorization', `Bearer ${tokenGerente}`);
    expect(aprobar.status).toBe(200);
    expect(aprobar.body.estado).toBe('APROBADO');

    const detalle = await request(app).get(`/api/cotizaciones/${cot.id}`).set('Authorization', `Bearer ${tokenGerente}`);
    const eventoAprobada = detalle.body.eventos.find((e) => e.tipo === 'APROBADA');
    expect(eventoAprobada.actor.id).toBe(gerente.id);
  });

  it('rechaza aprobar una cotización que sigue en BORRADOR (transición inválida)', async () => {
    const cot = await crearBorrador(tokenVendedor);
    const aprobar = await request(app).post(`/api/cotizaciones/${cot.id}/aprobar`).set('Authorization', `Bearer ${tokenGerente}`);
    expect(aprobar.status).toBe(409);
    expect(aprobar.body.error.code).toBe('TRANSICION_INVALIDA');
  });

  it('duplicar una cotización RECHAZADA crea un nuevo BORRADOR con folio -R1', async () => {
    const cot = await crearBorrador(tokenVendedor);
    await request(app).post(`/api/cotizaciones/${cot.id}/enviar`).set('Authorization', `Bearer ${tokenVendedor}`);
    await request(app).post(`/api/cotizaciones/${cot.id}/rechazar`).set('Authorization', `Bearer ${tokenGerente}`).send({ comentario: 'Precio muy alto' });

    const duplicar = await request(app).post(`/api/cotizaciones/${cot.id}/duplicar`).set('Authorization', `Bearer ${tokenVendedor}`);
    expect(duplicar.status).toBe(201);
    expect(duplicar.body.estado).toBe('BORRADOR');
    expect(duplicar.body.folio).toBe(`${cot.folio}-R1`);
  });
});
