import { prisma } from '../../config/db.js';

async function listar() {
  return prisma.cliente.findMany({ orderBy: { nombre: 'asc' } });
}

async function obtener(id) {
  return prisma.cliente.findUnique({ where: { id } });
}

async function crear(datos) {
  return prisma.cliente.create({ data: datos });
}

async function actualizar(id, datos) {
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) return null;
  return prisma.cliente.update({ where: { id }, data: datos });
}

async function eliminar(id) {
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) return false;
  try {
    await prisma.cliente.delete({ where: { id } });
  } catch (err) {
    // P2003 = Prisma foreign-key constraint violation. A cliente with
    // cotizaciones still referencing it used to surface this as a raw,
    // uncaught 500; turn it into a clear, actionable 409 instead.
    if (err.code === 'P2003') {
      const e = new Error('Este cliente tiene cotizaciones asociadas. Archívalo o reasigna sus cotizaciones antes de eliminarlo.');
      e.status = 409;
      e.code = 'FK_CONSTRAINT';
      throw e;
    }
    throw err;
  }
  return true;
}

export { listar, obtener, crear, actualizar, eliminar };
