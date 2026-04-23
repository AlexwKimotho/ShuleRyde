import { useEffect, useState } from 'react';
import { financeAPI, paymentsAPI, parentsAPI, expensesAPI, vehiclesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
};

const EXPENSE_CATEGORIES = ['FUEL', 'SERVICE', 'FINE', 'SALARY', 'OTHER'];
const EXPENSE_COLORS = {
  FUEL: 'bg-orange-100 text-orange-700',
  SERVICE: 'bg-blue-100 text-blue-700',
  FINE: 'bg-red-100 text-red-700',
  SALARY: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-cloud text-slate',
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const fmtPayment = (n) => `KES ${parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const shortId = (id) => id?.slice(0, 8).toUpperCase();
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

// ── Shared print helper ──────────────────────────────────────
const printDocument = (content, title) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #2C3E50; background: #fff; padding: 48px; font-size: 13px; }
      .doc { max-width: 680px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 3px solid #6B9080; }
      .brand-name { font-size: 20px; font-weight: 800; color: #6B9080; letter-spacing: -0.5px; }
      .brand-sub { font-size: 11px; color: #5A6C7D; margin-top: 3px; }
      .doc-type { text-align: right; }
      .doc-type h1 { font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #2C3E50; }
      .doc-type p { font-size: 11px; color: #5A6C7D; margin-top: 4px; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
      .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #5A6C7D; margin-bottom: 5px; font-weight: 600; }
      .meta-value { font-size: 14px; font-weight: 600; color: #2C3E50; }
      .meta-sub { font-size: 11px; color: #5A6C7D; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      thead th { background: #F8F6F1; padding: 10px 14px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #5A6C7D; border-bottom: 2px solid #EAE7DC; font-weight: 600; }
      thead th:last-child { text-align: right; }
      tbody td { padding: 14px; font-size: 13px; border-bottom: 1px solid #EAE7DC; color: #2C3E50; }
      tbody td:last-child { text-align: right; font-weight: 600; }
      .total-row td { padding: 12px 14px; font-weight: 700; font-size: 14px; background: #F8F6F1; }
      .highlight-row td { padding: 14px; font-weight: 800; font-size: 16px; background: #EDF7F1; color: #1A5C3A; }
      .info-box { border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
      .info-box.blue { background: #EFF6FF; border-left: 4px solid #3B82F6; }
      .info-box.green { background: #F0FDF4; border-left: 4px solid #22C55E; }
      .info-box.amber { background: #FFFBEB; border-left: 4px solid #F59E0B; }
      .info-box-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; color: #5A6C7D; margin-bottom: 6px; }
      .info-box p { font-size: 13px; color: #2C3E50; line-height: 1.6; }
      .footer { text-align: center; padding-top: 24px; border-top: 1px solid #EAE7DC; margin-top: 8px; }
      .footer p { font-size: 11px; color: #5A6C7D; font-style: italic; }
      .status-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .status-paid { background: #DCFCE7; color: #166534; }
      .status-partial { background: #DBEAFE; color: #1E40AF; }
      .status-pending { background: #FEF3C7; color: #92400E; }
      @media print { body { padding: 24px; } }
    </style>
  </head><body><div class="doc">${content}</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// ── Partial Payment Modal ──────────────────────────────────────────
const PartialPaymentModal = ({ payment, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const outstanding = parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) { setError('Payment amount must be greater than 0'); return; }
    if (paymentAmount > outstanding) { setError(`Payment cannot exceed outstanding amount (KES ${outstanding.toFixed(2)})`); return; }

    setLoading(true); setError('');
    try {
      await paymentsAPI.recordPartialPayment(payment.id, { amount_paid: paymentAmount, payment_method: method, notes });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-1">Record Partial Payment</h2>
        <p className="text-slate text-sm mb-4">{payment.parents?.full_name}{payment.children?.full_name && ` · ${payment.children.full_name}`}</p>
        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
          <p className="text-blue-900"><strong>Invoice:</strong> {fmtPayment(payment.amount)}</p>
          <p className="text-blue-900"><strong>Paid so far:</strong> {fmtPayment(payment.amount_collected || 0)}</p>
          <p className="text-blue-900 font-semibold"><strong>Outstanding:</strong> {fmtPayment(outstanding)}</p>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="amount" type="number" label="Amount to Pay (KES)" placeholder={outstanding.toFixed(2)}
            value={amount} onChange={(e) => setAmount(e.target.value)} max={outstanding} step="0.01" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              {['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <Input id="notes" label="Notes (optional)" placeholder="e.g. Term 1 instalment" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Record Payment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Shared doc header/footer builders ─────────────────────────────
const buildDocHeader = (operatorInfo, docType, refId, dateStr) => `
  <div class="header">
    <div>
      <div class="brand-name">ShuleRyde</div>
      ${operatorInfo?.business_name ? `<div class="brand-sub">${operatorInfo.business_name}</div>` : ''}
      ${operatorInfo?.phone ? `<div class="brand-sub">${operatorInfo.phone}</div>` : ''}
    </div>
    <div class="doc-type">
      <h1>${docType}</h1>
      <p>#${refId}</p>
      ${dateStr ? `<p>${dateStr}</p>` : ''}
    </div>
  </div>`;

const buildDocFooter = (mpesaPaybill) => `
  <div class="footer">
    <p>Thank you for your payment!</p>
    ${mpesaPaybill ? `<p style="margin-top:4px">M-Pesa Paybill / Till: ${mpesaPaybill}</p>` : ''}
  </div>`;

// ── Transaction Receipt Modal ──────────────────────────────────────
const TransactionReceiptModal = ({ transaction, payment, onClose }) => {
  const { operator } = useAuth();

  const print = () => {
    const dateStr = new Date(transaction.paid_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `
      ${buildDocHeader(operator, 'RECEIPT', shortId(transaction.id), dateStr)}
      <div class="meta-grid">
        <div>
          <div class="meta-label">Received From</div>
          <div class="meta-value">${payment.parents?.full_name || ''}</div>
          ${payment.parents?.phone ? `<div class="meta-sub">${payment.parents.phone}</div>` : ''}
          ${payment.children?.full_name ? `<div class="meta-sub">Student: ${payment.children.full_name}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">${transaction.payment_method}</div>
          ${transaction.notes ? `<div class="meta-sub">${transaction.notes}</div>` : ''}
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <strong>School Transport Fee — ${monthLabel(payment.invoice_month)}</strong>
              ${payment.children?.full_name ? `<div style="font-size:11px;color:#5A6C7D;margin-top:3px">Student: ${payment.children.full_name}</div>` : ''}
              ${transaction.notes ? `<div style="font-size:11px;color:#5A6C7D;margin-top:3px">${transaction.notes}</div>` : ''}
            </td>
            <td>${fmtPayment(transaction.amount)}</td>
          </tr>
        </tbody>
        <tfoot><tr class="highlight-row"><td>Amount Paid</td><td>${fmtPayment(transaction.amount)}</td></tr></tfoot>
      </table>
      ${buildDocFooter(operator?.mpesa_paybill)}`;
    printDocument(html, `Receipt #${shortId(transaction.id)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink">Payment Receipt</h2>
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
        <div className="p-6 sm:p-8 font-sans text-ink">
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(transaction.id)}</p>
              <p className="text-xs text-slate">{new Date(transaction.paid_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Received From</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
              {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Method</p>
              <p className="font-semibold text-ink">{transaction.payment_method}</p>
              {transaction.notes && <p className="text-xs text-slate">{transaction.notes}</p>}
            </div>
          </div>
          <table className="w-full mb-6 text-sm border-collapse">
            <thead><tr className="bg-paper border-y border-cloud">
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
              <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-cloud">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink">School Transport Fee</p>
                  <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                  {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmtPayment(transaction.amount)}</td>
              </tr>
            </tbody>
            <tfoot><tr className="bg-green-50">
              <td className="px-4 py-3 font-bold text-green-900">Amount Paid</td>
              <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmtPayment(transaction.amount)}</td>
            </tr></tfoot>
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

// ── Receipt Modal (full payment) ─────────────────────────────────────
const ReceiptModal = ({ payment, onClose }) => {
  const { operator } = useAuth();

  const print = () => {
    const dateStr = payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const html = `
      ${buildDocHeader(operator, 'RECEIPT', shortId(payment.id), dateStr)}
      <div class="meta-grid">
        <div>
          <div class="meta-label">Received From</div>
          <div class="meta-value">${payment.parents?.full_name || ''}</div>
          ${payment.parents?.phone ? `<div class="meta-sub">${payment.parents.phone}</div>` : ''}
          ${payment.children?.full_name ? `<div class="meta-sub">Student: ${payment.children.full_name}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">${payment.payment_method || 'CASH'}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr>
            <td>
              <strong>School Transport Fee</strong>
              <div style="font-size:11px;color:#5A6C7D;margin-top:3px">${monthLabel(payment.invoice_month)}</div>
              ${payment.children?.full_name ? `<div style="font-size:11px;color:#5A6C7D;margin-top:3px">Student: ${payment.children.full_name}</div>` : ''}
            </td>
            <td>${fmtPayment(payment.amount)}</td>
          </tr>
        </tbody>
        <tfoot><tr class="highlight-row"><td>Amount Paid</td><td>${fmtPayment(payment.amount)}</td></tr></tfoot>
      </table>
      ${buildDocFooter(operator?.mpesa_paybill)}`;
    printDocument(html, `Receipt #${shortId(payment.id)}`);
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
        <div className="p-6 sm:p-8 font-sans text-ink">
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-sage-500">
            <div>
              <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              {payment.payment_date && <p className="text-xs text-slate mt-0.5">{new Date(payment.payment_date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Received From</p>
              <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
              <p className="text-sm text-slate">{payment.parents?.phone}</p>
              {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate mb-1">Payment Method</p>
              <p className="font-semibold text-ink">{payment.payment_method || 'CASH'}</p>
            </div>
          </div>
          <table className="w-full mb-6 text-sm border-collapse">
            <thead><tr className="bg-paper border-y border-cloud">
              <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
              <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-cloud">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink">School Transport Fee</p>
                  <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                  {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmtPayment(payment.amount)}</td>
              </tr>
            </tbody>
            <tfoot><tr className="bg-green-50">
              <td className="px-4 py-3 font-bold text-green-900">Amount Paid</td>
              <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmtPayment(payment.amount)}</td>
            </tr></tfoot>
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

// ── Payment Details Modal (with transaction history) ────────────
const PaymentDetailsModal = ({ payment, onClose, onTxnReceipt }) => {
  const collected = parseFloat(payment.amount_collected || 0);
  const total = parseFloat(payment.amount);
  const outstanding = total - collected;
  const progress = total > 0 ? (collected / total) * 100 : 0;
  const transactions = payment.payment_transactions || [];

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
            {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
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
                <span>Collection Progress</span><span>{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-cloud rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Payment Transactions History */}
          {transactions.length > 0 && (
            <div className="bg-paper rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate mb-3">Payment History ({transactions.length})</p>
              <div className="space-y-2">
                {transactions
                  .slice()
                  .sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at))
                  .map((txn, i) => (
                    <div key={txn.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-cloud">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{fmtPayment(txn.amount)}</p>
                        <p className="text-xs text-slate mt-0.5">
                          {txn.payment_method} · {new Date(txn.paid_at).toLocaleDateString('en-KE')}
                          {txn.notes && <span> · {txn.notes}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => onTxnReceipt(txn)}
                        className="text-xs text-sage-600 font-medium hover:text-sage-700 ml-2 flex-shrink-0"
                      >
                        Receipt
                      </button>
                    </div>
                  ))}
              </div>
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
    setLoading(true);
    financeAPI.getProfitAndLoss(year)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;

  return (
    <>
      <div className="flex justify-end mb-6">
        <select value={year} onChange={(e) => setYear(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
          {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden mb-6">
        <div className="px-4 sm:px-5 py-4 border-b border-cloud bg-paper">
          <h2 className="font-semibold text-ink">Profit & Loss Statement</h2>
        </div>
        <div className="p-5">
          <table className="w-full">
            <tbody className="divide-y divide-cloud text-sm">
              <tr><td className="py-3 font-medium text-ink">Total Revenue (Invoiced)</td><td className="py-3 text-right text-green-600 font-semibold">{fmt(data?.totalRevenue || 0)}</td></tr>
              <tr><td className="py-3 font-medium text-ink">Amount Collected</td><td className="py-3 text-right text-green-600">{fmt(data?.totalCollected || 0)}</td></tr>
              <tr className="bg-paper"><td className="py-3 font-semibold text-ink">Total Expenses</td><td className="py-3 text-right text-red-600 font-semibold">{fmt(data?.totalExpenses || 0)}</td></tr>
              <tr className="bg-green-50 border-t-2 border-green-200"><td className="py-3 font-bold text-green-900">Net Profit</td><td className="py-3 text-right font-bold text-green-700 text-lg">{fmt(data?.netProfit || 0)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-cloud p-4"><p className="text-xs text-slate uppercase tracking-wide mb-1">Profit Margin</p><p className="text-2xl font-semibold text-ink">{data?.profitMargin || 0}%</p></div>
        <div className="bg-white rounded-xl border border-cloud p-4"><p className="text-xs text-slate uppercase tracking-wide mb-1">Collection Rate</p><p className="text-2xl font-semibold text-green-600">{data?.collectionRate || 0}%</p></div>
      </div>
      {data?.monthly?.length > 0 && (
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
                  const profit = m.collected - (m.expenses || 0);
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
const BalanceSheetTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    setLoading(true);
    financeAPI.getFinancialSummary(filterMonth || undefined)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterMonth]);

  if (loading) return <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;

  return (
    <>
      <div className="flex justify-end mb-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate">Filter by month:</span>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          {filterMonth && (
            <button onClick={() => setFilterMonth('')}
              className="text-xs text-slate hover:text-error px-2 py-1.5 rounded-lg border border-cloud hover:border-red-200 transition-colors">
              All time
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud"><h2 className="font-semibold text-ink">Assets</h2></div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Cash Collected</p><p className="font-semibold text-ink">{fmt(data?.totalCollected || 0)}</p></div>
            <div className="flex items-center justify-between py-4 bg-green-50 rounded px-3 mt-3"><p className="font-bold text-green-900">Total Assets</p><p className="font-bold text-green-700 text-lg">{fmt(data?.assets || 0)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-paper border-b border-cloud"><h2 className="font-semibold text-ink">Liabilities & Equity</h2></div>
          <div className="p-5">
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Accounts Payable (Outstanding)</p><p className="font-semibold text-red-600">{fmt(data?.liabilities || 0)}</p></div>
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate">Total Expenses</p><p className="font-semibold text-red-600">{fmt(data?.totalExpenses || 0)}</p></div>
            <div className="flex items-center justify-between py-4 border-b border-cloud"><p className="text-slate font-medium">Business Value</p><p className="font-semibold text-ink">{fmt(data?.businessValue || 0)}</p></div>
            <div className="flex items-center justify-between py-4 bg-blue-50 rounded px-3 mt-3"><p className="font-bold text-blue-900">Total L & E</p><p className="font-bold text-blue-700 text-lg">{fmt((data?.liabilities || 0) + (data?.businessValue || 0))}</p></div>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate">Total Invoiced</p><p className="font-semibold text-ink">{fmt(data?.totalInvoiced || 0)}</p></div>
          <div><p className="text-slate">Total Collected</p><p className="font-semibold text-green-600">{fmt(data?.totalCollected || 0)}</p></div>
          <div><p className="text-slate">Outstanding</p><p className="font-semibold text-amber-600">{fmt(data?.totalOutstanding || 0)}</p></div>
          <div><p className="text-slate">Collection Rate</p><p className="font-semibold text-ink">{data?.collectionRate || 0}%</p></div>
        </div>
      </div>
      <div className="mt-6 bg-white rounded-xl border border-cloud shadow-sm p-5">
        <h3 className="font-semibold text-ink mb-4">Invoice Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center"><p className="text-2xl font-bold text-green-600">{data?.invoices?.paid || 0}</p><p className="text-slate text-xs mt-1">Paid</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-600">{data?.invoices?.partiallypaid || 0}</p><p className="text-slate text-xs mt-1">Partially Paid</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-amber-600">{data?.invoices?.pending || 0}</p><p className="text-slate text-xs mt-1">Pending</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-ink">{data?.invoices?.total || 0}</p><p className="text-slate text-xs mt-1">Total</p></div>
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
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const [{ data: ed }, { data: vd }] = await Promise.all([
        expensesAPI.getAll(params),
        vehiclesAPI.getAll(),
      ]);
      setExpenses(ed.expenses);
      setVehicles(vd.vehicles);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterFrom, filterTo]);

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate font-medium uppercase tracking-wide">Date:</span>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-slate text-sm">to</span>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          {(filterFrom || filterTo) && (
            <button onClick={() => { setFilterFrom(''); setFilterTo(''); }}
              className="text-xs text-slate hover:text-error px-2 py-1.5 rounded-lg border border-cloud hover:border-red-200 transition-colors">
              Clear
            </button>
          )}
        </div>
        <Button size="sm" onClick={() => setModal('new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      {/* Category summary */}
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
        <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
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

          {/* Mobile */}
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
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [viewModal, setViewModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [txnReceiptModal, setTxnReceiptModal] = useState(null);

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
      ['Parent', 'Student', 'Phone', 'Month', 'Amount (KES)', 'Collected (KES)', 'Outstanding (KES)', 'Status', 'Method', 'Date Paid'],
      ...filtered.map((p) => [
        p.parents?.full_name || '',
        p.children?.full_name || '',
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
    if (filterFromDate) {
      const d = new Date(p.created_at);
      if (d < new Date(filterFromDate)) return false;
    }
    if (filterToDate) {
      const d = new Date(p.created_at);
      if (d > new Date(filterToDate + 'T23:59:59')) return false;
    }
    return true;
  });

  const totalRevenue = filtered.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalPending = filtered.filter((p) => p.status === 'PENDING').reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalPartiallyPaid = filtered.filter((p) => p.status === 'PARTIALLY_PAID').reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
  const totalCollected = filtered.filter((p) => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0);

  const PaymentModal = ({ onClose, onSaved }) => {
    const [loadingModal, setLoadingModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ parent_id: '', child_id: '', amount: '', invoice_month: currentMonth() });

    const selectedParent = parents.find((p) => p.id === form.parent_id);
    const children = selectedParent?.children || [];

    const handleChange = (e) => {
      const { name, value } = e.target;
      setForm((p) => ({ ...p, [name]: value, ...(name === 'parent_id' ? { child_id: '' } : {}) }));
    };

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
            {children.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink">Student (optional)</label>
                <select name="child_id" value={form.child_id} onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
                  <option value="">— All students / not specified —</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.full_name}{c.admission_number ? ` (${c.admission_number})` : ''}</option>)}
                </select>
              </div>
            )}
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
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toLocaleDateString('en-KE');

    const print = () => {
      const partial = payment.status === 'PARTIALLY_PAID';
      const html = `
        ${buildDocHeader(operator, 'INVOICE', shortId(payment.id), '')}
        <div class="meta-grid">
          <div>
            <div class="meta-label">Bill To</div>
            <div class="meta-value">${payment.parents?.full_name || ''}</div>
            ${payment.parents?.phone ? `<div class="meta-sub">${payment.parents.phone}</div>` : ''}
            ${payment.children?.full_name ? `<div class="meta-sub">Student: ${payment.children.full_name}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div class="meta-label">Due Date</div>
            <div class="meta-value">${dueDateStr}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>
                <strong>School Transport Fee</strong>
                <div style="font-size:11px;color:#5A6C7D;margin-top:3px">${monthLabel(payment.invoice_month)}</div>
                ${payment.children?.full_name ? `<div style="font-size:11px;color:#5A6C7D;margin-top:3px">Student: ${payment.children.full_name}</div>` : ''}
              </td>
              <td>${fmtPayment(payment.amount)}</td>
            </tr>
          </tbody>
          <tfoot><tr class="total-row"><td>Total Due</td><td>${fmtPayment(payment.amount)}</td></tr></tfoot>
        </table>
        ${partial ? `
          <div class="info-box blue">
            <div class="info-box-label">Partial Payment Received</div>
            <p>Paid to date: <strong>${fmtPayment(payment.amount_collected)}</strong></p>
            <p>Outstanding: <strong>${fmtPayment(parseFloat(payment.amount) - parseFloat(payment.amount_collected))}</strong></p>
          </div>` : ''}
        ${operator?.mpesa_paybill ? `
          <div class="info-box green">
            <div class="info-box-label">Pay via M-Pesa</div>
            <p>Paybill / Till: <strong>${operator.mpesa_paybill}</strong></p>
            <p>Account: <strong>${shortId(payment.id)}</strong></p>
          </div>` : ''}`;
      printDocument(html, `Invoice #${shortId(payment.id)}`);
    };

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
          <div className="p-5 sm:p-8 font-sans text-ink">
            <div className="flex justify-between items-start mb-8 pb-5 border-b-2 border-sage-500">
              <div>
                <p className="text-xl font-bold text-sage-600">ShuleRyde</p>
                <p className="text-sm text-slate">{operator?.business_name}</p>
                <p className="text-sm text-slate">{operator?.phone}</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-black tracking-widest text-ink">INVOICE</h1>
                <p className="text-sm text-slate mt-1">#{shortId(payment.id)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate mb-1">Bill To</p>
                <p className="font-semibold text-ink">{payment.parents?.full_name}</p>
                <p className="text-sm text-slate">{payment.parents?.phone}</p>
                {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-slate mb-1">Due Date</p>
                <p className="font-semibold text-ink text-sm">{dueDateStr}</p>
              </div>
            </div>
            <table className="w-full mb-6 text-sm border-collapse">
              <thead><tr className="bg-paper border-y border-cloud">
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-cloud">
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink">School Transport Fee</p>
                    <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                    {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{fmtPayment(payment.amount)}</td>
                </tr>
              </tbody>
              <tfoot><tr className="bg-paper">
                <td className="px-4 py-3 font-bold text-ink">Total Due</td>
                <td className="px-4 py-3 text-right font-bold text-ink text-base">{fmtPayment(payment.amount)}</td>
              </tr></tfoot>
            </table>
            {payment.status === 'PARTIALLY_PAID' && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Partial Payment Received</p>
                <p className="text-sm text-blue-800">Paid: <strong>{fmtPayment(payment.amount_collected)}</strong></p>
                <p className="text-sm text-blue-800">Outstanding: <strong>{fmtPayment(parseFloat(payment.amount) - parseFloat(payment.amount_collected))}</strong></p>
              </div>
            )}
            {operator?.mpesa_paybill && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
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
        {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSaved={(msg) => { setModal(null); load(); showToast(msg); }} />}
        {docModal && <InvoiceModal payment={docModal} onClose={() => setDocModal(null)} />}
        {partialModal && <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onSaved={() => { setPartialModal(null); load(); }} />}
        {viewModal && (
          <PaymentDetailsModal
            payment={viewModal}
            onClose={() => setViewModal(null)}
            onTxnReceipt={(txn) => setTxnReceiptModal({ txn, payment: viewModal })}
          />
        )}
        {receiptModal && <ReceiptModal payment={receiptModal} onClose={() => setReceiptModal(null)} />}
        {txnReceiptModal && (
          <TransactionReceiptModal
            transaction={txnReceiptModal.txn}
            payment={txnReceiptModal.payment}
            onClose={() => setTxnReceiptModal(null)}
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
          <div>
            <p className="text-slate text-xs sm:text-sm">Track and manage parent payments</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setModal('generate')}>Generate</Button>
            <Button size="sm" onClick={() => setModal('add')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Button>
          </div>
        </div>

        {/* Date range filter for metric cards */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-slate font-medium uppercase tracking-wide">Date range:</span>
          <input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-slate text-sm">to</span>
          <input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          {(filterFromDate || filterToDate) && (
            <button onClick={() => { setFilterFromDate(''); setFilterToDate(''); }}
              className="text-xs text-slate hover:text-error px-2 py-1.5 rounded-lg border border-cloud hover:border-red-200 transition-colors">
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="bg-white rounded-xl border border-cloud p-4 sm:p-5">
            <p className="text-xs text-slate uppercase tracking-wide mb-1">Total Revenue</p>
            <p className="text-lg sm:text-2xl font-semibold text-ink">KES {totalRevenue.toLocaleString()}</p>
          </div>
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
            <input type="text" placeholder="Search by name…" value={filterName} onChange={(e) => setFilterName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500 w-44" />
            <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
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
                      {p.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">{p.children.full_name}</p>}
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
                      Paid: KES {parseFloat(p.amount_collected).toLocaleString()} · Outstanding: KES {(parseFloat(p.amount) - parseFloat(p.amount_collected)).toLocaleString()}
                      {p.payment_transactions?.length > 0 && <span className="ml-1">({p.payment_transactions.length} payment{p.payment_transactions.length !== 1 ? 's' : ''})</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-cloud flex-wrap">
                    <Button size="sm" variant="secondary" className="flex-1 min-w-[60px]" onClick={() => setViewModal(p)}>View</Button>
                    {p.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]" onClick={() => setDocModal(p)}>Invoice</Button>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[90px]" onClick={() => setPartialModal(p)}>Partial Pay</Button>
                        <Button size="sm" className="flex-1" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                      </>
                    )}
                    {p.status === 'PARTIALLY_PAID' && (
                      <>
                        <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]" onClick={() => setDocModal(p)}>Invoice</Button>
                        <Button size="sm" className="flex-1 min-w-[90px]" onClick={() => setPartialModal(p)}>Add Payment</Button>
                      </>
                    )}
                    {p.status === 'PAID' && (
                      <Button size="sm" variant="secondary" className="flex-1 min-w-[70px]" onClick={() => setReceiptModal(p)}>Receipt</Button>
                    )}
                    <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate uppercase tracking-wide">Parent / Student</th>
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
                        {p.children?.full_name && <p className="text-xs text-sage-600">{p.children.full_name}</p>}
                        <p className="text-xs text-slate">{p.parents?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate">{p.invoice_month}</td>
                      <td className="px-4 py-3.5 text-right">
                        <p className="font-semibold text-ink text-sm">KES {parseFloat(p.amount).toLocaleString()}</p>
                        {p.status === 'PARTIALLY_PAID' && (
                          <>
                            <p className="text-xs text-blue-600">Collected: KES {parseFloat(p.amount_collected || 0).toLocaleString()}</p>
                            {p.payment_transactions?.length > 0 && (
                              <p className="text-xs text-slate">{p.payment_transactions.length} payment{p.payment_transactions.length !== 1 ? 's' : ''}</p>
                            )}
                          </>
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
                          {p.status !== 'PAID' && <Button size="sm" variant="secondary" onClick={() => setDocModal(p)}>Invoice</Button>}
                          {p.status === 'PAID' && <Button size="sm" variant="secondary" onClick={() => setReceiptModal(p)}>Receipt</Button>}
                          {(p.status === 'PENDING' || p.status === 'PARTIALLY_PAID') && (
                            <Button size="sm" variant="secondary" onClick={() => setPartialModal(p)}>
                              {p.status === 'PARTIALLY_PAID' ? 'Add Payment' : 'Partial Pay'}
                            </Button>
                          )}
                          {p.status === 'PENDING' && (
                            <Button size="sm" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                          )}
                          <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error transition-colors p-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

  const TABS = [
    { id: 'payments', label: 'Payments' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'profit-loss', label: 'P&L Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ink text-white px-4 py-3 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Finance</h1>
        <p className="text-slate text-xs sm:text-sm mt-0.5">Manage payments, expenses, revenue & financial reporting</p>
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
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'profit-loss' && <ProfitLossTab />}
        {activeTab === 'balance-sheet' && <BalanceSheetTab />}
      </div>
    </div>
  );
};

export default Finance;
