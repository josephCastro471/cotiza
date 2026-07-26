import { prisma } from '../../config/db.js';
import { alcanceLectura } from '../cotizaciones/service.js';

// GET /api/dashboard previously returned company-wide KPIs to any
// authenticated role, including CLIENTE (a commercial-disclosure leak of
// aggregate tenant activity) and VENDEDOR (who per the design spec shouldn't
// see company-wide totals). Reuse the same alcanceLectura scoping that
// cotizaciones reads use, so a CLIENTE only ever sees numbers derived from
// its own cotizaciones and a VENDEDOR only its own.
async function obtenerResumen(usuario) {
  const alcance = alcanceLectura(usuario);
  const [borradores, enviadas, aprobadas, aprobadasAgg] = await Promise.all([
    prisma.cotizacion.count({ where: { ...alcance, estado: 'BORRADOR' } }),
    prisma.cotizacion.count({ where: { ...alcance, estado: 'ENVIADO' } }),
    prisma.cotizacion.count({ where: { ...alcance, estado: 'APROBADO' } }),
    prisma.cotizacion.aggregate({ where: { ...alcance, estado: 'APROBADO' }, _sum: { total: true } }),
  ]);

  return {
    borradores,
    enviadas,
    aprobadas,
    montoAprobado: Number(aprobadasAgg._sum.total || 0),
  };
}

export { obtenerResumen };
