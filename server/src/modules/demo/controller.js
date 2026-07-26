import { seed } from '../../../prisma/seed.js';
import { runWithTenant } from '../../config/db.js';

async function reset(req, res, next) {
  try {
    await runWithTenant(undefined, () => seed());
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
}

export { reset };
