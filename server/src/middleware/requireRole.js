function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: { message: 'No tienes permiso para realizar esta acción.', code: 'FORBIDDEN' } });
    }
    next();
  };
}

export { requireRole };
