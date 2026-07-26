import jwt from 'jsonwebtoken';

function firmarToken({ sub, empresaId, rol, clienteId }) {
  return jwt.sign({ empresaId, rol, clienteId }, process.env.JWT_SECRET, {
    subject: sub,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verificarToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return {
    sub: decoded.sub,
    empresaId: decoded.empresaId,
    rol: decoded.rol,
    clienteId: decoded.clienteId,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

export { firmarToken, verificarToken };
