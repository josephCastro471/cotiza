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

function errorItemEnUso() {
  const e = new Error('Este ítem de catálogo tiene líneas de cotización asociadas. Elimínalo de esas cotizaciones antes de borrarlo.');
  e.status = 409;
  e.code = 'FK_CONSTRAINT';
  return e;
}

async function eliminar(id) {
  const existente = await prisma.catalogoItem.findUnique({ where: { id } });
  if (!existente) return false;

  // CotizacionLinea.catalogoItemId's FK is ON DELETE SET NULL at the DB level
  // (so historical cotización lines survive if a catalog item is ever
  // pruned), which means Prisma would happily delete an in-use item and null
  // out the reference instead of raising P2003. That would silently corrupt
  // already-quoted lines (losing their catalog linkage), so the "can't delete
  // while referenced" rule has to be enforced explicitly here rather than
  // relying on the DB constraint to reject it.
  const enUso = await prisma.cotizacionLinea.count({ where: { catalogoItemId: id } });
  if (enUso > 0) throw errorItemEnUso();

  try {
    await prisma.catalogoItem.delete({ where: { id } });
  } catch (err) {
    // Defense in depth: if some other FK relationship to CatalogoItem is ever
    // added without a SET NULL/CASCADE action, don't let it surface as a raw
    // 500 either.
    if (err.code === 'P2003') throw errorItemEnUso();
    throw err;
  }
  return true;
}

export { listar, obtener, crear, actualizar, eliminar };
