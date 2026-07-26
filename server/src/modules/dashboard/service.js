import { prisma } from '../../config/db.js';

async function obtenerResumen() {
  const [borradores, enviadas, aprobadas, aprobadasAgg] = await Promise.all([
    prisma.cotizacion.count({ where: { estado: 'BORRADOR' } }),
    prisma.cotizacion.count({ where: { estado: 'ENVIADO' } }),
    prisma.cotizacion.count({ where: { estado: 'APROBADO' } }),
    prisma.cotizacion.aggregate({ where: { estado: 'APROBADO' }, _sum: { total: true } }),
  ]);

  return {
    borradores,
    enviadas,
    aprobadas,
    montoAprobado: Number(aprobadasAgg._sum.total || 0),
  };
}

export { obtenerResumen };
