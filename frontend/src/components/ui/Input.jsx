const Input = ({ label, error, id, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-[13px] font-medium text-ink/80 tracking-tight">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`
        w-full px-3.5 py-2.5 rounded-xl text-sm text-ink
        bg-white border transition-all duration-200
        placeholder:text-slate/45
        focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500/60
        ${error
          ? 'border-error/60 bg-error/[0.02]'
          : 'border-border/70 hover:border-border focus:bg-white'
        }
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
        ${className}
      `}
      {...props}
    />
    {error && (
      <p className="text-xs text-error flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

export default Input;
