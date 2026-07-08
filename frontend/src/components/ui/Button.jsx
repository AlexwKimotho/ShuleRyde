const variants = {
  primary:   'bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]',
  secondary: 'bg-white hover:bg-paper active:bg-cloud border border-border/80 text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
  danger:    'bg-error hover:bg-red-600 active:bg-red-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  ghost:     'text-slate hover:bg-black/[0.04] hover:text-ink active:bg-black/[0.07]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) => (
  <button
    className={`
      inline-flex items-center justify-center font-medium
      transition-all duration-150 ease-out
      active:scale-[0.97]
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2
      disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
      ${variants[variant]} ${sizes[size]} ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <svg
        className="animate-spin h-3.5 w-3.5 flex-shrink-0"
        fill="none" viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : null}
    {children}
  </button>
);

export default Button;
