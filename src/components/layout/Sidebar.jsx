import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Users, Package, Settings } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/aprobaciones', label: 'Aprobaciones', icon: CheckSquare },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catálogo', icon: Package },
];

export default function Sidebar() {
  return (
    <aside className="bg-paper border-r border-line py-5 flex flex-col w-56">
      <div className="px-5 pb-6 flex items-baseline gap-2">
        <b className="text-h3">Cotiza</b>
        <span className="text-ink-400 text-[11px] font-mono">v0.1</span>
      </div>
      <nav className="flex flex-col gap-px px-2">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-r-control text-ink-700 transition-colors duration-[120ms] ease-std border-l-2 ${
                isActive ? 'bg-surface border-ink-900 text-ink-900 font-medium' : 'border-transparent hover:bg-surface'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        <div className="h-px bg-line my-3 mx-3" />
        <NavLink
          to="/ajustes"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-r-control text-ink-700 transition-colors duration-[120ms] ease-std border-l-2 ${
              isActive ? 'bg-surface border-ink-900 text-ink-900 font-medium' : 'border-transparent hover:bg-surface'
            }`
          }
        >
          <Settings size={16} />
          Ajustes
        </NavLink>
      </nav>
    </aside>
  );
}
