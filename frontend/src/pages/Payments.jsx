import { useEffect, useRef, useState } from 'react';
import { paymentsAPI, parentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `KES ${parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const shortId = (id) => id?.slice(0, 8).toUpperCase();
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

// ── Print helper ───────────────────────────────────────────
const usePrint = (ref) => () => {
  const content = ref.current?.innerHTML;
  if (!content) return;
  const win = window.open('', '_blank', 'width=800,height=600');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>ShuleRyde Document</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2C3E50; background: white; padding: 40px; }
      .doc { max-width: 680px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #6B9080; padding-bottom: 20px; }
      .brand { font-size: 22px; font-weight: 700; color: #6B9080; }
      .brand span { display: block; font-size: 12px; font-weight: 400; color: #5A6C7D; margin-top: 2px; }
      .doc-title { text-align: right; }
      .doc-title h1 { font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #2C3E50; }
      .doc-title p { font-size: 12px; color: #5A6C7D; margin-top: 4px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
      .meta-block h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #5A6C7D; margin-bottom: 6px; }
      .meta-block p { font-size: 14px; color: #2C3E50; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead th { background: #F8F6F1; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #5A6C7D; border-bottom: 1px solid #EAE7DC; }
      tbody td { padding: 14px; font-size: 14px; border-bottom: 1px solid #EAE7DC; }
      .total-row { background: #F8F6F1; }
      .total-row td { font-weight: 700; font-size: 15px; padding: 14px; }
      .amount { text-align: right; }
      .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
      .badge-paid { background: #dcfce7; color: #15803d; }
      .badge-pending { background: #fef3c7; color: #92400e; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #EAE7DC; font-size: 12px; color: #5A6C7D; text-align: center; }
      .mpesa-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 24px; }
      .mpesa-box h4 { font-size: 12px; font-weight: 600; color: #166534; margin-bottom: 6px; }
      .mpesa-box p { font-size: 13px; color: #15803d; }
      @media print { body { padding: 20px; } }
    </style>
    </head><body><div class="doc">${content}</div></body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// ── Invoice Modal ──────────────────────────────────────────
const InvoiceModal = ({ payment, operator, onClose }) => {
  const ref = useRef();
  const print = usePrint(ref);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud">
          <h2 className="font-semibold text-ink">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={print}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Document */}
        <div className="p-8 font-sans text-ink" ref={ref}>
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate mt-0.5">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-widest text-ink">INVOICE</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              <span className="badge badge-pending inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">PENDING</span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Bill To</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-widest text-slate">Issue Date</p>
                <p className="text-sm text-ink">{new Date().toLocaleDateString('en-KE')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate">Due Date</p>
                <p className="text-sm font-semibold text-ink">{dueDate.toLocaleDateString('en-KE')}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mb-6 text-sm border-collapse">
            <thead>
              <tr className="bg-paper border-y border-cloud">
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cloud">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink">School Transport Fee</p>
                  <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmt(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-paper">
                <td className="px-4 py-3 font-bold text-ink">Total Due</td>
                <td className="px-4 py-3 text-right font-bold text-ink text-base">{fmt(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* M-Pesa */}
          {operator?.mpesa_paybill && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Pay via M-Pesa</p>
              <p className="text-sm text-green-800">Paybill / Till: <strong>{operator.mpesa_paybill}</strong></p>
              <p className="text-sm text-green-800">Account: <strong>{shortId(payment.id)}</strong></p>
            </div>
          )}

          <p className="text-xs text-slate text-center mt-6">Thank you for trusting ShuleRyde with your child's transport. — {operator?.business_name}</p>
        </div>
      </div>
    </div>
  );
};

// ── Receipt Modal ──────────────────────────────────────────
const ReceiptModal = ({ payment, operator, onClose }) => {
  const ref = useRef();
  const print = usePrint(ref);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud">
          <h2 className="font-semibold text-ink">Receipt Preview</h2>
          <div className="flex gap-2">
            <Button onClick={print}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-8 font-sans text-ink" ref={ref}>
          {/* Header */}
          <div className="flex justify-between items-start mb-10 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate mt-0.5">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">PAID</span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Received From</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-widest text-slate">Date Paid</p>
                <p className="text-sm font-semibold text-ink">
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate">Method</p>
                <p className="text-sm text-ink">{payment.payment_method || 'Cash'}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mb-6 text-sm border-collapse">
            <thead>
              <tr className="bg-paper border-y border-cloud">
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cloud">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink">School Transport Fee</p>
                  <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmt(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-green-50">
                <td className="px-4 py-3 font-bold text-green-800">Total Received</td>
                <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmt(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Confirmation */}
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 text-center">
            <p className="text-green-700 font-semibold text-sm">Payment Confirmed</p>
            <p className="text-green-600 text-xs mt-0.5">This receipt confirms full payment for {monthLabel(payment.invoice_month)}.</p>
          </div>

          <p className="text-xs text-slate text-center mt-4">Thank you for trusting ShuleRyde with your child's transport. — {operator?.business_name}</p>
        </div>
      </div>
    </div>
  );
};

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
  const { operator } = useAuth();
  const [payments, setPayments] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [docModal, setDocModal] = useState(null); // { type: 'invoice'|'receipt', payment }
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
      const { data } = await paymentsAPI.markAsPaid(id, { payment_method: 'CASH' });
      setPayments((prev) => prev.map((p) => p.id === id ? data.payment : p));
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
      {docModal?.type === 'invoice' && <InvoiceModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} />}
      {docModal?.type === 'receipt' && <ReceiptModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} />}

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
                        <>
                          <Button size="sm" variant="secondary"
                            onClick={() => setDocModal({ type: 'invoice', payment: p })}>
                            Invoice
                          </Button>
                          <Button size="sm" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>
                            Mark Paid
                          </Button>
                        </>
                      )}
                      {p.status === 'PAID' && (
                        <Button size="sm" variant="secondary"
                          onClick={() => setDocModal({ type: 'receipt', payment: p })}>
                          Receipt
                        </Button>
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
