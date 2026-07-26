import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import LineasEditor from './LineasEditor';

export default function CotizacionEditorPage() {
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaValidez, setFechaValidez] = useState('');
  const [lineas, setLineas] = useState([{ descripcion: '', cantidad: 1, precioUnitario: 0, descuentoPct: 0 }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorCarga, setErrorCarga] = useState(false);
  const navigate = useNavigate();
  const { mostrar } = useToast();

  useEffect(() => {
    api.get('/clientes').then((res) => setClientes(res.data)).catch(() => setErrorCarga(true));
    api.get('/catalogo').then((res) => setCatalogo(res.data)).catch(() => setErrorCarga(true));
    const enQuinceDias = new Date();
    enQuinceDias.setDate(enQuinceDias.getDate() + 15);
    setFechaValidez(enQuinceDias.toISOString().slice(0, 10));
  }, []);

  async function guardar() {
    setError('');
    const lineasValidas = lineas.filter((l) => l.descripcion && l.cantidad > 0);
    if (!clienteId || lineasValidas.length === 0) {
      setError('Selecciona un cliente y agrega al menos una línea con descripción y cantidad.');
      return;
    }
    setGuardando(true);
    try {
      const { data } = await api.post('/cotizaciones', {
        clienteId,
        fechaValidez: new Date(fechaValidez).toISOString(),
        lineas: lineasValidas,
      });
      mostrar('Cotización guardada como borrador.');
      navigate(`/cotizaciones/${data.id}`);
    } catch {
      setError('No se pudo guardar la cotización. Revisa los datos e intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  if (errorCarga) return <div className="p-6 text-small text-danger">No se pudo cargar los datos del formulario. Intenta de nuevo.</div>;

  return (
    <div>
      <div className="flex items-end gap-4 mb-5">
        <h1 className="text-h1 font-semibold">Nueva cotización</h1>
        <div className="flex-1" />
        <Button variant="primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar borrador'}
        </Button>
      </div>

      <div className="bg-surface border border-line rounded-card p-5 mb-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-small text-ink-500 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
          >
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="w-52">
          <label className="block text-small text-ink-500 mb-1">Vence</label>
          <input
            type="date"
            value={fechaValidez}
            onChange={(e) => setFechaValidez(e.target.value)}
            className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
          />
        </div>
      </div>

      {error && <p className="text-small text-danger mb-3">{error}</p>}

      <div className="bg-surface border border-line rounded-card p-5">
        <LineasEditor lineas={lineas} setLineas={setLineas} catalogo={catalogo} />
      </div>
    </div>
  );
}
