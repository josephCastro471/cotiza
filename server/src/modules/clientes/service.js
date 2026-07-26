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
  await prisma.cliente.delete({ where: { id } });
  return true;
}

export { listar, obtener, crear, actualizar, eliminar };
