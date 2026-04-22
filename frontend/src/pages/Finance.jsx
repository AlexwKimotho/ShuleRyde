import { useEffect, useState } from 'react';
import { financeAPI } from '../services/api';

const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

const Bar = ({ value, max, color }) => (
  <div className="h-2 bg-cloud rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%' }} />
  </div>
);

const Finance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeAPI.getBalanceSheet()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  const { summary, monthly } = data || { summary: {}, monthly: [] };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Finance</h1>
        <p className="text-slate text-xs sm:text-sm mt-0.5">Revenue overview and balance sheet</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Total Invoiced</p>
          <p className="text-lg sm:text-xl font-semibold text-ink">{fmt(summary.total_invoiced || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Collected</p>
          <p className="text-lg sm:text-xl font-semibold text-green-600">{fmt(summary.total_collected || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-lg sm:text-xl font-semibold text-amber-600">{fmt(summary.total_pending || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Collection Rate</p>
          <p className="text-lg sm:text-xl font-semibold text-ink">{summary.collection_rate || '0.0'}%</p>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-cloud flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Monthly Balance Sheet</h2>
          <p className="text-xs text-slate">All amounts in KES</p>
        </div>

        {monthly.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-slate text-sm">No payment data yet.</p>
            <p className="text-slate/60 text-xs mt-1">Create payments to see your balance sheet.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-cloud">
              {monthly.map((m) => {
                const rate = m.invoiced > 0 ? ((m.collected / m.invoiced) * 100).toFixed(1) : '0.0';
                const rateColor = parseFloat(rate) >= 80 ? 'text-green-600' : parseFloat(rate) >= 50 ? 'text-amber-600' : 'text-red-600';
                const barColor = parseFloat(rate) >= 80 ? 'bg-green-500' : parseFloat(rate) >= 50 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <div key={m.month} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-ink text-sm">{m.month}</p>
                      <span className={`text-sm font-semibold ${rateColor}`}>{rate}%</span>
                    </div>
                    <Bar value={m.collected} max={m.invoiced} color={barColor} />
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-slate">Invoiced</p>
                        <p className="font-medium text-ink">{fmt(m.invoiced)}</p>
                      </div>
                      <div>
                        <p className="text-slate">Collected</p>
                        <p className="font-medium text-green-600">{fmt(m.collected)}</p>
                      </div>
                      <div>
                        <p className="text-slate">Pending</p>
                        <p className="font-medium text-amber-600">{fmt(m.pending)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Mobile total row */}
              <div className="p-4 bg-paper">
                <p className="font-semibold text-ink text-sm mb-2">Total</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate">Invoiced</p>
                    <p className="font-semibold text-ink">{fmt(summary.total_invoiced || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate">Collected</p>
                    <p className="font-semibold text-green-600">{fmt(summary.total_collected || 0)}</p>
                  </div>
                  <div>
                    <p className="text-slate">Pending</p>
                    <p className="font-semibold text-amber-600">{fmt(summary.total_pending || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper border-b border-cloud">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-slate">Month</th>
                    <th className="px-5 py-3 text-right font-medium text-slate">Invoiced</th>
                    <th className="px-5 py-3 text-right font-medium text-slate">Collected</th>
                    <th className="px-5 py-3 text-right font-medium text-slate">Pending</th>
                    <th className="px-5 py-3 text-right font-medium text-slate">Rate</th>
                    <th className="px-5 py-3 text-left font-medium text-slate w-32 hidden lg:table-cell">Collection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud">
                  {monthly.map((m) => {
                    const rate = m.invoiced > 0 ? ((m.collected / m.invoiced) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={m.month} className="hover:bg-paper/50">
                        <td className="px-5 py-4 font-medium text-ink">{m.month}</td>
                        <td className="px-5 py-4 text-right text-slate">{fmt(m.invoiced)}</td>
                        <td className="px-5 py-4 text-right text-green-600 font-medium">{fmt(m.collected)}</td>
                        <td className="px-5 py-4 text-right text-amber-600">{fmt(m.pending)}</td>
                        <td className="px-5 py-4 text-right">
                          <span className={`font-medium ${parseFloat(rate) >= 80 ? 'text-green-600' : parseFloat(rate) >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <Bar value={m.collected} max={m.invoiced} color={parseFloat(rate) >= 80 ? 'bg-green-500' : parseFloat(rate) >= 50 ? 'bg-amber-400' : 'bg-red-400'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-paper border-t-2 border-cloud">
                  <tr>
                    <td className="px-5 py-3 font-semibold text-ink">Total</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">{fmt(summary.total_invoiced || 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-600">{fmt(summary.total_collected || 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-amber-600">{fmt(summary.total_pending || 0)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">{summary.collection_rate || '0.0'}%</td>
                    <td className="hidden lg:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Finance;
