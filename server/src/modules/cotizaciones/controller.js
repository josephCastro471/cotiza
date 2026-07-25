import { z } from 'zod';
import * as service from './service.js';

const lineaSchema = z.object({
  catalogoItemId: z.string().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  descuentoPct: z.number().min(0).max(100).optional().default(0),
});

const crearSchema = z.object({
  clienteId: z.string().min(1),
  fechaValidez: z.string(),
  lineas: z.array(lineaSchema).min(1),
});

// Separate schema for actualizar(): clienteId/fechaValidez stay optional (an
// edit may only touch lineas), and lineas intentionally has no .min(1) floor
// — an update may legitimately submit an empty lineas array (e.g. clearing
// the lines of a still-editable BORRADOR), and that request must reach the
// service's estado guard rather than being rejected by body validation.
const actualizarSchema = z.object({
  clienteId: z.string().min(1).optional(),
  fechaValidez: z.string().optional(),
  lineas: z.array(lineaSchema),
});

// Prisma represents Decimal-typed columns (subtotal, iva, total, cantidad,
// precioUnitario, descuentoPct) as Decimal.js instances. Those serialize to
// JSON as quoted strings (e.g. "148.9") rather than numbers, so we convert
// them to plain numbers here at the HTTP boundary before responding.
function aNumero(valor) {
  return valor === null || valor === undefined ? valor : Number(valor);
}

function serializarLinea(linea) {
  return {
    ...linea,
    cantidad: aNumero(linea.cantidad),
    precioUnitario: aNumero(linea.precioUnitario),
    descuentoPct: aNumero(linea.descuentoPct),
    subtotal: aNumero(linea.subtotal),
  };
}

function serializarCotizacion(cotizacion) {
  if (!cotizacion) return cotizacion;
  return {
    ...cotizacion,
    subtotal: aNumero(cotizacion.subtotal),
    descuentoTotal: aNumero(cotizacion.descuentoTotal),
    iva: aNumero(cotizacion.iva),
    total: aNumero(cotizacion.total),
    lineas: Array.isArray(cotizacion.lineas) ? cotizacion.lineas.map(serializarLinea) : cotizacion.lineas,
  };
}

async function listar(req, res, next) {
  try {
    const cotizaciones = await service.listar({ usuario: req.usuario, filtros: req.query });
    res.json(cotizaciones.map(serializarCotizacion));
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const cotizacion = await service.obtener({ usuario: req.usuario, id: req.params.id });
    if (!cotizacion) return res.status(404).json({ error: { message: 'Cotización no encontrada.', code: 'NOT_FOUND' } });
    res.json(serializarCotizacion(cotizacion));
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Revisa los datos de la cotización.', code: 'VALIDATION_ERROR', detalles: parsed.error.flatten() } });
  }
  try {
    const cotizacion = await service.crear({ usuario: req.usuario, datos: parsed.data });
    res.status(201).json(serializarCotizacion(cotizacion));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: { message: err.message, code: err.code || 'BAD_REQUEST' } });
    next(err);
  }
}

async function actualizar(req, res, next) {
  const parsed = actualizarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Revisa los datos de la cotización.', code: 'VALIDATION_ERROR', detalles: parsed.error.flatten() } });
  }
  try {
    const cotizacion = await service.actualizar({ usuario: req.usuario, id: req.params.id, datos: parsed.data });
    if (!cotizacion) return res.status(404).json({ error: { message: 'Cotización no encontrada.', code: 'NOT_FOUND' } });
    res.json(serializarCotizacion(cotizacion));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: { message: err.message, code: err.code || 'BAD_REQUEST' } });
    next(err);
  }
}

export { listar, obtener, crear, actualizar };
