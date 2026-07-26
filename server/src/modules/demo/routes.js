import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './controller.js';

const router = Router();

// /demo/reset wipes and reseeds *every* tenant's data process-wide — by
// design any authenticated user can trigger it for demo purposes, but it must
// never be reachable outside an actual demo deployment, and even there it
// should require an ADMIN token rather than any customer login. Gate on
// DEMO_MODE so the route 404s (rather than merely being undocumented) unless
// explicitly enabled, and require ADMIN as a cheap extra guard.
router.post('/reset', (req, res, next) => {
  if (process.env.DEMO_MODE !== 'true') {
    return res.status(404).json({ error: { message: 'Recurso no encontrado.', code: 'NOT_FOUND' } });
  }
  next();
}, requireAuth, requireRole('ADMIN'), controller.reset);

export default router;
