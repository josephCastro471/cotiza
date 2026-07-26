import { z } from 'zod';
import * as service from './service.js';

const itemSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(['PRODUCTO', 'SERVICIO']),
  precioUnitario: z.number().nonnegative(),
});

async function listar(req, res, next) {
  try { res.json(await service.listar()); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const item = await service.obtener(req.params.id);
    if (!item) return res.status(404).json({ error: { message: 'Ítem de catálogo no encontrado.', code: 'NOT_FOUND' } });
    res.json(item);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del ítem.', code: 'VALIDATION_ERROR' } });
  try { res.status(201).json(await service.crear(parsed.data)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del ítem.', code: 'VALIDATION_ERROR' } });
  try {
    const item = await service.actualizar(req.params.id, parsed.data);
    if (!item) return res.status(404).json({ error: { message: 'Ítem de catálogo no encontrado.', code: 'NOT_FOUND' } });
    res.json(item);
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
