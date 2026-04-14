const StatCard = ({ label, value, sub, icon, color = 'sage' }) => {
  const colors = {
    sage: 'bg-sage-50 text-sage-700',
    terracotta: 'bg-terracotta-50 text-terracotta-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white rounded-xl border border-cloud shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate text-sm">{label}</p>
        <p className="text-ink text-2xl font-bold leading-tight mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-slate text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

export default StatCard;
