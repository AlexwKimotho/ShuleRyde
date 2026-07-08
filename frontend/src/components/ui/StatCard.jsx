const iconConfig = {
  sage:       { bg: 'bg-sage-500',       text: 'text-white' },
  terracotta: { bg: 'bg-terracotta-500', text: 'text-white' },
  success:    { bg: 'bg-emerald-500',    text: 'text-white' },
  warning:    { bg: 'bg-amber-400',      text: 'text-white' },
  blue:       { bg: 'bg-blue-500',       text: 'text-white' },
  purple:     { bg: 'bg-violet-500',     text: 'text-white' },
};

const StatCard = ({ label, value, sub, icon, color = 'sage', trend }) => {
  const ic = iconConfig[color] || iconConfig.sage;

  return (
    <div className="
      group relative bg-white rounded-2xl p-5
      shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]
      hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.09)]
      hover:-translate-y-0.5
      transition-all duration-200 ease-out
      overflow-hidden
    ">
      {/* Subtle gradient shimmer in corner */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.06] bg-current pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate text-xs font-medium uppercase tracking-widest truncate">{label}</p>
          <p className="text-ink text-2xl font-semibold leading-tight mt-2 tracking-tight">
            {value ?? <span className="skeleton inline-block w-16 h-6 rounded-lg" />}
          </p>
          {sub && <p className="text-slate text-xs mt-1 truncate">{sub}</p>}
          {trend && (
            <div className={`inline-flex items-center gap-1 text-xs font-medium mt-2 px-1.5 py-0.5 rounded-full
              ${trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
              <span>{trend > 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ic.bg} ${ic.text}
          shadow-[0_2px_8px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
