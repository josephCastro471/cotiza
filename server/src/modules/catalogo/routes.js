import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './controller.js';

const router = Router();

router.use(requireAuth);
// CLIENTE-role tokens must not be able to browse the tenant's full catalog.
router.get('/', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.listar);
router.get('/:id', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.obtener);
router.post('/', requireRole('ADMIN', 'GERENTE'), controller.crear);
router.patch('/:id', requireRole('ADMIN', 'GERENTE'), controller.actualizar);
router.delete('/:id', requireRole('ADMIN', 'GERENTE'), controller.eliminar);

export default router;
