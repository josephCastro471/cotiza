import axios from 'axios';

export const TOKEN_KEY = 'cotiza.token';
export const USUARIO_KEY = 'cotiza.usuario';

export function guardarSesion(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function leerSesion() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuarioRaw = localStorage.getItem(USUARIO_KEY);
  return { token: token || null, usuario: usuarioRaw ? JSON.parse(usuarioRaw) : null };
}

export function borrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const { token } = leerSesion();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      borrarSesion();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
