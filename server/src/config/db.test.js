import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma, runWithTenant } from './db.js';

describe('tenant-scoped Prisma client', () => {
  let empresaA;
  let empresaB;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.cotizacionEvento.deleteMany(),
      prisma.cotizacionLinea.deleteMany(),
      prisma.cotizacion.deleteMany(),
      prisma.catalogoItem.deleteMany(),
      prisma.usuario.deleteMany(),
      prisma.cliente.deleteMany(),
      prisma.empresa.deleteMany(),
    ]);
    empresaA = await prisma.empresa.create({
      data: { nombre: 'Empresa A', ruc: '000A', prefijoFolio: 'COT-A' },
    });
    empresaB = await prisma.empresa.create({
      data: { nombre: 'Empresa B', ruc: '000B', prefijoFolio: 'COT-B' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('injects empresaId on create, so a row is only visible within its own tenant context', async () => {
    const clienteA = await runWithTenant({ empresaId: empresaA.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Cliente de A', ruc: '111' } })
    );
    expect(clienteA.empresaId).toBe(empresaA.id);

    const visibleFromA = await runWithTenant({ empresaId: empresaA.id }, () =>
      prisma.cliente.findUnique({ where: { id: clienteA.id } })
    );
    expect(visibleFromA).not.toBeNull();

    const visibleFromB = await runWithTenant({ empresaId: empresaB.id }, () =>
      prisma.cliente.findUnique({ where: { id: clienteA.id } })
    );
    expect(visibleFromB).toBeNull();
  });

  it('scopes findMany so tenant B never sees tenant A rows', async () => {
    await runWithTenant({ empresaId: empresaA.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Solo A', ruc: '222' } })
    );
    await runWithTenant({ empresaId: empresaB.id }, () =>
      prisma.cliente.create({ data: { nombre: 'Solo B', ruc: '333' } })
    );

    const clientesDeB = await runWithTenant({ empresaId: empresaB.id }, () => prisma.cliente.findMany());
    expect(clientesDeB.every((c) => c.empresaId === empresaB.id)).toBe(true);
    expect(clientesDeB.some((c) => c.nombre === 'Solo A')).toBe(false);
  });

  it('queries outside any tenant context are not auto-scoped (used only by scripts, never by request handlers)', async () => {
    const todos = await prisma.cliente.findMany();
    expect(todos.length).toBeGreaterThanOrEqual(2);
  });
});
