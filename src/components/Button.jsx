const VARIANTES = {
  primary: 'bg-ink-900 text-white border border-ink-900 hover:bg-[#0C1712]',
  secondary: 'bg-transparent text-ink-900 border border-line-strong hover:border-ink-400 hover:bg-surface',
  ghost: 'bg-transparent text-ink-900 border-0 hover:bg-paper',
  danger: 'bg-transparent text-danger border border-danger/30 hover:bg-danger/5',
};

export default function Button({ variant = 'secondary', icon: Icon, children, className = '', ...props }) {
  return (
    <button
      className={`h-9 px-3.5 rounded-control font-medium text-small inline-flex items-center gap-1.5 transition-colors duration-[120ms] ease-std disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTES[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}
