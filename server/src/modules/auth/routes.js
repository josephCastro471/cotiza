import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './controller.js';

const router = Router();

router.post('/login', controller.login);
router.post('/demo-login', controller.demoLogin);
router.get('/me', requireAuth, controller.me);
router.post('/switch-empresa', requireAuth, requireRole('ADMIN'), controller.switchEmpresa);
router.get('/empresas', requireAuth, requireRole('ADMIN'), controller.listarEmpresas);

export default router;
