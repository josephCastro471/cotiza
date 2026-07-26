const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatCurrency(valor) {
  const numero = Number(valor);
  const partes = numero.toFixed(2).split('.');
  const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${entero},${partes[1]}`;
}

export function formatDate(fecha) {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
