import { useEffect, useState } from 'react';
import { financeAPI, expensesAPI, vehiclesAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const EXPENSE_CATEGORIES = ['FUEL', 'SERVICE', 'FINE', 'SALARY', 'OTHER'];
const EXPENSE_COLORS = {
  FUEL: 'bg-orange-100 text-orange-700',
  SERVICE: 'bg-blue-100 text-blue-700',
  FINE: 'bg-red-100 text-red-700',
  SALARY: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-cloud text-slate',
};

const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

const Spinner = () => (
  <div className="flex justify-center py-20">
    <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
);

// ── P&L Statement Tab ──────────────────────────────────────────
const ProfitLossTab = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <>
      <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden mb-6">
        <div className="px-4 sm:px-5 py-4 border-b border-cloud bg-paper">
          <h2 className="font-semibold text-ink">Profit & Loss Statement</h2>
        </div>
        <div className="p-5">
          <table className="w-full">
            <tbody className="divide-y divide-cloud text-sm">
              <tr><td className="py-3 font-medium text-ink">Total Revenue</td><td className="py-3 text-right text-green-600 font-semibold">{fmt(data.totalRevenue || 0)}</td></tr>
              <tr><td className="py-3 font-medium text-ink">Amount Collected</td><td className="py-3 text-right text-green-600">{fmt(data.totalCollected || 0)}</td></tr>
              <tr className="bg-paper"><td className="py-3 font-semibold text-ink">Total Expenses (actual)</td><td className="py-3 text-right text-red-600 font-semibold">{fmt(data.totalExpenses || 0)}</td></tr>
              <tr className="bg-green-50 border-t-2 border-green-200"><td className="py-3 font-bold text-green-900">Net Profit</td><td className="py-3 text-right font-bold text-green-700 text-lg">{fmt(data.netProfit || 0)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-cloud p-4"><p className="text-xs text-slate uppercase tracking-wide mb-1">Profit Margin</p><p className="text-2xl font-semibold text-ink">{data.profitMargin || 0}%</p></div>
        <div className="bg-white rounded-xl border border-cloud p-4"><p className="text-xs text-slate uppercase tracking-wide mb-1">Collection Rate</p><p className="text-2xl font-semibold text-green-600">{data.collectionRate || 0}%</p></div>
      </div>
      {data.monthly?.length > 0 && (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-cloud bg-paper"><h2 className="font-semibold text-ink">Monthly Breakdown</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-cloud bg-paper">
                <th className="px-4 py-3 text-left font-medium text-slate">Month</th>
                <th className="px-4 py-3 text-right font-medium text-slate">Revenue</th>
                <th className="px-4 py-3 text-right font-medium text-slate">Collected</th>
                <th className="px-4 py-3 text-right font-medium text-slate">Expenses</th>
                <th className="px-4 py-3 text-right font-medium text-slate">Net Profit</th>
              </tr></thead>
              <tbody className="divide-y divide-cloud">
                {data.monthly.map((m) => {
                  const profit = m.revenue - (m.expenses || 0);
                  return (
                    <tr key={m.month} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{monthLabel(m.month)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(m.revenue)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(m.collected)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(m.expenses || 0)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{fmt(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

// ── Balance Sheet Tab ──────────────────────────────────────────
const BalanceSheetTab = ({ data, loading }) => {
  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud"><h2 className="font-semibold text-ink">Assets</h2></div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Cash Collected</p><p className="font-semibold text-ink">{fmt(data.totalCollected || 0)}</p></div>
            <div className="flex items-center justify-between py-4 bg-green-50 rounded px-3 mt-3"><p className="font-bold text-green-900">Total Assets</p><p className="font-bold text-green-700 text-lg">{fmt(data.assets || 0)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud"><h2 className="font-semibold text-ink">Liabilities & Equity</h2></div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Accounts Payable</p><p className="font-semibold text-red-600">{fmt(data.liabilities || 0)}</p></div>
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Owner's Equity</p><p className="font-semibold text-ink">{fmt(data.equity || 0)}</p></div>
            <div className="flex items-center justify-between py-4 bg-blue-50 rounded px-3 mt-3"><p className="font-bold text-blue-900">Total L & E</p><p className="font-bold text-blue-700 text-lg">{fmt((data.liabilities || 0) + (data.equity || 0))}</p></div>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate">Total Invoiced</p><p className="font-semibold text-ink">{fmt(data.totalInvoiced || 0)}</p></div>
          <div><p className="text-slate">Total Collected</p><p className="font-semibold text-green-600">{fmt(data.totalCollected || 0)}</p></div>
          <div><p className="text-slate">Outstanding</p><p className="font-semibold text-amber-600">{fmt(data.totalOutstanding || 0)}</p></div>
          <div><p className="text-slate">Collection Rate</p><p className="font-semibold text-ink">{data.collectionRate || 0}%</p></div>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Invoice Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center"><p className="text-2xl font-bold text-green-600">{data.invoices?.paid || 0}</p><p className="text-slate text-xs mt-1">Paid</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-600">{data.invoices?.partiallypaid || 0}</p><p className="text-slate text-xs mt-1">Partially Paid</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-amber-600">{data.invoices?.pending || 0}</p><p className="text-slate text-xs mt-1">Pending</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-ink">{data.invoices?.total || 0}</p><p className="text-slate text-xs mt-1">Total</p></div>
        </div>
      </div>
    </>
  );
};

// ── Expenses Tab ──────────────────────────────────────────────
const ExpensesTab = () => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const [{ data: ed }, { data: vd }] = await Promise.all([expensesAPI.getAll(), vehiclesAPI.getAll()]);
      setExpenses(ed.expenses);
      setVehicles(vd.vehicles);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = expenses.filter((e) => filterCategory === 'ALL' || e.category === filterCategory);
  const total = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setDeleting(id);
    try {
      await expensesAPI.delete(id);
      setExpenses((p) => p.filter((e) => e.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const ExpenseModal = ({ expense, onClose, onSaved }) => {
    const isEdit = Boolean(expense?.id);
    const [loadingModal, setLoadingModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
      category: expense?.category || 'FUEL',
      amount: expense?.amount || '',
      description: expense?.description || '',
      expense_date: expense?.expense_date || new Date().toISOString().slice(0, 10),
      vehicle_id: expense?.vehicle_id || '',
      notes: expense?.notes || '',
    });

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.amount || !form.description) { setError('Category, amount and description are required'); return; }
      setLoadingModal(true); setError('');
      try {
        if (isEdit) await expensesAPI.update(expense.id, form);
        else await expensesAPI.create(form);
        onSaved();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to save expense');
      } finally { setLoadingModal(false); }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">Category</label>
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <Input id="amount" name="amount" type="number" label="Amount (KES)" placeholder="5000" value={form.amount} onChange={handleChange} step="0.01" />
            <Input id="description" name="description" label="Description" placeholder="e.g. Diesel fill-up – KBZ 123A" value={form.description} onChange={handleChange} />
            <Input id="expense_date" name="expense_date" type="date" label="Date" value={form.expense_date} onChange={handleChange} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">Vehicle (optional)</label>
              <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
                <option value="">— Not vehicle-specific —</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate} · {v.model}</option>)}
              </select>
            </div>
            <Input id="notes" name="notes" label="Notes (optional)" placeholder="Additional details…" value={form.notes} onChange={handleChange} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={loadingModal} className="flex-1">{isEdit ? 'Save' : 'Add Expense'}</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      {toast && <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded-xl text-sm shadow-lg">{toast}</div>}
      {modal && (
        <ExpenseModal
          expense={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); showToast(modal === 'new' ? 'Expense recorded' : 'Expense updated'); }}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <p className="text-slate text-sm">Track fuel, service, fines, and salaries</p>
        <Button size="sm" onClick={() => setModal('new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {EXPENSE_CATEGORIES.map((cat) => (
          <div key={cat} className="bg-white rounded-xl border border-cloud p-3">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1.5 ${EXPENSE_COLORS[cat]}`}>{cat}</span>
            <p className="font-semibold text-ink text-sm">{fmt(byCategory[cat] || 0)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['ALL', ...EXPENSE_CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCategory === cat ? 'bg-ink text-white' : 'bg-white border border-cloud text-slate hover:bg-paper'}`}>
            {cat === 'ALL' ? 'All' : cat}
          </button>
        ))}
        <div className="sm:ml-auto bg-white border border-cloud rounded-lg px-3 py-1.5 text-sm font-medium text-ink">
          Total: {fmt(total)}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-cloud p-10 text-center">
          <p className="text-slate">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <table className="w-full text-sm hidden md:table">
            <thead><tr className="border-b border-cloud bg-paper">
              <th className="px-4 py-3 text-left font-medium text-slate">Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate">Category</th>
              <th className="px-4 py-3 text-left font-medium text-slate">Description</th>
              <th className="px-4 py-3 text-left font-medium text-slate">Vehicle</th>
              <th className="px-4 py-3 text-right font-medium text-slate">Amount</th>
              <th className="px-4 py-3" />
            </tr></thead>
            <tbody className="divide-y divide-cloud">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-paper transition-colors">
                  <td className="px-4 py-3.5 text-slate">{new Date(e.expense_date).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXPENSE_COLORS[e.category]}`}>{e.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-ink">{e.description}</p>
                    {e.notes && <p className="text-xs text-slate mt-0.5">{e.notes}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-slate text-xs">{e.vehicles?.license_plate || '—'}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-ink">{fmt(e.amount)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(e)} className="text-slate hover:text-ink transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="text-slate hover:text-error transition-colors disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="md:hidden flex flex-col divide-y divide-cloud">
            {filtered.map((e) => (
              <div key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXPENSE_COLORS[e.category]}`}>{e.category}</span>
                      <span className="text-xs text-slate">{new Date(e.expense_date).toLocaleDateString('en-KE')}</span>
                    </div>
                    <p className="font-medium text-ink text-sm">{e.description}</p>
                    {e.vehicles?.license_plate && <p className="text-xs text-slate mt-0.5">{e.vehicles.license_plate}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-ink">{fmt(e.amount)}</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => setModal(e)} className="text-slate hover:text-ink">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="text-slate hover:text-error disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ── Main Finance Component — single fetch via /finance/all ─────
const Finance = () => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [pnlData, setPnlData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    setLoading(true);
    financeAPI.getAll(year)
      .then(({ data }) => {
        setPnlData(data.pnl);
        setSummaryData(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  const TABS = [
    { id: 'expenses', label: 'Expenses' },
    { id: 'profit-loss', label: 'P&L Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Finance</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Manage expenses, revenue & financial reporting</p>
        </div>
        {(activeTab === 'profit-loss' || activeTab === 'balance-sheet') && (
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 self-start sm:self-auto"
          >
            {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-cloud overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-sage-500 text-ink' : 'border-transparent text-slate hover:text-ink'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab data={pnlData} loading={loading} />}
        {activeTab === 'balance-sheet' && <BalanceSheetTab data={summaryData} loading={loading} />}
      </div>
    </div>
  );
};

export default Finance;
