import { useEffect, useRef, useState } from 'react';
import { financeAPI, paymentsAPI, parentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
};


const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtPayment = (n) => `KES ${parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const shortId = (id) => id?.slice(0, 8).toUpperCase();
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

// ── Partial Payment Modal ──────────────────────────────────────────
const PartialPaymentModal = ({ payment, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');

  const outstanding = parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }
    if (paymentAmount > outstanding) {
      setError(`Payment cannot exceed outstanding amount (KES ${outstanding.toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await paymentsAPI.recordPartialPayment(payment.id, { amount_paid: paymentAmount, payment_method: 'CASH' });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-1">Record Partial Payment</h2>
        <p className="text-slate text-sm mb-4">{payment.parents?.full_name}</p>
        
        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-blue-900"><strong>Invoice Amount:</strong> {fmtPayment(payment.amount)}</p>
          <p className="text-blue-900"><strong>Already Paid:</strong> {fmtPayment(payment.amount_collected || 0)}</p>
          <p className="text-blue-900"><strong>Outstanding:</strong> {fmtPayment(outstanding)}</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input 
            id="amount" 
            type="number" 
            label="Amount to Pay (KES)" 
            placeholder={outstanding.toFixed(2)}
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            max={outstanding}
            step="0.01"
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Record Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Receipt Modal ────────────────────────────────────────────
const ReceiptModal = ({ payment, onClose }) => {
  const { operator } = useAuth();
  const ref = useRef();
  const print = () => {
    const content = ref.current?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt #${shortId(payment.id)}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#2C3E50;padding:40px}.doc{max-width:640px;margin:0 auto}@media print{body{padding:20px}}</style>
    </head><body><div class="doc">${content}</div></body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink">Receipt</h2>
          <div className="flex gap-2">
            <Button onClick={print} size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="p-6 sm:p-8 font-sans text-ink" ref={ref}>
          <div className="flex justify-between items-start mb-8 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              {payment.payment_date && (
                <p className="text-xs text-slate mt-0.5">{new Date(payment.payment_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Received From</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Payment Method</p>
              <p className="font-semibold text-ink">{payment.payment_method || 'CASH'}</p>
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
                <td className="px-4 py-4 text-right font-medium">{fmtPayment(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-green-50">
                <td className="px-4 py-3 font-bold text-green-900">Amount Paid</td>
                <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmtPayment(payment.amount)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="text-center pt-4 border-t border-cloud">
            <p className="text-sm text-slate italic">Thank you for your payment!</p>
            {operator?.mpesa_paybill && <p className="text-xs text-slate mt-1">Paybill: {operator.mpesa_paybill}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Payment Details Modal ────────────────────────────────────
const PaymentDetailsModal = ({ payment, onClose }) => {
  const collected = parseFloat(payment.amount_collected || 0);
  const total = parseFloat(payment.amount);
  const outstanding = total - collected;
  const progress = total > 0 ? (collected / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">Payment Details</h2>
          <button onClick={onClose} className="text-slate hover:text-ink p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          <div className="bg-paper rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate mb-1">Parent</p>
            <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
            <p className="text-sm text-slate">{payment.parents?.phone}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-paper rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate mb-1">Month</p>
              <p className="font-semibold text-ink text-sm">{monthLabel(payment.invoice_month)}</p>
            </div>
            <div className="bg-paper rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate mb-1">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status]}`}>
                {payment.status === 'PARTIALLY_PAID' ? 'Partial' : payment.status}
              </span>
            </div>
          </div>
          <div className="bg-paper rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate">Invoice Amount</span>
              <span className="font-semibold text-ink">{fmtPayment(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate">Amount Collected</span>
              <span className="font-semibold text-green-600">{fmtPayment(collected)}</span>
            </div>
            {payment.status !== 'PAID' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate">Outstanding</span>
                <span className="font-semibold text-amber-600">{fmtPayment(outstanding)}</span>
              </div>
            )}
          </div>
          {payment.status === 'PARTIALLY_PAID' && (
            <div className="px-1">
              <div className="flex justify-between text-xs text-slate mb-1.5">
                <span>Collection Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-cloud rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          )}
          {(payment.payment_method || payment.payment_date) && (
            <div className="grid grid-cols-2 gap-3">
              {payment.payment_method && (
                <div className="bg-paper rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate mb-1">Method</p>
                  <p className="font-semibold text-ink text-sm">{payment.payment_method}</p>
                </div>
              )}
              {payment.payment_date && (
                <div className="bg-paper rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wide text-slate mb-1">Date Paid</p>
                  <p className="font-semibold text-ink text-sm">{new Date(payment.payment_date).toLocaleDateString('en-KE')}</p>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-slate text-center pt-2">Ref: {shortId(payment.id)}</p>
        </div>
        <div className="mt-5">
          <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

// ── P&L Statement Tab ──────────────────────────────────────────
const ProfitLossTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    financeAPI.getProfitAndLoss(year)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <select 
          value={year} 
          onChange={(e) => { setYear(e.target.value); setLoading(true); }}
          className="px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
        >
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden mb-6">
        <div className="px-4 sm:px-5 py-4 border-b border-cloud bg-paper">
          <h2 className="font-semibold text-ink">Profit & Loss Statement</h2>
        </div>
        
        <div className="p-5">
          <table className="w-full">
            <tbody className="divide-y divide-cloud text-sm">
              <tr>
                <td className="py-3 font-medium text-ink">Revenue</td>
                <td className="py-3 text-right text-green-600 font-semibold">{fmt(data?.totalRevenue || 0)}</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-ink">Collection</td>
                <td className="py-3 text-right text-green-600">{fmt(data?.totalCollected || 0)}</td>
              </tr>
              <tr className="bg-paper">
                <td className="py-3 font-semibold text-ink">Gross Expenses (est. 25%)</td>
                <td className="py-3 text-right text-red-600 font-semibold">{fmt(data?.estimatedExpenses || 0)}</td>
              </tr>
              <tr className="bg-paper">
                <td className="py-3 font-semibold text-ink">Gross Profit</td>
                <td className="py-3 text-right text-ink font-semibold">{fmt(data?.grossProfit || 0)}</td>
              </tr>
              <tr>
                <td className="py-3 text-slate">Operating Expenses</td>
                <td className="py-3 text-right text-slate">—</td>
              </tr>
              <tr className="bg-green-50 border-t-2 border-green-200">
                <td className="py-3 font-bold text-green-900">Net Profit</td>
                <td className="py-3 text-right font-bold text-green-700 text-lg">{fmt(data?.netProfit || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-cloud p-4">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Profit Margin</p>
          <p className="text-2xl font-semibold text-ink">{data?.profitMargin || 0}%</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-4">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Collection Rate</p>
          <p className="text-2xl font-semibold text-green-600">{data?.collectionRate || 0}%</p>
        </div>
      </div>

      {data?.monthly?.length > 0 && (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-cloud bg-paper">
            <h2 className="font-semibold text-ink">Monthly Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cloud bg-paper">
                  <th className="px-4 py-3 text-left font-medium text-slate">Month</th>
                  <th className="px-4 py-3 text-right font-medium text-slate">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium text-slate">Collected</th>
                  <th className="px-4 py-3 text-right font-medium text-slate">Expenses (25%)</th>
                  <th className="px-4 py-3 text-right font-medium text-slate">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {data.monthly.map((m) => {
                  const expenses = m.revenue * 0.25;
                  const profit = m.revenue - expenses;
                  return (
                    <tr key={m.month} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{monthLabel(m.month)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmt(m.revenue)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(m.collected)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{fmt(expenses)}</td>
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
const BalanceSheetTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeAPI.getFinancialSummary()
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud">
            <h2 className="font-semibold text-ink">Assets</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud">
              <p className="text-slate">Cash Collected</p>
              <p className="font-semibold text-ink">{fmt(data?.totalCollected || 0)}</p>
            </div>
            <div className="flex items-center justify-between py-4 bg-green-50 rounded px-3 mt-3">
              <p className="font-bold text-green-900">Total Assets</p>
              <p className="font-bold text-green-700 text-lg">{fmt(data?.assets || 0)}</p>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud">
            <h2 className="font-semibold text-ink">Liabilities & Equity</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud">
              <p className="text-slate">Accounts Payable</p>
              <p className="font-semibold text-red-600">{fmt(data?.liabilities || 0)}</p>
            </div>
            <div className="flex items-center justify-between py-4 border-b border-cloud">
              <p className="text-slate">Owner's Equity</p>
              <p className="font-semibold text-ink">{fmt(data?.equity || 0)}</p>
            </div>
            <div className="flex items-center justify-between py-4 bg-blue-50 rounded px-3 mt-3">
              <p className="font-bold text-blue-900">Total Liabilities & Equity</p>
              <p className="font-bold text-blue-700 text-lg">{fmt((data?.liabilities || 0) + (data?.equity || 0))}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate">Total Invoiced</p>
            <p className="font-semibold text-ink">{fmt(data?.totalInvoiced || 0)}</p>
          </div>
          <div>
            <p className="text-slate">Total Collected</p>
            <p className="font-semibold text-green-600">{fmt(data?.totalCollected || 0)}</p>
          </div>
          <div>
            <p className="text-slate">Outstanding</p>
            <p className="font-semibold text-amber-600">{fmt(data?.totalOutstanding || 0)}</p>
          </div>
          <div>
            <p className="text-slate">Collection Rate</p>
            <p className="font-semibold text-ink">{data?.collectionRate || 0}%</p>
          </div>
        </div>
      </div>

      {/* Invoice Status */}
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Invoice Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data?.invoices?.paid || 0}</p>
            <p className="text-slate text-xs mt-1">Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data?.invoices?.partiallypaid || 0}</p>
            <p className="text-slate text-xs mt-1">Partially Paid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{data?.invoices?.pending || 0}</p>
            <p className="text-slate text-xs mt-1">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-ink">{data?.invoices?.total || 0}</p>
            <p className="text-slate text-xs mt-1">Total</p>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Main Finance Component with Tabs ─────────────────────────
const Finance = () => {
  const { operator } = useAuth();
  const [payments, setPayments] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');
  const [modal, setModal] = useState(null);
  const [docModal, setDocModal] = useState(null);
  const [partialModal, setPartialModal] = useState(null);
  const [marking, setMarking] = useState(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterName, setFilterName] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);

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

  const handleExport = () => {
    const rows = [
      ['Parent', 'Phone', 'Month', 'Amount (KES)', 'Collected (KES)', 'Outstanding (KES)', 'Status', 'Method', 'Date Paid'],
      ...filtered.map((p) => [
        p.parents?.full_name || '',
        p.parents?.phone || '',
        p.invoice_month,
        parseFloat(p.amount).toFixed(2),
        parseFloat(p.amount_collected || 0).toFixed(2),
        (parseFloat(p.amount) - parseFloat(p.amount_collected || 0)).toFixed(2),
        p.status,
        p.payment_method || '',
        p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-KE') : '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${filterMonth || currentMonth()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filtered = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterMonth && p.invoice_month !== filterMonth) return false;
    if (filterName && !p.parents?.full_name?.toLowerCase().includes(filterName.toLowerCase())) return false;
    return true;
  });

  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalPartiallyPaid = payments.filter((p) => p.status === 'PARTIALLY_PAID').reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
  const totalCollected = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0);

  const PaymentModal = ({ onClose, onSaved }) => {
    const [loadingModal, setLoadingModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ parent_id: '', amount: '', invoice_month: currentMonth() });

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.parent_id || !form.amount) { setError('Parent and amount are required'); return; }
      setLoadingModal(true); setError('');
      try {
        await paymentsAPI.create(form);
        onSaved();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to create payment');
      } finally { setLoadingModal(false); }
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
              <Button type="submit" loading={loadingModal} className="flex-1">Add Payment</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const GenerateModal = ({ onClose, onSaved }) => {
    const [loadingModal, setLoadingModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ month: currentMonth(), amount: '' });

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.amount) { setError('Amount is required'); return; }
      setLoadingModal(true); setError('');
      try {
        const { data } = await paymentsAPI.generateMonthly(form.month, { amount: form.amount });
        onSaved(`Generated ${data.created} invoice${data.created !== 1 ? 's' : ''} for ${form.month}`);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to generate invoices');
      } finally { setLoadingModal(false); }
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
              <Button type="submit" loading={loadingModal} className="flex-1">Generate</Button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const InvoiceModal = ({ payment, onClose }) => {
    const ref = useRef();
    const usePrint = (ref) => () => {
      const content = ref.current?.innerHTML;
      if (!content) return;
      const win = window.open('', '_blank', 'width=800,height=600');
      win.document.write(`
        <!DOCTYPE html><html><head>
        <title>ShuleRyde Invoice</title>
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
          @media print { body { padding: 20px; } }
        </style>
        </head><body><div class="doc">${content}</div></body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 400);
    };
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
                  <td className="px-4 py-4 text-right font-medium">{fmtPayment(payment.amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-paper">
                  <td className="px-4 py-3 font-bold text-ink">Total Due</td>
                  <td className="px-4 py-3 text-right font-bold text-ink text-base">{fmtPayment(payment.amount)}</td>
                </tr>
              </tfoot>
            </table>
            {payment.status === 'PARTIALLY_PAID' && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Partial Payment Received</p>
                <p className="text-sm text-blue-800">Paid: <strong>{fmtPayment(payment.amount_collected)}</strong></p>
                <p className="text-sm text-blue-800">Outstanding: <strong>{fmtPayment(parseFloat(payment.amount) - parseFloat(payment.amount_collected))}</strong></p>
              </div>
            )}
            {operator?.mpesa_paybill && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Pay via M-Pesa</p>
                <p className="text-sm text-green-800">Paybill / Till: <strong>{operator.mpesa_paybill}</strong></p>
                <p className="text-sm text-green-800">Account: <strong>{shortId(payment.id)}</strong></p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PaymentsTab = () => {
    return (
      <>
        {modal === 'add' && <PaymentModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
        {docModal && <InvoiceModal payment={docModal} onClose={() => setDocModal(null)} />}
        {partialModal && <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onSaved={() => { setPartialModal(null); load(); }} />}
        {viewModal && <PaymentDetailsModal payment={viewModal} onClose={() => setViewModal(null)} />}
        {receiptModal && <ReceiptModal payment={receiptModal} onClose={() => setReceiptModal(null)} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
          <div>
            <p className="text-slate text-xs sm:text-sm">Track and manage parent payments</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button size="sm" onClick={() => setModal('add')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
            <p className="text-xs text-slate uppercase tracking-wide mb-1">Collected</p>
            <p className="text-lg sm:text-2xl font-semibold text-green-600">KES {totalCollected.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
            <p className="text-xs text-slate uppercase tracking-wide mb-1">Partially Collected</p>
            <p className="text-lg sm:text-2xl font-semibold text-blue-600">KES {totalPartiallyPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
            <p className="text-xs text-slate uppercase tracking-wide mb-1">Pending</p>
            <p className="text-lg sm:text-2xl font-semibold text-amber-600">KES {totalPending.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-ink text-white' : 'bg-white border border-cloud text-slate hover:bg-paper'}`}>
              {s === 'ALL' ? 'All' : s === 'PARTIALLY_PAID' ? 'Partially Paid' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <input
              type="text"
              placeholder="Search by name…"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 w-44"
            />
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
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
            <p className="text-slate">No payments found.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{p.parents?.full_name}</p>
                      <p className="text-xs text-slate">{p.parents?.phone}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[p.status]}`}>
                      {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="font-semibold text-ink">KES {parseFloat(p.amount).toLocaleString()}</span>
                    <span className="text-slate text-xs">{p.invoice_month}</span>
                  </div>
                  {p.status === 'PARTIALLY_PAID' && (
                    <div className="bg-blue-50 rounded px-2 py-2 mb-3 text-xs text-blue-900">
                      Paid: KES {parseFloat(p.amount_collected).toLocaleString()} / Outstanding: KES {(parseFloat(p.amount) - parseFloat(p.amount_collected)).toLocaleString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-cloud flex-wrap">
                    <Button size="sm" variant="secondary" className="flex-1 min-w-[60px]"
                      onClick={() => setViewModal(p)}>
                      View
                    </Button>
                    {p.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]"
                          onClick={() => setDocModal(p)}>
                          Invoice
                        </Button>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[90px]"
                          onClick={() => setPartialModal(p)}>
                          Partial Pay
                        </Button>
                        <Button size="sm" className="flex-1" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>
                          Mark Paid
                        </Button>
                      </>
                    )}
                    {p.status === 'PARTIALLY_PAID' && (
                      <>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]"
                          onClick={() => setDocModal(p)}>
                          Invoice
                        </Button>
                        <Button size="sm" className="flex-1 min-w-[90px]"
                          onClick={() => setPartialModal(p)}>
                          Add Payment
                        </Button>
                      </>
                    )}
                    {p.status === 'PAID' && (
                      <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]"
                        onClick={() => setReceiptModal(p)}>
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
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cloud bg-paper">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wide">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wide">Month</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-ink text-sm">{p.parents?.full_name}</p>
                        <p className="text-xs text-slate">{p.parents?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate">{p.invoice_month}</td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="font-semibold text-ink text-sm">KES {parseFloat(p.amount).toLocaleString()}</p>
                        {p.status === 'PARTIALLY_PAID' && (
                          <p className="text-xs text-blue-600">Collected: KES {parseFloat(p.amount_collected || 0).toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                          {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setViewModal(p)}>View</Button>
                          {p.status !== 'PAID' && (
                            <Button size="sm" variant="secondary" onClick={() => setDocModal(p)}>Invoice</Button>
                          )}
                          {p.status === 'PAID' && (
                            <Button size="sm" variant="secondary" onClick={() => setReceiptModal(p)}>Receipt</Button>
                          )}
                          {(p.status === 'PENDING' || p.status === 'PARTIALLY_PAID') && (
                            <Button size="sm" variant="secondary" onClick={() => setPartialModal(p)}>
                              {p.status === 'PARTIALLY_PAID' ? 'Add Payment' : 'Partial Pay'}
                            </Button>
                          )}
                          {p.status === 'PENDING' && (
                            <Button size="sm" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors p-1.5">
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
          </>
        )}
      </>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Finance</h1>
        <p className="text-slate text-xs sm:text-sm mt-0.5">Manage payments, revenue & financial reporting</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-cloud overflow-x-auto">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-sage-500 text-ink'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setActiveTab('profit-loss')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profit-loss'
              ? 'border-sage-500 text-ink'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          P&L Statement
        </button>
        <button
          onClick={() => setActiveTab('balance-sheet')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'balance-sheet'
              ? 'border-sage-500 text-ink'
              : 'border-transparent text-slate hover:text-ink'
          }`}
        >
          Balance Sheet
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab />}
        {activeTab === 'balance-sheet' && <BalanceSheetTab />}
      </div>
    </div>
  );
};

export default Finance;