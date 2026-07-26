import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cotizacionesRoutes from './modules/cotizaciones/routes.js';
import authRoutes from './modules/auth/routes.js';

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

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Recurso no encontrado.', code: 'NOT_FOUND' } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Ocurrió un error inesperado.', code: err.code || 'INTERNAL_ERROR' },
  });
});

export default app;
