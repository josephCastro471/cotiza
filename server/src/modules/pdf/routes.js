import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import * as cotizacionesService from '../cotizaciones/service.js';
import { prisma } from '../../config/db.js';
import { CotizacionDocument } from './template.js';

async function descargarPdf(req, res, next) {
  try {
    const cotizacion = await cotizacionesService.obtener({ usuario: req.usuario, id: req.params.id });
    if (!cotizacion) return res.status(404).json({ error: { message: 'Cotización no encontrada.', code: 'NOT_FOUND' } });

    // `cotizacionesService.obtener` includes { cliente, vendedor, lineas, eventos } but not
    // `empresa` — the template needs empresa.nombre/empresa.ruc for the header. `Empresa` is
    // not one of the tenant-scoped models in config/db.js, so this lookup by the scalar
    // `empresaId` field works correctly with no active tenant context.
    const empresa = await prisma.empresa.findUnique({ where: { id: cotizacion.empresaId } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cotizacion.folio}.pdf"`);
    const stream = await renderToStream(React.createElement(CotizacionDocument, { cotizacion: { ...cotizacion, empresa } }));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export { descargarPdf };
