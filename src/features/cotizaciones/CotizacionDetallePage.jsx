import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Send, Copy } from 'lucide-react';
import api, { leerSesion } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { formatCurrency, formatDate } from '../../lib/format';
import Button from '../../components/Button';

const ETIQUETA_EVENTO = {
  CREADA: 'Creada', ENVIADA: 'Enviada', APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada', DEVUELTA: 'Devuelta', VENCIDA: 'Vencida',
};

export default function CotizacionDetallePage() {
  const { id } = useParams();
  const [cotizacion, setCotizacion] = useState(null);
  const [actuando, setActuando] = useState(false);
  const [error, setError] = useState(false);
  const { usuario } = useAuth();
  const { mostrar } = useToast();
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api.get(`/cotizaciones/${id}`).then((res) => setCotizacion(res.data)).catch(() => setError(true));
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function ejecutarAccion(accion, mensajeExito) {
    setActuando(true);
    try {
      await api.post(`/cotizaciones/${id}/${accion}`);
      mostrar(mensajeExito);
      cargar();
    } catch (err) {
      mostrar(err.response?.data?.error?.message || 'No se pudo completar la acción.');
    } finally {
      setActuando(false);
    }
  }

  async function duplicar() {
    setActuando(true);
    try {
      const { data } = await api.post(`/cotizaciones/${id}/duplicar`);
      mostrar('Cotización duplicada como nuevo borrador.');
      navigate(`/cotizaciones/${data.id}`);
    } catch {
      mostrar('No se pudo duplicar la cotización.');
    } finally {
      setActuando(false);
    }
  }

  function descargarPdf() {
    const { token } = leerSesion();
    fetch(`${import.meta.env.VITE_API_URL}/cotizaciones/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch(() => mostrar('No se pudo descargar el PDF. Intenta de nuevo.'));
  }

  if (error) return <div className="p-6 text-small text-danger">No se pudo cargar la cotización. Intenta de nuevo.</div>;
  if (!cotizacion) return null;

  const puedeEnviar = cotizacion.estado === 'BORRADOR' && ['ADMIN', 'GERENTE', 'VENDEDOR'].includes(usuario.rol);
  const puedeAprobarRechazar = cotizacion.estado === 'ENVIADO' && ['ADMIN', 'GERENTE'].includes(usuario.rol);
  const puedeDuplicar = ['APROBADO', 'RECHAZADO', 'VENCIDO'].includes(cotizacion.estado) && ['ADMIN', 'GERENTE', 'VENDEDOR'].includes(usuario.rol);
  const sello = cotizacion.estado === 'APROBADO' || cotizacion.estado === 'RECHAZADO' ? cotizacion.estado : null;
  const colorSello = cotizacion.estado === 'APROBADO' ? 'text-st-approved border-st-approved' : 'text-st-rejected border-st-rejected';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
      <div className="bg-surface border border-line rounded-card p-5.5 relative overflow-hidden">
        {sello && (
          <div className={`absolute top-6 right-5 border-2 rounded-chip px-3.5 py-1.5 text-center -rotate-[4deg] opacity-85 ${colorSello}`}>
            <b className="block font-mono text-small font-semibold tracking-[0.18em]">{sello}</b>
            <span className="block font-mono text-[11px] mt-0.5">{formatDate(cotizacion.updatedAt)}</span>
          </div>
        )}
        <h4 className="font-serif font-semibold text-[17px]">{cotizacion.empresa?.nombre}</h4>
        <div className="font-mono text-label text-ink-500 mt-1">{cotizacion.folio} · emitida {formatDate(cotizacion.fechaEmision)}</div>
        <p className="text-small text-ink-500 mt-3">{cotizacion.cliente.nombre} — RUC {cotizacion.cliente.ruc}</p>

        <table className="w-full border-collapse mt-4">
          <thead>
            <tr>
              {['Descripción', 'Cant.', 'Precio', 'Subtotal'].map((h) => (
                <th key={h} className="text-label uppercase text-left px-2 py-2 border-b border-line-strong">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cotizacion.lineas.map((l, i) => (
              <tr key={l.id} className={i % 2 === 1 ? 'bg-band' : ''}>
                <td className="px-2 h-11">{l.descripcion}</td>
                <td className="px-2 font-mono tabular">{l.cantidad}</td>
                <td className="px-2 font-mono tabular text-right">{formatCurrency(l.precioUnitario)}</td>
                <td className="px-2 font-mono tabular text-right">{formatCurrency(l.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4.5 border-t-2 border-ink-900 pt-2.5 flex justify-end gap-5 items-baseline">
          <span className="text-label uppercase">Total con IVA</span>
          <b className="font-mono tabular text-[16px]">{formatCurrency(cotizacion.total)}</b>
        </div>

        <div className="mt-4 border-t border-line pt-3 grid gap-1.5 text-small">
          {cotizacion.eventos.map((e) => (
            <div key={e.id} className="flex gap-3 text-ink-500">
              <b className="w-20 font-medium text-ink-700">{ETIQUETA_EVENTO[e.tipo]}</b>
              <span className="font-mono text-[12px]">{formatDate(e.createdAt)}</span>
              {e.actor.nombre}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-card p-4.5 flex flex-col gap-2">
        {puedeEnviar && (
          <Button variant="primary" icon={Send} disabled={actuando} onClick={() => ejecutarAccion('enviar', 'Cotización enviada.')}>
            Enviar a aprobación
          </Button>
        )}
        {puedeAprobarRechazar && (
          <>
            <Button variant="primary" disabled={actuando} onClick={() => ejecutarAccion('aprobar', 'Cotización aprobada.')}>Aprobar</Button>
            <Button variant="secondary" disabled={actuando} onClick={() => ejecutarAccion('rechazar', 'Cotización rechazada.')}>Rechazar</Button>
          </>
        )}
        {puedeDuplicar && (
          <Button variant="secondary" icon={Copy} disabled={actuando} onClick={duplicar}>Duplicar</Button>
        )}
        <Button variant="secondary" icon={Download} onClick={descargarPdf}>Descargar PDF</Button>
      </div>
    </div>
  );
}
