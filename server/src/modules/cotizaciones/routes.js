import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as controller from './controller.js';
import * as pdfRoutes from '../pdf/routes.js';

const router = Router();

router.use(requireAuth);
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/:id/pdf', pdfRoutes.descargarPdf);
router.post('/', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.crear);
router.patch('/:id', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.actualizar);
router.post('/:id/enviar', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.enviar);
router.post('/:id/aprobar', requireRole('ADMIN', 'GERENTE'), controller.aprobar);
router.post('/:id/rechazar', requireRole('ADMIN', 'GERENTE'), controller.rechazar);
router.post('/:id/duplicar', requireRole('ADMIN', 'GERENTE', 'VENDEDOR'), controller.duplicar);

export default router;
