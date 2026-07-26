import * as service from './service.js';

async function resumen(req, res, next) {
  try {
    res.json(await service.obtenerResumen());
  } catch (err) {
    next(err);
  }
}

export { resumen };
