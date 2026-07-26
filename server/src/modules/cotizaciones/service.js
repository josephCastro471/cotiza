import { prisma } from '../../config/db.js';
import { calcularSubtotalLinea, calcularTotalesCotizacion } from '../../utils/money.js';
import { generarFolio, generarFolioDuplicado } from '../../utils/folio.js';
import { puedeTransicionar, siguienteEstado } from './estados.js';

function alcanceLectura(usuario) {
  if (usuario.rol === 'ADMIN' || usuario.rol === 'GERENTE') return {};
  if (usuario.rol === 'VENDEDOR') return { vendedorId: usuario.id };
  if (usuario.rol === 'CLIENTE') {
    // Fail closed: a CLIENTE token without a clienteId claim (malformed/older
    // token, or a future token-minting path that forgets the claim) must never
    // fall through to an unscoped `{}` read — that would leak the whole tenant.
    if (!usuario.clienteId) {
      const e = new Error('Tu usuario no está vinculado a un cliente.');
      e.status = 403;
      throw e;
    }
    return { clienteId: usuario.clienteId };
  }
  // Unrecognized role — fail closed rather than defaulting to an unscoped read.
  const e = new Error('Rol de usuario no reconocido.');
  e.status = 403;
  throw e;
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
  // The role-derived scope (alcanceLectura) must be structurally impossible for
  // a caller-supplied filter to override — e.g. a CLIENTE passing ?clienteId=
  // of another customer. Building the scope and the filters as separate AND
  // branches (rather than spreading one object over the other) guarantees this
  // and generalizes to any future filter field.
  const alcance = alcanceLectura(usuario);

  const filtrosValidados = {};
  if (filtros.estado) filtrosValidados.estado = filtros.estado;
  // A CLIENTE's clienteId scope is fixed by their token, never by a query
  // filter — strip it explicitly so it can't even reach the AND clause.
  if (filtros.clienteId && usuario.rol !== 'CLIENTE') filtrosValidados.clienteId = filtros.clienteId;
  if (filtros.desde || filtros.hasta) {
    filtrosValidados.fechaEmision = {};
    if (filtros.desde) filtrosValidados.fechaEmision.gte = new Date(filtros.desde);
    if (filtros.hasta) filtrosValidados.fechaEmision.lte = new Date(filtros.hasta);
  }
  if (filtros.q) filtrosValidados.folio = { contains: filtros.q, mode: 'insensitive' };

  const cotizaciones = await prisma.cotizacion.findMany({
    where: { AND: [alcance, filtrosValidados] },
    include: { cliente: true, vendedor: true, lineas: true },
    orderBy: { createdAt: 'desc' },
  });
  return marcarVencidasSiCorresponde(cotizaciones);
}

async function obtener({ usuario, id }) {
  const where = { AND: [{ id }, alcanceLectura(usuario)] };
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

// The tenant-scoping Prisma extension (config/db.js) only injects empresaId
// into read/write `where` clauses — it never validates scalar FK fields
// embedded inside `data`. So a caller-supplied catalogoItemId that belongs to
// another tenant would otherwise write silently. No current read path
// dereferences catalogoItemId (no `include: { catalogoItem: true }` yet), but
// it will leak the moment one is added, so this closes it defense-in-depth,
// mirroring validarClientePropio.
async function validarCatalogoItemsPropios(empresaId, lineasEntrada) {
  const idsUnicos = [...new Set((lineasEntrada || []).map((l) => l.catalogoItemId).filter(Boolean))];
  if (idsUnicos.length === 0) return;
  const encontrados = await prisma.catalogoItem.count({ where: { id: { in: idsUnicos }, empresaId } });
  if (encontrados !== idsUnicos.length) {
    const err = new Error('Uno o más ítems de catálogo seleccionados no existen en esta empresa.');
    err.status = 400;
    throw err;
  }
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
  await validarCatalogoItemsPropios(usuario.empresaId, datos.lineas);

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
  // Scope the existence check the same way `listar`/`obtener` do — a VENDEDOR
  // (or CLIENTE, if a future role change ever allows it here) must not be able
  // to mutate a cotización they can't even see via the read endpoints.
  const existente = await prisma.cotizacion.findFirst({ where: { AND: [{ id }, alcanceLectura(usuario)] } });
  if (!existente) return null;
  if (existente.estado !== 'BORRADOR') {
    const err = new Error('Solo se puede editar una cotización en borrador.');
    err.status = 409;
    err.code = 'NO_EDITABLE';
    throw err;
  }

  // `crear` validates clienteId belongs to the caller's own tenant; `actualizar`
  // must do the same whenever a new clienteId is supplied, otherwise a foreign
  // tenant's cliente can be silently attached to this tenant's cotización (the
  // tenant-scoping extension only guards `where`, never scalar FKs in `data`).
  if (datos.clienteId) {
    const clientePropio = await validarClientePropio(usuario.empresaId, datos.clienteId);
    if (!clientePropio) {
      const err = new Error('El cliente seleccionado no existe en esta empresa.');
      err.status = 400;
      throw err;
    }
  }
  await validarCatalogoItemsPropios(usuario.empresaId, datos.lineas);

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

async function transicionar({ usuario, id, accion, comentario }) {
  const cotizacion = await prisma.cotizacion.findFirst({ where: { AND: [{ id }, alcanceLectura(usuario)] } });
  if (!cotizacion) return null;

  const nuevoEstado = siguienteEstado(cotizacion.estado, accion); // throws TRANSICION_INVALIDA if not allowed

  const tipoEvento = { enviar: 'ENVIADA', aprobar: 'APROBADA', rechazar: 'RECHAZADA', devolver: 'DEVUELTA' }[accion];

  return prisma.cotizacion.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      eventos: { create: [{ tipo: tipoEvento, actorId: usuario.id, comentario: comentario || null }] },
    },
    include: { lineas: true, eventos: { include: { actor: true } } },
  });
}

async function duplicar({ usuario, id }) {
  const original = await prisma.cotizacion.findFirst({ where: { AND: [{ id }, alcanceLectura(usuario)] }, include: { lineas: true } });
  if (!original) return null;

  const folio = await generarFolioDuplicado(prisma, original);

  return prisma.cotizacion.create({
    data: {
      empresaId: usuario.empresaId,
      folio,
      clienteId: original.clienteId,
      vendedorId: usuario.id,
      estado: 'BORRADOR',
      subtotal: original.subtotal,
      iva: original.iva,
      total: original.total,
      fechaValidez: original.fechaValidez,
      cotizacionPadreId: original.id,
      lineas: {
        create: original.lineas.map((l) => ({
          catalogoItemId: l.catalogoItemId,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
          descuentoPct: l.descuentoPct,
          subtotal: l.subtotal,
          orden: l.orden,
        })),
      },
      eventos: { create: [{ tipo: 'CREADA', actorId: usuario.id, comentario: `Duplicado de ${original.folio}` }] },
    },
    include: { lineas: true },
  });
}

export { listar, obtener, crear, actualizar, transicionar, duplicar, alcanceLectura };
