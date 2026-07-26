import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Topbar() {
  const { usuario } = useAuth();

  return (
    <header className="h-[52px] border-b border-line bg-surface flex items-center gap-4 px-6">
      <div className="flex items-center gap-2 px-2.5 py-1 border border-line-strong rounded-control font-medium text-small">
        <span className="w-[18px] h-[18px] rounded-chip bg-ink-900 text-white text-[10px] font-semibold grid place-items-center">
          {usuario?.nombreEmpresa?.[0] || 'E'}
        </span>
        {usuario?.nombreEmpresa || 'Empresa'}
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
      </div>
    </header>
  );
}
