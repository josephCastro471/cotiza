import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, LogOut } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Topbar() {
  const { usuario, switchEmpresa, logout } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  function cerrarSesion() {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    if (usuario?.rol === 'ADMIN') {
      api.get('/auth/empresas').then((res) => setEmpresas(res.data)).catch(() => {});
    }
  }, [usuario?.rol]);

  async function elegir(empresaId) {
    setAbierto(false);
    await switchEmpresa(empresaId);
    window.location.reload();
  }

  return (
    <header className="h-[52px] border-b border-line bg-surface flex items-center gap-4 px-6 relative">
      <div className="relative">
        <button
          onClick={() => usuario?.rol === 'ADMIN' && setAbierto((v) => !v)}
          className={`flex items-center gap-2 px-2.5 py-1 border border-line-strong rounded-control font-medium text-small ${usuario?.rol === 'ADMIN' ? 'cursor-pointer hover:border-ink-400' : ''}`}
        >
          <span className="w-[18px] h-[18px] rounded-chip bg-ink-900 text-white text-[10px] font-semibold grid place-items-center">
            {usuario?.nombreEmpresa?.[0] || 'E'}
          </span>
          {usuario?.nombreEmpresa || 'Empresa'}
          {usuario?.rol === 'ADMIN' && <ChevronDown size={14} />}
        </button>
        {abierto && (
          <div className="absolute top-full left-0 mt-1 bg-surface border border-line rounded-control shadow-[var(--shadow-popover)] min-w-[200px] z-10">
            {empresas.map((e) => (
              <button
                key={e.id}
                onClick={() => elegir(e.id)}
                className="w-full text-left px-3 py-2 text-small hover:bg-paper"
              >
                {e.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-2.5 py-1 border border-line rounded-control text-ink-400 text-small min-w-[200px]">
        <Search size={14} />
        Buscar
        <kbd className="ml-auto font-mono text-[11px] border border-line rounded-[3px] px-1 text-ink-500">⌘K</kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-[26px] h-[26px] rounded-full bg-ink-900 text-white grid place-items-center text-[11px] font-semibold">
          {usuario ? iniciales(usuario.nombre) : ''}
        </span>
        <small className="text-ink-500 text-small">
          {usuario?.nombre} · {usuario?.rol && usuario.rol.charAt(0) + usuario.rol.slice(1).toLowerCase()}
        </small>
        <button
          onClick={cerrarSesion}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 px-2 py-1 rounded-control text-ink-500 text-small hover:text-danger hover:bg-danger/5 transition-colors duration-[120ms] ease-std"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
