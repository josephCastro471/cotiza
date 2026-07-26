import { z } from 'zod';
import * as service from './service.js';

const itemSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(['PRODUCTO', 'SERVICIO']),
  precioUnitario: z.number().nonnegative(),
});

// Prisma represents the Decimal-typed precioUnitario column as a Decimal.js
// instance, which serializes to JSON as a quoted string (e.g. "8.5") rather
// than a number. Every other module returning Decimal fields (cotizaciones,
// dashboard) converts them to plain numbers at the HTTP boundary; catálogo
// was returning raw Prisma rows, so precioUnitario reached the client as a
// string. Mirror the same aNumero/serializar pattern here.
function aNumero(valor) {
  return valor === null || valor === undefined ? valor : Number(valor);
}

function serializarItem(item) {
  if (!item) return item;
  return { ...item, precioUnitario: aNumero(item.precioUnitario) };
}

async function listar(req, res, next) {
  try { res.json((await service.listar()).map(serializarItem)); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const item = await service.obtener(req.params.id);
    if (!item) return res.status(404).json({ error: { message: 'Ítem de catálogo no encontrado.', code: 'NOT_FOUND' } });
    res.json(serializarItem(item));
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del ítem.', code: 'VALIDATION_ERROR' } });
  try { res.status(201).json(serializarItem(await service.crear(parsed.data))); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del ítem.', code: 'VALIDATION_ERROR' } });
  try {
    const item = await service.actualizar(req.params.id, parsed.data);
    if (!item) return res.status(404).json({ error: { message: 'Ítem de catálogo no encontrado.', code: 'NOT_FOUND' } });
    res.json(serializarItem(item));
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    const eliminado = await service.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: { message: 'Ítem de catálogo no encontrado.', code: 'NOT_FOUND' } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export { listar, obtener, crear, actualizar, eliminar };
