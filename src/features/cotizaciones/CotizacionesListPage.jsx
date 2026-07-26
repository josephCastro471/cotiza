import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import api from '../../api/client';
import { formatCurrency, formatDate } from '../../lib/format';
import EstadoChip from '../../components/EstadoChip';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

const ESTADOS = ['BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO'];

export default function CotizacionesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const q = searchParams.get('q') || '';
  const estado = searchParams.get('estado') || '';

  useEffect(() => {
    setCargando(true);
    setError(false);
    const params = {};
    if (q) params.q = q;
    if (estado) params.estado = estado;
    api.get('/cotizaciones', { params }).then((res) => {
      setCotizaciones(res.data);
      setCargando(false);
    }).catch(() => {
      setError(true);
      setCargando(false);
    });
  }, [q, estado]);

  function actualizarFiltro(clave, valor) {
    const next = new URLSearchParams(searchParams);
    if (valor) next.set(clave, valor);
    else next.delete(clave);
    setSearchParams(next);
  }

  if (error) return <div className="p-6 text-small text-danger">No se pudo cargar las cotizaciones. Intenta de nuevo.</div>;

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <h1 className="text-h1 font-semibold">Cotizaciones</h1>
        <div className="flex-1" />
        <Button variant="primary" icon={Plus} onClick={() => navigate('/cotizaciones/nueva')}>
          Crear cotización
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          placeholder="Buscar por folio"
          value={q}
          onChange={(e) => actualizarFiltro('q', e.target.value)}
          className="h-9 border border-line rounded-control px-3 bg-surface text-small focus:outline-none focus:ring-[3px] focus:ring-focus/20 focus:border-focus"
        />
        <select
          value={estado}
          onChange={(e) => actualizarFiltro('estado', e.target.value)}
          className="h-9 border border-line rounded-control px-2 bg-surface text-small"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-line rounded-card overflow-hidden">
        {!cargando && cotizaciones.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aún no hay cotizaciones"
            subtitle="Crea la primera y quedará en borrador hasta que la envíes."
            actionLabel="Crear cotización"
            onAction={() => navigate('/cotizaciones/nueva')}
          />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Folio', 'Cliente', 'Estado', 'Emitida', 'Vence', 'Total'].map((h) => (
                  <th key={h} className="text-label uppercase text-left px-4.5 py-2.5 border-b border-line-strong whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cotizaciones/${c.id}`)}
                  className={`cursor-pointer hover:bg-paper transition-colors duration-[120ms] ${i % 2 === 1 ? 'bg-band' : ''}`}
                >
                  <td className="px-4.5 h-11 font-mono tabular">{c.folio}</td>
                  <td className="px-4.5 font-medium">{c.cliente.nombre}</td>
                  <td className="px-4.5"><EstadoChip estado={c.estado} /></td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaEmision)}</td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaValidez)}</td>
                  <td className="px-4.5 text-right font-mono tabular">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
