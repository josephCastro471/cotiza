import { Info } from 'lucide-react';
import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../Toast';

export default function DemoStrip() {
  const [restableciendo, setRestableciendo] = useState(false);
  const { mostrar } = useToast();

  async function restablecer() {
    setRestableciendo(true);
    try {
      await api.post('/demo/reset');
      mostrar('Datos de demostración restablecidos.');
      window.location.reload();
    } catch {
      mostrar('No se pudo restablecer los datos. Intenta de nuevo.');
    } finally {
      setRestableciendo(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5 py-1.5 px-6 bg-[#F6EFE1] border-b border-[#E6DBC2] text-small text-[#6B4C0E]">
      <Info size={14} />
      Datos de demostración. Los cambios no afectan a ningún sistema real.
      <button onClick={restablecer} disabled={restableciendo} className="ml-auto underline disabled:opacity-50">
        {restableciendo ? 'Restableciendo…' : 'Restablecer datos'}
      </button>
    </div>
  );
}
