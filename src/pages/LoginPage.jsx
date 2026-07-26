import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const ROLES_DEMO = [
  { rol: 'ADMIN', label: 'Administrador' },
  { rol: 'GERENTE', label: 'Gerente' },
  { rol: 'VENDEDOR', label: 'Vendedor' },
  { rol: 'CLIENTE', label: 'Cliente' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('El correo o la contraseña no coinciden. Verifica e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComo(rol) {
    setError('');
    try {
      await demoLogin(rol);
      navigate('/');
    } catch {
      setError('No se pudo iniciar la demo para ese rol. Intenta de nuevo.');
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div className="flex items-center justify-center p-8">
        <form onSubmit={manejarSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-h1 font-semibold mb-2">Iniciar sesión</h1>

          <div>
            <label className="block text-small text-ink-500 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-9 border border-line rounded-control px-3 bg-surface focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
            />
          </div>

          <div>
            <label className="block text-small text-ink-500 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-9 border border-line rounded-control px-3 bg-surface focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
            />
          </div>

          {error && <p className="text-small text-danger">{error}</p>}

          <Button type="submit" variant="primary" disabled={enviando} className="mt-2 justify-center">
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-small text-ink-500 mb-2">Entrar como:</p>
            <div className="flex flex-wrap gap-2">
              {ROLES_DEMO.map(({ rol, label }) => (
                <Button key={rol} type="button" variant="secondary" onClick={() => entrarComo(rol)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className="hidden md:flex bg-ink-900 text-white items-center justify-center p-8">
        <div className="max-w-sm">
          <p className="text-h2 font-semibold mb-4">
            Cotizaciones que se aprueban, no que se pierden en un correo.
          </p>
          <p className="font-mono text-small text-white/70">COT-A-0148</p>
        </div>
      </div>
    </div>
  );
}
