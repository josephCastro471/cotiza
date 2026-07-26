import { X } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

function calcularSubtotalLinea({ cantidad, precioUnitario, descuentoPct }) {
  const bruto = (cantidad || 0) * (precioUnitario || 0);
  return bruto - bruto * ((descuentoPct || 0) / 100);
}

export default function LineasEditor({ lineas, setLineas, catalogo, ivaPct = 15 }) {
  function actualizarLinea(index, campo, valor) {
    const next = [...lineas];
    next[index] = { ...next[index], [campo]: valor };
    setLineas(next);
  }

  function seleccionarCatalogo(index, catalogoItemId) {
    const item = catalogo.find((c) => c.id === catalogoItemId);
    const next = [...lineas];
    next[index] = {
      ...next[index],
      catalogoItemId,
      descripcion: item ? item.nombre : next[index].descripcion,
      precioUnitario: item ? Number(item.precioUnitario) : next[index].precioUnitario,
    };
    setLineas(next);
  }

  function eliminarLinea(index) {
    setLineas(lineas.filter((_, i) => i !== index));
  }

  function agregarFilaVacia() {
    setLineas([...lineas, { descripcion: '', cantidad: 1, precioUnitario: 0, descuentoPct: 0 }]);
  }

  const subtotal = lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0);
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Producto', 'Cant.', 'Precio', 'Desc. %', 'Subtotal', ''].map((h) => (
              <th key={h} className="text-label uppercase text-left px-2 py-2 border-b border-line-strong">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, i) => (
            <tr key={i} className="group">
              <td className="px-2 py-1.5">
                <select
                  value={linea.catalogoItemId || ''}
                  onChange={(e) => seleccionarCatalogo(i, e.target.value)}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small"
                >
                  <option value="">Ítem libre — escribe la descripción</option>
                  {catalogo.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                {!linea.catalogoItemId && (
                  <input
                    placeholder="Descripción"
                    value={linea.descripcion}
                    onChange={(e) => actualizarLinea(i, 'descripcion', e.target.value)}
                    className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small mt-1"
                  />
                )}
              </td>
              <td className="px-2 py-1.5 w-24">
                <input
                  type="number"
                  min="0"
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(i, 'cantidad', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 w-28">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={linea.precioUnitario}
                  onChange={(e) => actualizarLinea(i, 'precioUnitario', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 w-20">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={linea.descuentoPct}
                  onChange={(e) => actualizarLinea(i, 'descuentoPct', Number(e.target.value))}
                  className="w-full h-9 border border-line rounded-control px-2 bg-surface text-small font-mono tabular text-right"
                />
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular">{formatCurrency(calcularSubtotalLinea(linea))}</td>
              <td className="px-2 py-1.5 w-8">
                <button
                  onClick={() => eliminarLinea(i)}
                  className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-danger transition-opacity"
                  aria-label="Eliminar línea"
                >
                  <X size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={agregarFilaVacia} className="text-small text-focus hover:underline mt-2">
        + Agregar línea
      </button>

      <div className="mt-4.5 border-t-2 border-ink-900 pt-2.5 flex flex-col items-end gap-1 text-small">
        <div className="flex gap-4"><span className="text-ink-500">Subtotal</span><span className="font-mono tabular w-28 text-right">{formatCurrency(subtotal)}</span></div>
        <div className="flex gap-4"><span className="text-ink-500">IVA {ivaPct}%</span><span className="font-mono tabular w-28 text-right">{formatCurrency(iva)}</span></div>
        <div className="flex gap-4 text-h3 font-semibold"><span>Total</span><span className="font-mono tabular w-28 text-right">{formatCurrency(total)}</span></div>
      </div>
    </div>
  );
}
