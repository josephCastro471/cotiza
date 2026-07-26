import { z } from 'zod';
import * as service from './service.js';

const clienteSchema = z.object({
  nombre: z.string().min(1),
  ruc: z.string().min(1),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

async function listar(req, res, next) {
  try { res.json(await service.listar()); } catch (err) { next(err); }
}

async function obtener(req, res, next) {
  try {
    const cliente = await service.obtener(req.params.id);
    if (!cliente) return res.status(404).json({ error: { message: 'Cliente no encontrado.', code: 'NOT_FOUND' } });
    res.json(cliente);
  } catch (err) { next(err); }
}

async function crear(req, res, next) {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del cliente.', code: 'VALIDATION_ERROR' } });
  try { res.status(201).json(await service.crear(parsed.data)); } catch (err) { next(err); }
}

async function actualizar(req, res, next) {
  const parsed = clienteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Revisa los datos del cliente.', code: 'VALIDATION_ERROR' } });
  try {
    const cliente = await service.actualizar(req.params.id, parsed.data);
    if (!cliente) return res.status(404).json({ error: { message: 'Cliente no encontrado.', code: 'NOT_FOUND' } });
    res.json(cliente);
  } catch (err) { next(err); }
}

async function eliminar(req, res, next) {
  try {
    const eliminado = await service.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: { message: 'Cliente no encontrado.', code: 'NOT_FOUND' } });
    res.status(204).send();
  } catch (err) { next(err); }
}

export { listar, obtener, crear, actualizar, eliminar };
