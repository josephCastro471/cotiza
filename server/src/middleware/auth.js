import { verificarToken } from '../utils/jwt.js';
import { runWithTenant } from '../config/db.js';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: { message: 'Inicia sesión para continuar.', code: 'NO_TOKEN' } });
  }

  let payload;
  try {
    payload = verificarToken(token);
  } catch {
    return res.status(401).json({ error: { message: 'La sesión expiró o no es válida. Inicia sesión de nuevo.', code: 'INVALID_TOKEN' } });
  }

  req.usuario = { id: payload.sub, empresaId: payload.empresaId, rol: payload.rol, clienteId: payload.clienteId };
  runWithTenant({ empresaId: payload.empresaId, usuarioId: payload.sub }, () => next());
}

export { requireAuth };
