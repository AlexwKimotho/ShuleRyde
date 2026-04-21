import { useEffect, useState } from 'react';
import { paymentsAPI, parentsAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

// ── Add Payment Modal ──────────────────────────────────────
const PaymentModal = ({ parents, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ parent_id: '', amount: '', invoice_month: currentMonth() });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.parent_id || !form.amount) { setError('Parent and amount are required'); return; }
    setLoading(true); setError('');
    try {
      await paymentsAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Add Payment</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Parent</label>
            <select name="parent_id" value={form.parent_id} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">— Select parent —</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name} · {p.phone}</option>)}
            </select>
          </div>
          <Input id="amount" name="amount" type="number" label="Amount (KES)" placeholder="3500" value={form.amount} onChange={handleChange} />
          <Input id="invoice_month" name="invoice_month" type="month" label="Invoice Month" value={form.invoice_month} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Add Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Generate Modal ─────────────────────────────────────────
const GenerateModal = ({ onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ month: currentMonth(), amount: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) { setError('Amount is required'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await paymentsAPI.generateMonthly(form.month, { amount: form.amount });
      onSaved(`Generated ${data.created} invoice${data.created !== 1 ? 's' : ''} for ${form.month}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate invoices');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-ink mb-1">Generate Monthly Invoices</h2>
        <p className="text-slate text-sm mb-4">Creates a PENDING payment for every parent who doesn't have one for this month.</p>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="month" name="month" type="month" label="Month" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} />
          <Input id="amount" name="amount" type="number" label="Amount per Parent (KES)" placeholder="3500" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Generate</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'generate'
  const [marking, setMarking] = useState(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('');

  const load = async () => {
    try {
      const [{ data: pd }, { data: prd }] = await Promise.all([paymentsAPI.getAll(), parentsAPI.getAll()]);
      setPayments(pd.payments);
      setParents(prd.parents);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async (id) => {
    setMarking(id);
    try {
      await paymentsAPI.markAsPaid(id, { payment_method: 'CASH' });
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'PAID', payment_date: new Date().toISOString() } : p));
    } catch {}
    finally { setMarking(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await paymentsAPI.delete(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const filtered = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterMonth && p.invoice_month !== filterMonth) return false;
    return true;
  });

  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalCollected = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {modal === 'add' && <PaymentModal parents={parents} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSaved={(msg) => { setModal(null); load(); showToast(msg); }} />}

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">Payments</h1>
          <p className="text-slate text-sm mt-1">Track and manage parent payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModal('generate')}>Generate Invoices</Button>
          <Button onClick={() => setModal('add')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Payment
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-cloud p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Collected</p>
          <p className="text-2xl font-semibold text-green-600">KES {totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Pending</p>
          <p className="text-2xl font-semibold text-amber-600">KES {totalPending.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        {['ALL', 'PENDING', 'PAID'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-ink text-white' : 'bg-white border border-cloud text-slate hover:bg-paper'}`}>
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-cloud p-10 text-center">
          <p className="text-slate">No payments found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-cloud">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate">Parent</th>
                <th className="px-5 py-3 text-left font-medium text-slate">Month</th>
                <th className="px-5 py-3 text-left font-medium text-slate">Amount</th>
                <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                <th className="px-5 py-3 text-left font-medium text-slate hidden md:table-cell">Date Paid</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{p.parents?.full_name}</p>
                    <p className="text-xs text-slate">{p.parents?.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-slate">{p.invoice_month}</td>
                  <td className="px-5 py-4 font-medium text-ink">KES {parseFloat(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-slate hidden md:table-cell">
                    {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-KE') : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === 'PENDING' && (
                        <Button size="sm" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                      )}
                      <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;
