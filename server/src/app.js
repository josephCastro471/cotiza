import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cotizacionesRoutes from './modules/cotizaciones/routes.js';
import authRoutes from './modules/auth/routes.js';
import clientesRoutes from './modules/clientes/routes.js';
import catalogoRoutes from './modules/catalogo/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import demoRoutes from './modules/demo/routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/demo', demoRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Recurso no encontrado.', code: 'NOT_FOUND' } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message, err.stack);
  // Only errors application code explicitly marked (by setting `.status`) are
  // safe to echo back to the client — those messages are written for a Spanish
  // end user. Anything else (a raw Prisma/ORM error, an unexpected exception)
  // must not leak internal query/field structure, so it gets a fixed generic
  // message while the real detail still goes to the server log above.
  if (!err.status) {
    return res.status(500).json({
      error: { message: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.', code: 'INTERNAL_ERROR' },
    });
  }
  res.status(err.status).json({
    error: { message: err.message, code: err.code || 'BAD_REQUEST' },
  });
});

export default app;
