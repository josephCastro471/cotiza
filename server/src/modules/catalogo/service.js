import { prisma } from '../../config/db.js';

async function listar() {
  return prisma.catalogoItem.findMany({ orderBy: { nombre: 'asc' } });
}

async function obtener(id) {
  return prisma.catalogoItem.findUnique({ where: { id } });
}

async function crear(datos) {
  return prisma.catalogoItem.create({ data: datos });
}

async function actualizar(id, datos) {
  const existente = await prisma.catalogoItem.findUnique({ where: { id } });
  if (!existente) return null;
  return prisma.catalogoItem.update({ where: { id }, data: datos });
}

async function eliminar(id) {
  const existente = await prisma.catalogoItem.findUnique({ where: { id } });
  if (!existente) return false;
  try {
    await prisma.catalogoItem.delete({ where: { id } });
  } catch (err) {
    // P2003 = Prisma foreign-key constraint violation. An ítem still
    // referenced by cotización líneas used to surface this as a raw,
    // uncaught 500; turn it into a clear, actionable 409 instead.
    if (err.code === 'P2003') {
      const e = new Error('Este ítem de catálogo tiene líneas de cotización asociadas. Elimínalo de esas cotizaciones antes de borrarlo.');
      e.status = 409;
      e.code = 'FK_CONSTRAINT';
      throw e;
    }
    throw err;
  }
  return true;
}

export { listar, obtener, crear, actualizar, eliminar };
