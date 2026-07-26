import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ roles }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
