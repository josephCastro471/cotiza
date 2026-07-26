import Button from './Button';

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-2">
      {Icon && <Icon size={24} className="text-ink-400 mb-1" />}
      <p className="text-h3 font-semibold">{title}</p>
      <p className="text-small text-ink-500 max-w-sm">{subtitle}</p>
      {actionLabel && (
        <Button variant="primary" onClick={onAction} className="mt-3">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
