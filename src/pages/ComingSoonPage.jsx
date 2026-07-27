import { Sparkles } from 'lucide-react';

export default function ComingSoonPage({ title }) {
  return (
    <div className="bg-surface border border-line rounded-card flex flex-col items-center text-center py-20 gap-2">
      <Sparkles size={24} className="text-ink-400 mb-1" />
      <p className="text-h3 font-semibold">{title}</p>
      <p className="text-small text-ink-500 max-w-sm">
        Esta sección estará disponible próximamente.
      </p>
    </div>
  );
}
