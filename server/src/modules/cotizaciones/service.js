import { prisma } from '../../config/db.js';
import { calcularSubtotalLinea, calcularTotalesCotizacion } from '../../utils/money.js';
import { generarFolio, generarFolioDuplicado } from '../../utils/folio.js';
import { puedeTransicionar, siguienteEstado } from './estados.js';

function alcanceLectura(usuario) {
  if (usuario.rol === 'ADMIN' || usuario.rol === 'GERENTE') return {};
  if (usuario.rol === 'VENDEDOR') return { vendedorId: usuario.id };
  return { clienteId: usuario.clienteId };
}

async function marcarVencidasSiCorresponde(cotizaciones) {
  const ahora = new Date();
  const actualizadas = [];
  for (const c of cotizaciones) {
    if (c.estado === 'ENVIADO' && c.fechaValidez < ahora) {
      // eslint-disable-next-line no-await-in-loop
      const actualizada = await prisma.cotizacion.update({ where: { id: c.id }, data: { estado: 'VENCIDO' } });
      // eslint-disable-next-line no-await-in-loop
      await prisma.cotizacionEvento.create({ data: { cotizacionId: c.id, tipo: 'VENCIDA', actorId: c.vendedorId } });
      actualizadas.push({ ...actualizada, cliente: c.cliente, vendedor: c.vendedor, lineas: c.lineas });
    } else {
      actualizadas.push(c);
    }
  }
  return actualizadas;
}

async function listar({ usuario, filtros = {} }) {
  const where = { ...alcanceLectura(usuario) };
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.desde || filtros.hasta) {
    where.fechaEmision = {};
    if (filtros.desde) where.fechaEmision.gte = new Date(filtros.desde);
    if (filtros.hasta) where.fechaEmision.lte = new Date(filtros.hasta);
  }
  if (filtros.q) where.folio = { contains: filtros.q, mode: 'insensitive' };

  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include: { cliente: true, vendedor: true, lineas: true },
    orderBy: { createdAt: 'desc' },
  });
  return marcarVencidasSiCorresponde(cotizaciones);
}

async function obtener({ usuario, id }) {
  const where = { id, ...alcanceLectura(usuario) };
  const cotizacion = await prisma.cotizacion.findFirst({
    where,
    include: { cliente: true, vendedor: true, lineas: true, eventos: { orderBy: { createdAt: 'asc' }, include: { actor: true } } },
  });
  if (!cotizacion) return null;
  const [actualizada] = await marcarVencidasSiCorresponde([cotizacion]);
  return actualizada;
}

async function validarClientePropio(empresaId, clienteId) {
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, empresaId } });
  return Boolean(cliente);
}

function construirLineas(lineasEntrada) {
  return lineasEntrada.map((linea, index) => ({
    catalogoItemId: linea.catalogoItemId || null,
    descripcion: linea.descripcion,
    cantidad: linea.cantidad,
    precioUnitario: linea.precioUnitario,
    descuentoPct: linea.descuentoPct || 0,
    subtotal: calcularSubtotalLinea(linea),
    orden: index + 1,
  }));
}

async function crear({ usuario, datos }) {
  const clientePropio = await validarClientePropio(usuario.empresaId, datos.clienteId);
  if (!clientePropio) {
    const err = new Error('El cliente seleccionado no existe en esta empresa.');
    err.status = 400;
    throw err;
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: usuario.empresaId } });
  const lineas = construirLineas(datos.lineas);
  const { subtotal, iva, total } = calcularTotalesCotizacion(datos.lineas, Number(empresa.ivaPct));
  const folio = await generarFolio(prisma, usuario.empresaId);

  return prisma.cotizacion.create({
    data: {
      empresaId: usuario.empresaId,
      folio,
      clienteId: datos.clienteId,
      vendedorId: usuario.id,
      estado: 'BORRADOR',
      subtotal,
      iva,
      total,
      fechaValidez: new Date(datos.fechaValidez),
      lineas: { create: lineas },
      eventos: { create: [{ tipo: 'CREADA', actorId: usuario.id }] },
    },
    include: { lineas: true },
  });
}

async function actualizar({ usuario, id, datos }) {
  const existente = await prisma.cotizacion.findFirst({ where: { id, empresaId: usuario.empresaId } });
  if (!existente) return null;
  if (existente.estado !== 'BORRADOR') {
    const err = new Error('Solo se puede editar una cotización en borrador.');
    err.status = 409;
    err.code = 'NO_EDITABLE';
    throw err;
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: usuario.empresaId } });
  const lineas = construirLineas(datos.lineas);
  const { subtotal, iva, total } = calcularTotalesCotizacion(datos.lineas, Number(empresa.ivaPct));

  await prisma.cotizacionLinea.deleteMany({ where: { cotizacionId: id } });

  return prisma.cotizacion.update({
    where: { id },
    data: {
      clienteId: datos.clienteId || existente.clienteId,
      fechaValidez: datos.fechaValidez ? new Date(datos.fechaValidez) : existente.fechaValidez,
      subtotal,
      iva,
      total,
      lineas: { create: lineas },
    },
    include: { lineas: true },
  });
}

export { listar, obtener, crear, actualizar, alcanceLectura, puedeTransicionar, siguienteEstado, generarFolioDuplicado };
