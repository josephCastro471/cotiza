import { prisma, runWithTenant } from '../../config/db.js';
import { verifyPassword } from '../../utils/password.js';
import { firmarToken } from '../../utils/jwt.js';

function serializarUsuario(usuario, empresa) {
  return { id: usuario.id, empresaId: usuario.empresaId, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, clienteId: usuario.clienteId, nombreEmpresa: empresa?.nombre };
}

// Looks up the authenticated usuario by primary key, bypassing the automatic
// tenant-scoping Prisma extension (config/db.js scopes Usuario reads to the
// currently active tenant context). This lookup must work regardless of the
// active context: after switchEmpresa, the request's tenant context is the
// *destination* empresa, which no longer matches the admin's own Usuario
// row's home empresaId — a scoped lookup would silently return null.
function buscarUsuarioPorId(id) {
  return runWithTenant(undefined, () => prisma.usuario.findUnique({ where: { id } }));
}

async function login({ email, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return null;
  const valido = await verifyPassword(password, usuario.passwordHash);
  if (!valido) return null;
  const empresa = await prisma.empresa.findUnique({ where: { id: usuario.empresaId } });
  const token = firmarToken({ sub: usuario.id, empresaId: usuario.empresaId, rol: usuario.rol, clienteId: usuario.clienteId });
  return { token, usuario: serializarUsuario(usuario, empresa) };
}

async function demoLogin({ rol }) {
  const usuario = await prisma.usuario.findFirst({
    where: { rol, empresa: { prefijoFolio: 'COT-A' } },
    orderBy: { createdAt: 'asc' },
  });
  if (!usuario) return null;
  const empresa = await prisma.empresa.findUnique({ where: { id: usuario.empresaId } });
  const token = firmarToken({ sub: usuario.id, empresaId: usuario.empresaId, rol: usuario.rol, clienteId: usuario.clienteId });
  return { token, usuario: serializarUsuario(usuario, empresa) };
}

async function me({ id, empresaId }) {
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) return null;
  // Fetch the empresa by the *active* tenant (the empresaId param, from the
  // caller's JWT), not usuario.empresaId (the admin's static home company) —
  // after switchEmpresa these can differ, and both empresaId and
  // nombreEmpresa in /me's response must reflect the empresa the admin is
  // currently viewing, not the one they originally logged into.
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  // Report the currently active tenant context (the token's empresaId),
  // not the usuario row's static home empresaId — after switchEmpresa these
  // can differ, and /me should reflect the empresa the admin is viewing.
  return { ...serializarUsuario(usuario, empresa), empresaId };
}

async function switchEmpresa({ usuarioId, empresaId }) {
  const usuario = await buscarUsuarioPorId(usuarioId);
  if (!usuario) return null;
  const empresaDestino = await prisma.empresa.findUnique({ where: { id: empresaId } });
  if (!empresaDestino) return null;
  const token = firmarToken({ sub: usuario.id, empresaId, rol: usuario.rol, clienteId: usuario.clienteId });
  return { token };
}

function listarEmpresas() {
  return prisma.empresa.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } });
}

export { login, demoLogin, me, switchEmpresa, listarEmpresas };
