import { z } from 'zod';
import * as service from './service.js';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const demoLoginSchema = z.object({ rol: z.enum(['ADMIN', 'GERENTE', 'VENDEDOR', 'CLIENTE']) });
const switchSchema = z.object({ empresaId: z.string().min(1) });

async function login(req, res, next) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Ingresa un correo y una contraseña válidos.', code: 'VALIDATION_ERROR' } });
  try {
    const resultado = await service.login(parsed.data);
    if (!resultado) return res.status(401).json({ error: { message: 'Correo o contraseña incorrectos.', code: 'INVALID_CREDENTIALS' } });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function demoLogin(req, res, next) {
  const parsed = demoLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Selecciona un rol válido.', code: 'VALIDATION_ERROR' } });
  try {
    const resultado = await service.demoLogin(parsed.data);
    if (!resultado) return res.status(404).json({ error: { message: 'No hay un usuario de demostración para ese rol.', code: 'NOT_FOUND' } });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const usuario = await service.me({ id: req.usuario.id, empresaId: req.usuario.empresaId });
    if (!usuario) return res.status(404).json({ error: { message: 'Usuario no encontrado.', code: 'NOT_FOUND' } });
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}

async function switchEmpresa(req, res, next) {
  const parsed = switchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Selecciona una empresa válida.', code: 'VALIDATION_ERROR' } });
  try {
    const resultado = await service.switchEmpresa({ usuarioId: req.usuario.id, empresaId: parsed.data.empresaId });
    if (!resultado) return res.status(404).json({ error: { message: 'Empresa no encontrada.', code: 'NOT_FOUND' } });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export { login, demoLogin, me, switchEmpresa };
