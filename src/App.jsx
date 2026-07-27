import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import ResumenPage from './pages/ResumenPage';
import ComingSoonPage from './pages/ComingSoonPage';
import CotizacionesListPage from './features/cotizaciones/CotizacionesListPage';
import CotizacionEditorPage from './features/cotizaciones/CotizacionEditorPage';
import CotizacionDetallePage from './features/cotizaciones/CotizacionDetallePage';
import AprobacionesPage from './features/aprobaciones/AprobacionesPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<ResumenPage />} />
                <Route path="/cotizaciones" element={<CotizacionesListPage />} />
                <Route path="/cotizaciones/nueva" element={<CotizacionEditorPage />} />
                <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
                <Route element={<RoleRoute roles={['ADMIN', 'GERENTE']} />}>
                  <Route path="/aprobaciones" element={<AprobacionesPage />} />
                </Route>
                <Route path="/clientes" element={<ComingSoonPage title="Clientes" />} />
                <Route path="/catalogo" element={<ComingSoonPage title="Catálogo" />} />
                <Route path="/ajustes" element={<ComingSoonPage title="Ajustes" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
