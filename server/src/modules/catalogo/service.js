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
  await prisma.catalogoItem.delete({ where: { id } });
  return true;
}

export { listar, obtener, crear, actualizar, eliminar };
