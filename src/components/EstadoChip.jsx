const ESTADOS = {
  BORRADOR: { color: '#6E7A74', label: 'Borrador' },
  ENVIADO: { color: '#2F5D8C', label: 'Enviado' },
  APROBADO: { color: '#1F6B4E', label: 'Aprobado' },
  RECHAZADO: { color: '#A33A28', label: 'Rechazado' },
  VENCIDO: { color: '#8A6212', label: 'Vencido' },
};

export default function EstadoChip({ estado }) {
  const info = ESTADOS[estado];
  return (
    <span className="inline-flex items-center text-small text-ink-700 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
