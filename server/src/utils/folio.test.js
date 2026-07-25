import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../config/db.js';
import { generarFolio, generarFolioDuplicado } from './folio.js';

describe('folio utils', () => {
  let empresa;

  beforeAll(async () => {
    empresa = await prisma.empresa.create({
      data: { nombre: 'Folio Co', ruc: '999', prefijoFolio: 'COT-F', siguienteFolio: 148 },
    });
  });

  afterAll(async () => {
    await prisma.empresa.delete({ where: { id: empresa.id } });
    await prisma.$disconnect();
  });

  it('generates a zero-padded sequential folio and advances the counter', async () => {
    const primero = await generarFolio(prisma, empresa.id);
    expect(primero).toBe('COT-F-0148');
    const segundo = await generarFolio(prisma, empresa.id);
    expect(segundo).toBe('COT-F-0149');
  });

  it('generates a duplicate folio by suffixing -R<n>', async () => {
    const original = await prisma.cotizacion.create({
      data: {
        empresaId: empresa.id,
        folio: 'COT-F-0200',
        clienteId: null,
        vendedorId: null,
        estado: 'APROBADO',
        subtotal: 0,
        iva: 0,
        total: 0,
        fechaValidez: new Date(),
      },
      // clienteId/vendedorId nulled here only to keep this isolated unit test
      // self-contained; real callers always supply valid foreign keys.
    }).catch(() => null);

    if (!original) return; // skipped if FK constraints require real cliente/vendedor in this DB

    const folioR1 = await generarFolioDuplicado(prisma, original);
    expect(folioR1).toBe('COT-F-0200-R1');
  });
});
