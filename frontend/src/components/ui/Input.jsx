const Input = ({ label, error, id, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 rounded-lg border bg-white text-ink text-sm
          placeholder:text-slate/60 transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent
          ${error ? 'border-error' : 'border-border hover:border-slate/50'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
};

export default Input;
