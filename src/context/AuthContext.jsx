import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { guardarSesion, leerSesion, borrarSesion } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { token, usuario: usuarioGuardado } = leerSesion();
    if (token && usuarioGuardado) setUsuario(usuarioGuardado);
    setCargando(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    guardarSesion(data.token, data.usuario);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const demoLogin = useCallback(async (rol) => {
    const { data } = await api.post('/auth/demo-login', { rol });
    guardarSesion(data.token, data.usuario);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    borrarSesion();
    setUsuario(null);
  }, []);

  const switchEmpresa = useCallback(async (empresaId) => {
    const { data } = await api.post('/auth/switch-empresa', { empresaId });
    const { data: usuarioActualizado } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
    guardarSesion(data.token, usuarioActualizado);
    setUsuario(usuarioActualizado);
    return usuarioActualizado;
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, demoLogin, logout, switchEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
