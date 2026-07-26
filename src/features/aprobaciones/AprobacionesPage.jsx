import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../components/Toast';
import { formatCurrency } from '../../lib/format';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function AprobacionesPage() {
  const [pendientes, setPendientes] = useState([]);
  const [actuandoId, setActuandoId] = useState(null);
  const [error, setError] = useState(false);
  const { mostrar } = useToast();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api.get('/cotizaciones', { params: { estado: 'ENVIADO' } })
      .then((res) => setPendientes(res.data))
      .catch(() => setError(true));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function resolver(id, accion, mensajeExito) {
    setActuandoId(id);
    try {
      await api.post(`/cotizaciones/${id}/${accion}`);
      mostrar(mensajeExito);
      cargar();
    } catch {
      mostrar('No se pudo completar la acción.');
    } finally {
      setActuandoId(null);
    }
  }

  if (error) return <div className="p-6 text-small text-danger">No se pudo cargar las aprobaciones pendientes. Intenta de nuevo.</div>;

  return (
    <div>
      <h1 className="text-h1 font-semibold mb-5">Aprobaciones</h1>

      {pendientes.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No hay cotizaciones pendientes" subtitle="Todo lo enviado ya fue aprobado o rechazado." />
      ) : (
        <div className="bg-surface border border-line rounded-card divide-y divide-line">
          {pendientes.map((c) => (
            <div key={c.id} className="p-4.5">
              <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => navigate(`/cotizaciones/${c.id}`)}>
                <span className="font-mono text-small text-ink-500">{c.folio}</span>
                <span className="ml-auto font-mono tabular font-medium">{formatCurrency(c.total)}</span>
              </div>
              <p className="text-small text-ink-500 my-1.5">{c.cliente.nombre}</p>
              <div className="flex gap-2">
                <Button variant="primary" disabled={actuandoId === c.id} onClick={() => resolver(c.id, 'aprobar', 'Cotización aprobada.')}>
                  Aprobar
                </Button>
                <Button variant="secondary" disabled={actuandoId === c.id} onClick={() => resolver(c.id, 'rechazar', 'Cotización rechazada.')}>
                  Rechazar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
