import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import api from '../api/client';
import { formatCurrency, formatDate } from '../lib/format';
import EstadoChip from '../components/EstadoChip';
import Button from '../components/Button';

export default function ResumenPage() {
  const [kpis, setKpis] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then((res) => setKpis(res.data)).catch(() => setError(true));
    api.get('/cotizaciones').then((res) => setRecientes(res.data.slice(0, 6))).catch(() => setError(true));
    api.get('/cotizaciones', { params: { estado: 'ENVIADO' } }).then((res) => setPendientes(res.data.slice(0, 3))).catch(() => setError(true));
  }, []);

  if (error) return <div className="p-6 text-small text-danger">No se pudo cargar el resumen. Intenta de nuevo.</div>;
  if (!kpis) return null;

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <div>
          <h1 className="text-h1 font-semibold">Resumen</h1>
        </div>
        <div className="flex-1" />
        <Button variant="secondary" icon={Download}>Exportar</Button>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/cotizaciones/nueva')}>
          Crear cotización
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Borradores', kpis.borradores],
          ['Enviadas', kpis.enviadas],
          ['Aprobadas', kpis.aprobadas],
          ['Monto aprobado', formatCurrency(kpis.montoAprobado)],
        ].map(([label, valor]) => (
          <div key={label} className="bg-surface border border-line rounded-card p-4">
            <div className="text-label uppercase">{label}</div>
            <div className="font-mono tabular text-right text-display font-semibold mt-1.5">{valor}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="flex items-center gap-2.5 px-4.5 py-3 border-b border-line">
            <h3 className="text-h3 font-semibold">Cotizaciones recientes</h3>
            <Link to="/cotizaciones" className="ml-auto text-small text-focus hover:underline">Ver todas</Link>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Folio', 'Cliente', 'Estado', 'Vence', 'Total'].map((h) => (
                  <th key={h} className="text-label uppercase text-left px-4.5 py-2.5 border-b border-line-strong whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cotizaciones/${c.id}`)}
                  className={`cursor-pointer hover:bg-paper transition-colors duration-[120ms] ${i % 2 === 1 ? 'bg-band' : ''}`}
                >
                  <td className="px-4.5 h-11 font-mono tabular">{c.folio}</td>
                  <td className="px-4.5 font-medium">{c.cliente.nombre}</td>
                  <td className="px-4.5"><EstadoChip estado={c.estado} /></td>
                  <td className="px-4.5 font-mono tabular">{formatDate(c.fechaValidez)}</td>
                  <td className="px-4.5 text-right font-mono tabular">{formatCurrency(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-surface border border-line rounded-card">
          <div className="px-4.5 py-3 border-b border-line">
            <h3 className="text-h3 font-semibold">Pendientes de aprobación</h3>
          </div>
          {pendientes.map((c) => (
            <div key={c.id} className="p-4.5 border-b border-line last:border-b-0">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-small text-ink-500">{c.folio}</span>
                <span className="ml-auto font-mono tabular font-medium">{formatCurrency(c.total)}</span>
              </div>
              <p className="text-small text-ink-500 my-1.5">{c.cliente.nombre}</p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => navigate(`/cotizaciones/${c.id}`)}>Revisar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
