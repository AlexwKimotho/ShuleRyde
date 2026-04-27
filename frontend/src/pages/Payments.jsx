import { useEffect, useRef, useState } from 'react';
import { paymentsAPI, parentsAPI, schoolsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

const PAGE_SIZE = 15;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `KES ${parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const shortId = (id) => id?.slice(0, 8).toUpperCase();
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

const latestInstallment = (p) => {
  const txns = p.payment_transactions || [];
  if (!txns.length) return null;
  return [...txns].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0];
};

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Invoice Preview</h2>
          <div className="flex gap-2">
            <Button onClick={print} size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-5 sm:p-8 font-sans text-ink" ref={ref}>
          <div className="flex justify-between items-start mb-8 sm:mb-10 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-lg sm:text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate mt-0.5">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-ink">INVOICE</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">PENDING</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
  const installment = latestInstallment(payment);
  const displayAmount = installment ? parseFloat(installment.amount) : parseFloat(payment.amount_collected || payment.amount);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Receipt Preview</h2>
          <div className="flex gap-2">
            <Button onClick={print} size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-5 sm:p-8 font-sans text-ink" ref={ref}>
          <div className="flex justify-between items-start mb-8 sm:mb-10 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-lg sm:text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate mt-0.5">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                {payment.status === 'PARTIALLY_PAID' ? 'PARTIAL' : 'PAID'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Received From</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-xs uppercase tracking-widest text-slate">Date Paid</p>
                <p className="text-sm font-semibold text-ink">
                  {installment?.paid_at ? new Date(installment.paid_at).toLocaleDateString('en-KE') : payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate">Method</p>
                <p className="text-sm text-ink">{installment?.payment_method || payment.payment_method || 'Cash'}</p>
              </div>
            </div>
          </div>
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
                  {payment.status === 'PARTIALLY_PAID' && (
                    <p className="text-xs text-blue-600 mt-0.5">Latest installment — Total due: {fmt(payment.amount)}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmt(displayAmount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-green-50">
                <td className="px-4 py-3 font-bold text-green-800">Amount Received</td>
                <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmt(displayAmount)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6 text-center">
            <p className="text-green-700 font-semibold text-sm">Payment Confirmed</p>
            <p className="text-green-600 text-xs mt-0.5">
              {payment.status === 'PARTIALLY_PAID'
                ? `Installment receipt for ${monthLabel(payment.invoice_month)}. Balance: ${fmt(parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0))}`
                : `This receipt confirms full payment for ${monthLabel(payment.invoice_month)}.`}
            </p>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
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

// ── Partial Payment Modal ──────────────────────────────────
const PartialPaymentModal = ({ payment, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount_paid: '', payment_method: 'CASH', notes: '' });
  const remaining = parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount_paid || parseFloat(form.amount_paid) <= 0) { setError('Amount must be greater than 0'); return; }
    if (parseFloat(form.amount_paid) > remaining) { setError(`Amount cannot exceed remaining balance of ${fmt(remaining)}`); return; }
    setLoading(true); setError('');
    try {
      await paymentsAPI.recordPartialPayment(payment.id, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-1">Record Installment</h2>
        <p className="text-sm text-slate mb-4">
          {payment.parents?.full_name} · {monthLabel(payment.invoice_month)} · Remaining: <strong>{fmt(remaining)}</strong>
        </p>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="amount_paid" name="amount_paid" type="number" label="Amount Received (KES)" placeholder={remaining.toFixed(2)} value={form.amount_paid} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Payment Method</label>
            <select name="payment_method" value={form.payment_method} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="CASH">Cash</option>
              <option value="MPESA">M-Pesa</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <Input id="notes" name="notes" label="Notes (optional)" placeholder="e.g. Ref: QA72XKPL" value={form.notes} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Record</Button>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
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
  const [schools, setSchools] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [docModal, setDocModal] = useState(null);
  const [partialModal, setPartialModal] = useState(null);
  const [marking, setMarking] = useState(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const [{ data: pd }, { data: prd }, { data: sd }, { data: ad }] = await Promise.all([
        paymentsAPI.getAll(),
        parentsAPI.getAll(),
        schoolsAPI.getAll(),
        schoolsAPI.getAnalytics(),
      ]);
      setPayments(pd.payments);
      setParents(prd.parents);
      setSchools(sd.schools);
      setAnalytics(ad.analytics);
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

  // Build parent -> school_ids map for school filtering
  const parentSchoolMap = {};
  parents.forEach(p => {
    parentSchoolMap[p.id] = new Set((p.children || []).map(c => c.school_id).filter(Boolean));
  });

  const filtered = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterMonth && p.invoice_month !== filterMonth) return false;
    if (filterSchool && !parentSchoolMap[p.parent_id]?.has(filterSchool)) return false;
    if (dateFrom && p.payment_date && p.payment_date < dateFrom) return false;
    if (dateTo && p.payment_date && p.payment_date > dateTo + 'T23:59:59Z') return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagePayments = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0)
    + payments.filter(p => p.status === 'PARTIALLY_PAID').reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
  const totalOutstanding = payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + parseFloat(p.amount) - parseFloat(p.amount_collected || 0), 0);

  const hasActiveFilters = filterStatus !== 'ALL' || filterMonth || filterSchool || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterMonth('');
    setFilterSchool('');
    setDateFrom('');
    setDateTo('');
    resetPage();
  };

  const bulkDownload = (type) => {
    const docs = type === 'invoices'
      ? filtered.filter(p => p.status === 'PENDING')
      : filtered.filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID');
    if (!docs.length) { showToast(`No ${type} in current view`); return; }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const docHTML = docs.map((p, idx) => {
      const isInvoice = type === 'invoices';
      const installment = latestInstallment(p);
      const displayAmt = installment ? parseFloat(installment.amount) : parseFloat(p.amount_collected || p.amount);
      return `
        ${idx > 0 ? '<div style="page-break-before:always;margin-top:40px;"></div>' : ''}
        <div style="max-width:680px;margin:0 auto;padding:40px 20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #6B9080;padding-bottom:20px;margin-bottom:32px;">
            <div>
              <p style="font-size:20px;font-weight:700;color:#6B9080;">ShuleRyde</p>
              <p style="font-size:12px;color:#5A6C7D;">${operator?.business_name || ''}</p>
              <p style="font-size:12px;color:#5A6C7D;">${operator?.phone || ''}</p>
            </div>
            <div style="text-align:right;">
              <h1 style="font-size:26px;font-weight:800;letter-spacing:2px;color:#2C3E50;">${isInvoice ? 'INVOICE' : 'RECEIPT'}</h1>
              <p style="font-size:12px;color:#5A6C7D;">#${shortId(p.id)}</p>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
            <div>
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5A6C7D;margin-bottom:4px;">${isInvoice ? 'Bill To' : 'Received From'}</p>
              <p style="font-size:14px;font-weight:600;color:#2C3E50;">${p.parents?.full_name || ''}</p>
              <p style="font-size:13px;color:#5A6C7D;">${p.parents?.phone || ''}</p>
            </div>
            <div style="text-align:right;">
              <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#5A6C7D;">${isInvoice ? 'Due Date' : 'Date Paid'}</p>
              <p style="font-size:14px;font-weight:600;color:#2C3E50;">${isInvoice ? dueDate.toLocaleDateString('en-KE') : (p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-KE') : '—')}</p>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead><tr style="background:#F8F6F1;border-bottom:1px solid #EAE7DC;">
              <th style="padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;color:#5A6C7D;">Description</th>
              <th style="padding:10px 14px;text-align:right;font-size:11px;text-transform:uppercase;color:#5A6C7D;">Amount</th>
            </tr></thead>
            <tbody><tr style="border-bottom:1px solid #EAE7DC;">
              <td style="padding:14px;font-size:14px;">
                <p style="font-weight:600;">School Transport Fee</p>
                <p style="font-size:12px;color:#5A6C7D;">${monthLabel(p.invoice_month)}</p>
              </td>
              <td style="padding:14px;text-align:right;font-size:14px;font-weight:600;">${fmt(isInvoice ? p.amount : displayAmt)}</td>
            </tr></tbody>
            <tfoot><tr style="background:#F8F6F1;">
              <td style="padding:14px;font-size:15px;font-weight:700;">${isInvoice ? 'Total Due' : 'Total Received'}</td>
              <td style="padding:14px;text-align:right;font-size:15px;font-weight:700;">${fmt(isInvoice ? p.amount : displayAmt)}</td>
            </tr></tfoot>
          </table>
        </div>
      `;
    }).join('');

    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>ShuleRyde Bulk ${type}</title>
      <style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Helvetica Neue',Arial,sans-serif; color:#2C3E50; background:white; } @media print { .page-break { page-break-before:always; } }</style>
      </head><body>${docHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {modal === 'add' && <PaymentModal parents={parents} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSaved={(msg) => { setModal(null); load(); showToast(msg); }} />}
      {docModal?.type === 'invoice' && <InvoiceModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} />}
      {docModal?.type === 'receipt' && <ReceiptModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} />}
      {partialModal && <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onSaved={() => { setPartialModal(null); load(); }} />}

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Payments</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Track and manage parent payments</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <div className="relative group">
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Bulk Download</span>
              <span className="sm:hidden">Bulk</span>
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-cloud rounded-xl shadow-lg py-1 min-w-[160px] z-20 hidden group-hover:block">
              <button onClick={() => bulkDownload('invoices')} className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper">All Invoices</button>
              <button onClick={() => bulkDownload('receipts')} className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper">All Receipts</button>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModal('generate')}>
            <span className="hidden sm:inline">Generate Invoices</span>
            <span className="sm:hidden">Generate</span>
          </Button>
          <Button size="sm" onClick={() => setModal('add')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Collected</p>
          <p className="text-lg sm:text-2xl font-semibold text-green-600">KES {totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-lg sm:text-2xl font-semibold text-amber-600">KES {totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* School Analytics */}
      {analytics.filter(a => a.students > 0 || a.revenue > 0 || a.outstanding > 0).length > 0 && (
        <div className="mb-5 sm:mb-6">
          <h2 className="text-sm font-semibold text-ink mb-3">School Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.filter(a => a.students > 0 || a.revenue > 0 || a.outstanding > 0).map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-cloud p-4">
                <p className="font-semibold text-ink text-sm mb-3">{a.name}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate">Students</p>
                    <p className="font-semibold text-ink">{a.students}</p>
                  </div>
                  <div>
                    <p className="text-slate">Clients</p>
                    <p className="font-semibold text-ink">{a.clients}</p>
                  </div>
                  <div>
                    <p className="text-slate">Revenue</p>
                    <p className="font-semibold text-green-600">KES {parseFloat(a.revenue).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate">Outstanding</p>
                    <p className="font-semibold text-amber-600">KES {parseFloat(a.outstanding).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 mb-4 flex flex-col gap-3">
        {/* Status + school row */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID'].map((s) => (
            <button key={s} onClick={() => { setFilterStatus(s); resetPage(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-ink text-white' : 'bg-paper border border-cloud text-slate hover:bg-cloud/50'}`}>
              {s === 'ALL' ? 'All' : s === 'PARTIALLY_PAID' ? 'Partial' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          {schools.length > 0 && (
            <select value={filterSchool} onChange={(e) => { setFilterSchool(e.target.value); resetPage(); }}
              className="ml-auto px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">All Schools</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
        {/* Date range row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate">Invoice month:</span>
          <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); resetPage(); }}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-xs text-slate ml-2">Payment date:</span>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
            placeholder="From"
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-xs text-slate">—</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
            placeholder="To"
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500" />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-slate hover:text-ink underline">Clear filters</button>
          )}
        </div>
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
          <p className="text-slate">{hasActiveFilters ? 'No payments match these filters.' : 'No payments found.'}</p>
          {hasActiveFilters && <button onClick={clearFilters} className="mt-2 text-sm text-sage-600 underline">Clear filters</button>}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-3">
            {pagePayments.map((p) => {
              const installment = latestInstallment(p);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.parents?.full_name}</p>
                      <p className="text-xs text-slate">{p.parents?.phone}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                      {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-ink">KES {parseFloat(p.amount).toLocaleString()}</span>
                    <span className="text-slate text-xs">{p.invoice_month}</span>
                  </div>
                  {installment && (
                    <p className="text-xs text-blue-600 mb-3">
                      Latest installment: KES {parseFloat(installment.amount).toLocaleString()} · {new Date(installment.paid_at).toLocaleDateString('en-KE')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-cloud flex-wrap">
                    {(p.status === 'PENDING' || p.status === 'PARTIALLY_PAID') && (
                      <>
                        {p.status === 'PENDING' && (
                          <Button size="sm" variant="secondary" className="flex-1"
                            onClick={() => setDocModal({ type: 'invoice', payment: p })}>
                            Invoice
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => setPartialModal(p)}>
                          Record
                        </Button>
                        <Button size="sm" className="flex-1" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>
                          Mark Paid
                        </Button>
                      </>
                    )}
                    {(p.status === 'PAID' || p.status === 'PARTIALLY_PAID') && (
                      <Button size="sm" variant="secondary" className="flex-1"
                        onClick={() => setDocModal({ type: 'receipt', payment: p })}>
                        Receipt
                      </Button>
                    )}
                    <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Parent</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Month</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Amount</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Latest Installment</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-slate hidden lg:table-cell">Date Paid</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {pagePayments.map((p) => {
                  const installment = latestInstallment(p);
                  return (
                    <tr key={p.id} className="hover:bg-paper/50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{p.parents?.full_name}</p>
                        <p className="text-xs text-slate">{p.parents?.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-slate">{p.invoice_month}</td>
                      <td className="px-5 py-4 font-medium text-ink">KES {parseFloat(p.amount).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {installment ? (
                          <div>
                            <p className="font-medium text-ink">KES {parseFloat(installment.amount).toLocaleString()}</p>
                            <p className="text-xs text-slate">{new Date(installment.paid_at).toLocaleDateString('en-KE')}</p>
                          </div>
                        ) : (
                          <span className="text-slate">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                          {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate hidden lg:table-cell">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-KE') : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'PENDING' && (
                            <Button size="sm" variant="secondary" onClick={() => setDocModal({ type: 'invoice', payment: p })}>Invoice</Button>
                          )}
                          {(p.status === 'PENDING' || p.status === 'PARTIALLY_PAID') && (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setPartialModal(p)}>Record</Button>
                              <Button size="sm" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                            </>
                          )}
                          {(p.status === 'PAID' || p.status === 'PARTIALLY_PAID') && (
                            <Button size="sm" variant="secondary" onClick={() => setDocModal({ type: 'receipt', payment: p })}>Receipt</Button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-slate">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-cloud text-sm text-slate disabled:opacity-40 hover:bg-paper transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-ink font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-cloud text-sm text-slate disabled:opacity-40 hover:bg-paper transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Payments;
