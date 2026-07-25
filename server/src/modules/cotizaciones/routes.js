import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.crear);
router.patch('/:id', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.actualizar);

export default router;
