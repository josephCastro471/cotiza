import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './controller.js';

const router = Router();

router.post('/reset', requireAuth, controller.reset);

export default router;
