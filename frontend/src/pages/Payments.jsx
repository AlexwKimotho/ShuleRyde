import html2pdf from 'html2pdf.js';
import { useEffect, useMemo, useState } from 'react';
import { paymentsAPI, parentsAPI, schoolsAPI, whatsappAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

const PAGE_SIZE = 10; // parents per page

const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmt = (n) => `KES ${parseFloat(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
const shortId = (id) => id?.slice(0, 8).toUpperCase();
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
};

const formatPhone = (phone) => {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('254')) return clean;
  if (clean.startsWith('0')) return '254' + clean.slice(1);
  return '254' + clean;
};
const waLink = (phone, msg) => `https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(msg)}`;
const WaIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const groupCollected = (g) => g.payments.reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
const groupOutstanding = (g) => g.payments.reduce((s, p) => s + Math.max(0, parseFloat(p.amount) - parseFloat(p.amount_collected || 0)), 0);
const firstName = (name) => name?.split(' ')[0] || name || '';

const latestInstallment = (p) => {
  const txns = p.payment_transactions || [];
  if (!txns.length) return null;
  return [...txns].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))[0];
};

// ── PDF document builders (inline-styled, Tailwind-independent) ───────────────
const FONT = `font-family:'Helvetica Neue',Arial,sans-serif`;
const nowLabel = () => new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });

const docHeader = (operator, type, refId, statusLabel, statusColors) => `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:3px solid #6B9080;">
    <div>
      <div style="font-size:24px;font-weight:800;color:#6B9080;letter-spacing:-0.5px;">ShuleRyde</div>
      ${operator?.business_name ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">${operator.business_name}</div>` : ''}
      ${operator?.phone ? `<div style="font-size:13px;color:#64748b;">${operator.phone}</div>` : ''}
      <div style="font-size:11px;color:#94a3b8;margin-top:6px;">Generated: ${nowLabel()}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:32px;font-weight:900;letter-spacing:4px;color:#1a2332;line-height:1;">${type}</div>
      <div style="font-size:13px;color:#64748b;margin-top:6px;">#${refId}</div>
      <div style="display:inline-block;margin-top:8px;padding:4px 14px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:0.5px;background:${statusColors.bg};color:${statusColors.text};">${statusLabel}</div>
    </div>
  </div>`;

const docPartyBlock = (label, name, phone, child) => `
  <div>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:8px;">${label}</div>
    <div style="font-size:16px;font-weight:700;color:#1a2332;">${name || ''}</div>
    <div style="font-size:13px;color:#64748b;margin-top:3px;">${phone || ''}</div>
    ${child ? `<div style="font-size:12px;color:#6B9080;margin-top:4px;font-weight:500;">Student: ${child}</div>` : ''}
  </div>`;

const docTable = (rows, totalLabel, totalAmt, extraFooter = '') => `
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #e2e8f0;">Description</th>
        <th style="padding:12px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #e2e8f0;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="background:#f8fafc;">
        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#1a2332;border-top:2px solid #e2e8f0;">${totalLabel}</td>
        <td style="padding:14px 16px;text-align:right;font-size:15px;font-weight:700;color:#1a2332;border-top:2px solid #e2e8f0;">${totalAmt}</td>
      </tr>
      ${extraFooter}
    </tfoot>
  </table>`;

const docFooter = (operator) => `
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6;">
    Thank you for trusting ShuleRyde with your child's transport.<br>
    ${operator?.business_name || 'ShuleRyde'} &nbsp;·&nbsp; Generated ${nowLabel()}
  </div>`;

const printDoc = (bodyHtml, title = 'ShuleRyde Document') => {
  const win = window.open('', '_blank', 'width=820,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;${FONT};}
    @page{margin:1.5cm;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style>
    </head><body><div style="max-width:700px;margin:0 auto;padding:48px 40px;">${bodyHtml}</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
};

const generatePdfBlob = (bodyHtml) => {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;padding:48px 40px;box-sizing:border-box;${FONT}`;
  wrapper.innerHTML = bodyHtml;
  document.body.appendChild(wrapper);
  return html2pdf().set({
    margin: 0,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
  }).from(wrapper).outputPdf('blob').finally(() => {
    document.body.removeChild(wrapper);
  });
};

const buildInvoiceDoc = (payment, operator) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const status = payment.status;
  const statusColors = status === 'PAID'
    ? { bg: '#dcfce7', text: '#15803d' }
    : status === 'PARTIALLY_PAID'
    ? { bg: '#dbeafe', text: '#1d4ed8' }
    : { bg: '#fef3c7', text: '#92400e' };
  const statusLabel = status === 'PARTIALLY_PAID' ? 'PARTIAL' : (status || 'PENDING');

  const row = `<tr><td style="padding:18px 16px;border-bottom:1px solid #f1f5f9;">
    <div style="font-size:14px;font-weight:600;color:#1a2332;">School Transport Fee</div>
    <div style="font-size:12px;color:#64748b;margin-top:3px;">${monthLabel(payment.invoice_month)}</div>
  </td><td style="padding:18px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a2332;border-bottom:1px solid #f1f5f9;">${fmt(payment.amount)}</td></tr>`;

  const partial = status === 'PARTIALLY_PAID' ? `
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;padding:14px 16px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin-bottom:6px;">Partial Payment Received</div>
      <div style="font-size:13px;color:#1d4ed8;">Paid: <strong>${fmt(payment.amount_collected)}</strong> &nbsp;|&nbsp; Outstanding: <strong>${fmt(parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0))}</strong></div>
    </div>` : '';

  const mpesa = operator?.mpesa_paybill ? `
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:14px 16px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#166534;margin-bottom:6px;">Pay via M-Pesa</div>
      <div style="font-size:13px;color:#15803d;">Paybill / Till: <strong>${operator.mpesa_paybill}</strong> &nbsp;·&nbsp; Account: <strong>${shortId(payment.id)}</strong></div>
    </div>` : '';

  return docHeader(operator, 'INVOICE', shortId(payment.id), statusLabel, statusColors)
    + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;">`
    + docPartyBlock('Bill To', payment.parents?.full_name, payment.parents?.phone, payment.children?.full_name)
    + `<div style="text-align:right;">
        <div style="margin-bottom:14px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Issue Date</div>
          <div style="font-size:13px;color:#1a2332;">${new Date().toLocaleDateString('en-KE')}</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Due Date</div>
          <div style="font-size:14px;font-weight:700;color:#dc2626;">${dueDate.toLocaleDateString('en-KE')}</div>
        </div>
      </div></div>`
    + docTable(row, 'Total Due', fmt(payment.amount))
    + partial + mpesa
    + docFooter(operator);
};

const buildReceiptDoc = (payment, operator) => {
  const installment = latestInstallment(payment);
  const displayAmt = installment ? parseFloat(installment.amount) : parseFloat(payment.amount_collected || payment.amount);
  const datePaid = installment?.paid_at
    ? new Date(installment.paid_at).toLocaleDateString('en-KE')
    : payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE') : '';
  const method = installment?.payment_method || payment.payment_method || 'Cash';
  const isPartial = payment.status === 'PARTIALLY_PAID';
  const statusColors = isPartial ? { bg: '#dbeafe', text: '#1d4ed8' } : { bg: '#dcfce7', text: '#15803d' };

  const row = `<tr><td style="padding:18px 16px;border-bottom:1px solid #f1f5f9;">
    <div style="font-size:14px;font-weight:600;color:#1a2332;">School Transport Fee</div>
    <div style="font-size:12px;color:#64748b;margin-top:3px;">${monthLabel(payment.invoice_month)}</div>
    ${isPartial ? `<div style="font-size:11px;color:#3b82f6;margin-top:3px;">Latest installment · Full invoice: ${fmt(payment.amount)}</div>` : ''}
  </td><td style="padding:18px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a2332;border-bottom:1px solid #f1f5f9;">${fmt(displayAmt)}</td></tr>`;

  const confirmed = `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:#166534;">Payment Confirmed</div>
      <div style="font-size:12px;color:#15803d;margin-top:4px;">
        ${isPartial
          ? `Installment receipt for ${monthLabel(payment.invoice_month)}. Balance: ${fmt(Math.max(0, parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0)))}`
          : `This receipt confirms full payment for ${monthLabel(payment.invoice_month)}.`}
      </div>
    </div>`;

  return docHeader(operator, 'RECEIPT', shortId(payment.id), isPartial ? 'PARTIAL' : 'PAID', statusColors)
    + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;">`
    + docPartyBlock('Received From', payment.parents?.full_name, payment.parents?.phone, payment.children?.full_name)
    + `<div style="text-align:right;">
        ${datePaid ? `<div style="margin-bottom:14px;"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Date Paid</div><div style="font-size:13px;font-weight:600;color:#1a2332;">${datePaid}</div></div>` : ''}
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Method</div><div style="font-size:13px;color:#1a2332;">${method}</div></div>
      </div></div>`
    + docTable(row, 'Amount Received', fmt(displayAmt))
    + confirmed
    + docFooter(operator);
};

const buildTxnReceiptDoc = (transaction, payment, operator) => {
  const outstanding = Math.max(0, parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0));

  const row = `<tr><td style="padding:18px 16px;border-bottom:1px solid #f1f5f9;">
    <div style="font-size:14px;font-weight:600;color:#1a2332;">School Transport Fee — Installment</div>
    <div style="font-size:12px;color:#64748b;margin-top:3px;">${monthLabel(payment.invoice_month)}</div>
    ${transaction.notes ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${transaction.notes}</div>` : ''}
  </td><td style="padding:18px 16px;text-align:right;font-size:14px;font-weight:600;color:#1a2332;border-bottom:1px solid #f1f5f9;">${fmt(transaction.amount)}</td></tr>`;

  const extraFooterRow = outstanding > 0
    ? `<tr style="background:#fefce8;"><td colspan="2" style="padding:10px 16px;font-size:13px;color:#854d0e;border-top:1px solid #e2e8f0;">Balance Remaining: <strong>${fmt(outstanding)}</strong></td></tr>`
    : '';

  return docHeader(operator, 'RECEIPT', shortId(transaction.id),
      'INSTALLMENT', { bg: '#dcfce7', text: '#15803d' })
    + `<div style="font-size:11px;color:#64748b;margin-top:-28px;margin-bottom:28px;text-align:right;">Installment Receipt</div>`
    + `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;">`
    + docPartyBlock('Received From', payment.parents?.full_name, payment.parents?.phone, payment.children?.full_name)
    + `<div style="text-align:right;">
        <div style="margin-bottom:14px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Date Paid</div>
          <div style="font-size:13px;font-weight:600;color:#1a2332;">${new Date(transaction.paid_at).toLocaleDateString('en-KE')}</div>
        </div>
        <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:4px;">Method</div><div style="font-size:13px;color:#1a2332;">${transaction.payment_method || 'Cash'}</div></div>
      </div></div>`
    + docTable(row, 'Amount Paid', fmt(transaction.amount), extraFooterRow)
    + docFooter(operator);
};

const studentName = (payment, parentData) => {
  if (payment.children?.full_name) return payment.children.full_name;
  const kids = parentData?.children;
  if (!kids?.length) return null;
  return kids.length === 1 ? kids[0].full_name : kids.map((k) => k.full_name).join(', ');
};
const safeFilename = (name) => (name || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-');

// ── Transaction Receipt Modal ──────────────────────────────────
const TransactionReceiptModal = ({ transaction, payment, operator, onClose, showToast, parentData }) => {
  const [waSending, setWaSending] = useState(false);
  const outstanding = Math.max(0, parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0));
  const student = studentName(payment, parentData);
  const parentName = payment.parents?.full_name || '';
  const docTitle = `Receipt - ${parentName} - ${shortId(transaction.id)}`;
  const handlePrint = () => printDoc(buildTxnReceiptDoc(transaction, payment, operator), docTitle);
  const waMsg = [
    `Hello ${firstName(parentName)},`,
    '',
    `Payment received! Thank you.`,
    student ? `Student: ${student}` : null,
    '',
    `Month: 2nd Term`,
    `Amount Paid: ${fmt(transaction.amount)}`,
    `Receipt #${shortId(transaction.id)}`,
    `Date: ${new Date(transaction.paid_at).toLocaleDateString('en-KE')}`,
    outstanding > 0 ? `Balance Remaining: ${fmt(outstanding)}` : null,
    '',
    'Thank you,',
    operator?.full_name || null,
    operator?.business_name || 'ShuleRyde',
  ].filter((l) => l !== null).join('\n');

  const handleWaShare = async () => {
    setWaSending(true);
    showToast?.('Generating PDF...');
    try {
      const blob = await generatePdfBlob(buildTxnReceiptDoc(transaction, payment, operator));
      const filename = `Receipt-${safeFilename(parentName)}-${shortId(transaction.id)}.pdf`;
      const fd = new FormData();
      fd.append('pdf', blob, filename);
      fd.append('phone', formatPhone(payment.parents?.phone));
      fd.append('caption', waMsg);
      fd.append('filename', filename);
      await whatsappAPI.sendDocument(fd);
      showToast?.('Receipt sent via WhatsApp!');
    } catch (err) {
      if (err.response?.status === 503) {
        window.open(waLink(payment.parents?.phone, waMsg), '_blank', 'noopener,noreferrer');
      } else {
        showToast?.('WhatsApp send failed: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setWaSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Installment Receipt</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleWaShare} disabled={waSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60">
              <WaIcon /><span>{waSending ? 'Sending...' : 'WhatsApp + PDF'}</span>
            </button>
            <Button onClick={handlePrint} size="sm">
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
              <p className="text-lg sm:text-xl font-bold text-sage-600">ShuleRyde</p>
              <p className="text-sm text-slate mt-0.5">{operator?.business_name}</p>
              <p className="text-sm text-slate">{operator?.phone}</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-ink">RECEIPT</h1>
              <p className="text-sm text-slate mt-1">#{shortId(transaction.id)}</p>
              <p className="text-xs text-slate mt-0.5">{new Date(transaction.paid_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
            <thead>
              <tr className="bg-paper border-y border-cloud">
                <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide text-slate font-medium">Description</th>
                <th className="px-4 py-2.5 text-right text-xs uppercase tracking-wide text-slate font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cloud">
                <td className="px-4 py-4">
                  <p className="font-medium text-ink">School Transport Fee — Installment</p>
                  <p className="text-xs text-slate mt-0.5">{monthLabel(payment.invoice_month)}</p>
                  {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
                  {transaction.notes && <p className="text-xs text-slate mt-0.5">{transaction.notes}</p>}
                </td>
                <td className="px-4 py-4 text-right font-medium">{fmt(transaction.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-green-50">
                <td className="px-4 py-3 font-bold text-green-900">Amount Paid</td>
                <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmt(transaction.amount)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-xs text-slate text-center mt-4">Thank you for trusting ShuleRyde with your child's transport. — {operator?.business_name}</p>
        </div>
      </div>
    </div>
  );
};

// ── Invoice Modal ──────────────────────────────────────────
const InvoiceModal = ({ payment, operator, onClose, showToast, parentData }) => {
  const [waSending, setWaSending] = useState(false);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const student = studentName(payment, parentData);
  const parentName = payment.parents?.full_name || '';
  const docTitle = `Invoice - ${parentName} - ${shortId(payment.id)}`;
  const handlePrint = () => printDoc(buildInvoiceDoc(payment, operator), docTitle);
  const waMsg = [
    `Hello ${firstName(parentName)},`,
    '',
    `Your school transport invoice for 2nd Term is ready.`,
    student ? `Student: ${student}` : null,
    '',
    `Amount Due: ${fmt(payment.amount)}`,
    `Invoice #${shortId(payment.id)}`,
    `Due: ${dueDate.toLocaleDateString('en-KE')}`,
    '',
    'Thank you,',
    operator?.full_name || null,
    operator?.business_name || 'ShuleRyde',
  ].filter((l) => l !== null).join('\n');

  const handleWaShare = async () => {
    setWaSending(true);
    showToast?.('Generating PDF...');
    try {
      const blob = await generatePdfBlob(buildInvoiceDoc(payment, operator));
      const filename = `Invoice-${safeFilename(parentName)}-${shortId(payment.id)}.pdf`;
      const fd = new FormData();
      fd.append('pdf', blob, filename);
      fd.append('phone', formatPhone(payment.parents?.phone));
      fd.append('caption', waMsg);
      fd.append('filename', filename);
      await whatsappAPI.sendDocument(fd);
      showToast?.('Invoice sent via WhatsApp!');
    } catch (err) {
      if (err.response?.status === 503) {
        window.open(waLink(payment.parents?.phone, waMsg), '_blank', 'noopener,noreferrer');
      } else {
        showToast?.('WhatsApp send failed: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setWaSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Invoice Preview</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleWaShare} disabled={waSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60">
              <WaIcon /><span>{waSending ? 'Sending...' : 'WhatsApp + PDF'}</span>
            </button>
            <Button onClick={handlePrint} size="sm">
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
              {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
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
          {payment.status === 'PARTIALLY_PAID' && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Partial Payment Received</p>
              <p className="text-sm text-blue-800">Paid: <strong>{fmt(payment.amount_collected)}</strong></p>
              <p className="text-sm text-blue-800">Outstanding: <strong>{fmt(parseFloat(payment.amount) - parseFloat(payment.amount_collected))}</strong></p>
            </div>
          )}
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
const ReceiptModal = ({ payment, operator, onClose, showToast, parentData }) => {
  const [waSending, setWaSending] = useState(false);
  const installment = latestInstallment(payment);
  const displayAmount = installment ? parseFloat(installment.amount) : parseFloat(payment.amount_collected || payment.amount);
  const student = studentName(payment, parentData);
  const parentName = payment.parents?.full_name || '';
  const docTitle = `Receipt - ${parentName} - ${shortId(payment.id)}`;
  const handlePrint = () => printDoc(buildReceiptDoc(payment, operator), docTitle);
  const datePaid = installment?.paid_at
    ? new Date(installment.paid_at).toLocaleDateString('en-KE')
    : payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-KE') : '';
  const waMsg = [
    `Hello ${firstName(parentName)},`,
    '',
    `Payment received! Thank you.`,
    student ? `Student: ${student}` : null,
    '',
    `Month: 2nd Term`,
    `Amount Paid: ${fmt(displayAmount)}`,
    `Receipt #${shortId(payment.id)}`,
    datePaid ? `Date: ${datePaid}` : null,
    '',
    'Thank you,',
    operator?.full_name || null,
    operator?.business_name || 'ShuleRyde',
  ].filter((l) => l !== null).join('\n');

  const handleWaShare = async () => {
    setWaSending(true);
    showToast?.('Generating PDF...');
    try {
      const blob = await generatePdfBlob(buildReceiptDoc(payment, operator));
      const filename = `Receipt-${safeFilename(parentName)}-${shortId(payment.id)}.pdf`;
      const fd = new FormData();
      fd.append('pdf', blob, filename);
      fd.append('phone', formatPhone(payment.parents?.phone));
      fd.append('caption', waMsg);
      fd.append('filename', filename);
      await whatsappAPI.sendDocument(fd);
      showToast?.('Receipt sent via WhatsApp!');
    } catch (err) {
      if (err.response?.status === 503) {
        window.open(waLink(payment.parents?.phone, waMsg), '_blank', 'noopener,noreferrer');
      } else {
        showToast?.('WhatsApp send failed: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setWaSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cloud sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-ink text-sm sm:text-base">Receipt Preview</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={handleWaShare} disabled={waSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60">
              <WaIcon /><span>{waSending ? 'Sending...' : 'WhatsApp + PDF'}</span>
            </button>
            <Button onClick={handlePrint} size="sm">
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
              {payment.children?.full_name && <p className="text-xs text-sage-600 mt-0.5">Student: {payment.children.full_name}</p>}
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

// ── Payment Details Modal ──────────────────────────────────
const PaymentDetailsModal = ({ payment, operator, onClose, onTxnReceipt }) => {
  const collected = parseFloat(payment.amount_collected || 0);
  const total = parseFloat(payment.amount);
  const outstanding = total - collected;
  const progress = total > 0 ? (collected / total) * 100 : 0;
  const transactions = (payment.payment_transactions || []).slice().sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[92vh] overflow-y-auto">
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
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status] || 'bg-gray-100 text-gray-700'}`}>
                {payment.status === 'PARTIALLY_PAID' ? 'Partial' : payment.status}
              </span>
            </div>
          </div>

          <div className="bg-paper rounded-xl p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate">Invoice Amount</span>
              <span className="font-semibold text-ink">{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate">Amount Collected</span>
              <span className="font-semibold text-green-600">{fmt(collected)}</span>
            </div>
            {payment.status !== 'PAID' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate">Outstanding</span>
                <span className="font-semibold text-amber-600">{fmt(outstanding)}</span>
              </div>
            )}
            {payment.payment_date && (
              <div className="flex justify-between text-sm">
                <span className="text-slate">Date Paid</span>
                <span className="text-ink">{new Date(payment.payment_date).toLocaleDateString('en-KE')}</span>
              </div>
            )}
            {payment.payment_method && (
              <div className="flex justify-between text-sm">
                <span className="text-slate">Method</span>
                <span className="text-ink">{payment.payment_method}</span>
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

          {transactions.length > 0 && (
            <div className="bg-paper rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-slate mb-3">Payment History ({transactions.length})</p>
              <div className="space-y-2">
                {transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-cloud">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{fmt(txn.amount)}</p>
                      <p className="text-xs text-slate mt-0.5">
                        {txn.payment_method} · {new Date(txn.paid_at).toLocaleDateString('en-KE')}
                        {txn.notes && <span> · {txn.notes}</span>}
                      </p>
                    </div>
                    <button onClick={() => onTxnReceipt(txn)} className="text-xs text-sage-600 font-medium hover:text-sage-700 ml-2 flex-shrink-0">
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

// ── Add Payment Modal ──────────────────────────────────────
const PaymentModal = ({ parents, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
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
  const [viewModal, setViewModal] = useState(null);
  const [txnReceiptModal, setTxnReceiptModal] = useState(null);
  const [collapsed, setCollapsed] = useState(new Set());
  const [marking, setMarking] = useState(null);
  const [toast, setToast] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterName, setFilterName] = useState('');
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
      await paymentsAPI.markAsPaid(id, { payment_method: 'CASH' });
      await load();
    } catch {}
    finally { setMarking(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    await paymentsAPI.delete(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleExportCSV = () => {
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

  // Build parent -> school_ids map for school filtering
  const parentSchoolMap = {};
  parents.forEach(p => {
    parentSchoolMap[p.id] = new Set((p.children || []).map(c => c.school_id).filter(Boolean));
  });

  const filtered = payments.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (filterMonth && p.invoice_month !== filterMonth) return false;
    if (filterSchool && !parentSchoolMap[p.parent_id]?.has(filterSchool)) return false;
    if (filterName && !p.parents?.full_name?.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (dateFrom && p.payment_date && p.payment_date < dateFrom) return false;
    if (dateTo && p.payment_date && p.payment_date > dateTo + 'T23:59:59Z') return false;
    return true;
  });

  // Group filtered payments by parent
  const parentGroups = useMemo(() => {
    const map = new Map();
    filtered.forEach((p) => {
      const pid = p.parent_id;
      if (!map.has(pid)) map.set(pid, { parent: p.parents, parentId: pid, payments: [] });
      map.get(pid).payments.push(p);
    });
    return Array.from(map.values());
  }, [filtered]);

  const totalPages = Math.ceil(parentGroups.length / PAGE_SIZE);
  const pageGroups = parentGroups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleCollapse = (pid) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(pid)) next.delete(pid); else next.add(pid);
    return next;
  });

  const resetPage = () => setPage(1);

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + parseFloat(p.amount), 0)
    + payments.filter(p => p.status === 'PARTIALLY_PAID').reduce((s, p) => s + parseFloat(p.amount_collected || 0), 0);
  const totalOutstanding = payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + parseFloat(p.amount) - parseFloat(p.amount_collected || 0), 0);

  const hasActiveFilters = filterStatus !== 'ALL' || filterMonth || filterSchool || filterName || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterMonth('');
    setFilterSchool('');
    setFilterName('');
    setDateFrom('');
    setDateTo('');
    resetPage();
  };

  const bulkDownload = (type) => {
    const docs = type === 'invoices'
      ? filtered.filter((p) => p.status === 'PENDING')
      : filtered.filter((p) => p.status === 'PAID' || p.status === 'PARTIALLY_PAID');
    if (!docs.length) { showToast(`No ${type} in current view`); return; }
    if (docs.length > 10) showToast(`Opening ${docs.length} windows — allow popups if prompted`);
    docs.forEach((p, idx) => {
      setTimeout(() => {
        const isInvoice = type === 'invoices';
        printDoc(
          isInvoice ? buildInvoiceDoc(p, operator) : buildReceiptDoc(p, operator),
          `ShuleRyde ${isInvoice ? 'Invoice' : 'Receipt'} #${shortId(p.id)}`
        );
      }, idx * 500);
    });
    showToast(`Opening ${docs.length} ${type} for printing`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {modal === 'add' && <PaymentModal parents={parents} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal === 'generate' && <GenerateModal onClose={() => setModal(null)} onSaved={(msg) => { setModal(null); load(); showToast(msg); }} />}
      {docModal?.type === 'invoice' && <InvoiceModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} showToast={showToast} parentData={parents.find((p) => p.id === docModal.payment.parent_id)} />}
      {docModal?.type === 'receipt' && <ReceiptModal payment={docModal.payment} operator={operator} onClose={() => setDocModal(null)} showToast={showToast} parentData={parents.find((p) => p.id === docModal.payment.parent_id)} />}
      {partialModal && <PartialPaymentModal payment={partialModal} onClose={() => setPartialModal(null)} onSaved={() => { setPartialModal(null); load(); }} />}
      {viewModal && (
        <PaymentDetailsModal
          payment={viewModal}
          operator={operator}
          onClose={() => setViewModal(null)}
          onTxnReceipt={(txn) => setTxnReceiptModal({ txn, payment: viewModal })}
        />
      )}
      {txnReceiptModal && (
        <TransactionReceiptModal
          transaction={txnReceiptModal.txn}
          payment={txnReceiptModal.payment}
          operator={operator}
          onClose={() => setTxnReceiptModal(null)}
          showToast={showToast}
          parentData={parents.find((p) => p.id === txnReceiptModal.payment.parent_id)}
        />
      )}

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
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <div className="relative group">
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Bulk Docs</span>
              <span className="sm:hidden">Docs</span>
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
        {/* Name search + date range row */}
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Search by name…" value={filterName} onChange={(e) => { setFilterName(e.target.value); resetPage(); }}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500 w-36" />
          <span className="text-xs text-slate">Month:</span>
          <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); resetPage(); }}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-xs text-slate">Paid:</span>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-ink text-xs focus:outline-none focus:ring-2 focus:ring-sage-500" />
          <span className="text-xs text-slate">—</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }}
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
          {/* ── Mobile: grouped by parent ── */}
          <div className="md:hidden flex flex-col gap-4">
            {pageGroups.map((group) => {
              const isOpen = !collapsed.has(group.parentId);
              const outstanding = groupOutstanding(group);
              return (
                <div key={group.parentId} className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
                  {/* Parent header */}
                  <button
                    onClick={() => toggleCollapse(group.parentId)}
                    className="w-full flex items-center justify-between p-4 bg-paper/60 border-b border-cloud text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{group.parent?.full_name}</p>
                      <p className="text-xs text-slate">{group.parent?.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate">{group.payments.length} invoice{group.payments.length !== 1 ? 's' : ''}</p>
                        {outstanding > 0 && <p className="text-xs text-amber-600 font-medium">KES {outstanding.toLocaleString()} due</p>}
                      </div>
                      <svg className={`w-4 h-4 text-slate transition-transform ${isOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {/* Invoice rows */}
                  {isOpen && (
                    <div className="divide-y divide-cloud/60">
                      {group.payments.map((p) => {
                        const installment = latestInstallment(p);
                        return (
                          <div key={p.id} className="p-4 pl-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                {p.children?.full_name
                                  ? <p className="text-sm font-medium text-ink">{p.children.full_name}</p>
                                  : <p className="text-xs text-slate italic">No student specified</p>}
                                <p className="text-xs text-slate">{p.invoice_month}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                                {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-ink mb-1">KES {parseFloat(p.amount).toLocaleString()}</p>
                            {installment && (
                              <p className="text-xs text-blue-600 mb-2">
                                Latest: KES {parseFloat(installment.amount).toLocaleString()} · {new Date(installment.paid_at).toLocaleDateString('en-KE')}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-cloud/60 flex-wrap">
                              <Button size="sm" variant="secondary" className="flex-1" onClick={() => setViewModal(p)}>View</Button>
                              {p.status === 'PENDING' && (
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDocModal({ type: 'invoice', payment: p })}>Invoice</Button>
                              )}
                              {(p.status === 'PENDING' || p.status === 'PARTIALLY_PAID') && (
                                <>
                                  <Button size="sm" variant="secondary" className="flex-1" onClick={() => setPartialModal(p)}>Record</Button>
                                  <Button size="sm" className="flex-1" loading={marking === p.id} onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                                </>
                              )}
                              {(p.status === 'PAID' || p.status === 'PARTIALLY_PAID') && (
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setDocModal({ type: 'receipt', payment: p })}>Receipt</Button>
                              )}
                              <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop: grouped table ── */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Student / Month</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Amount</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Latest Installment</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-slate hidden lg:table-cell">Date Paid</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageGroups.map((group) => {
                  const isOpen = !collapsed.has(group.parentId);
                  const outstanding = groupOutstanding(group);
                  const collected = groupCollected(group);
                  return (
                    <>
                      {/* Parent header row */}
                      <tr key={`hdr-${group.parentId}`} className="bg-sage-50/60 border-t-2 border-sage-200/60">
                        <td colSpan={6} className="px-5 py-3">
                          <div className="flex items-center justify-between">
                            <button onClick={() => toggleCollapse(group.parentId)} className="flex items-center gap-2 text-left group">
                              <svg className={`w-4 h-4 text-slate transition-transform ${isOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span className="font-semibold text-ink group-hover:text-sage-700">{group.parent?.full_name}</span>
                              <span className="text-slate text-xs">{group.parent?.phone}</span>
                            </button>
                            <div className="flex items-center gap-4 text-xs text-slate">
                              <span>{group.payments.length} invoice{group.payments.length !== 1 ? 's' : ''}</span>
                              {collected > 0 && <span className="text-green-600">Collected: KES {collected.toLocaleString()}</span>}
                              {outstanding > 0 && <span className="text-amber-600">Outstanding: KES {outstanding.toLocaleString()}</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Invoice rows */}
                      {isOpen && group.payments.map((p) => {
                        const installment = latestInstallment(p);
                        return (
                          <tr key={p.id} className="hover:bg-paper/40 border-b border-cloud/40">
                            <td className="px-5 py-3 pl-10">
                              {p.children?.full_name
                                ? <p className="text-sm text-ink">{p.children.full_name}</p>
                                : <p className="text-xs text-slate italic">—</p>}
                              <p className="text-xs text-slate">{p.invoice_month}</p>
                            </td>
                            <td className="px-5 py-3 font-medium text-ink text-sm">KES {parseFloat(p.amount).toLocaleString()}</td>
                            <td className="px-5 py-3">
                              {installment ? (
                                <div>
                                  <p className="text-sm font-medium text-ink">KES {parseFloat(installment.amount).toLocaleString()}</p>
                                  <p className="text-xs text-slate">{new Date(installment.paid_at).toLocaleDateString('en-KE')}</p>
                                </div>
                              ) : <span className="text-slate">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                                {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate text-sm hidden lg:table-cell">
                              {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-KE') : '—'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="secondary" onClick={() => setViewModal(p)}>View</Button>
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
                                <button onClick={() => handleDelete(p.id)} className="text-slate hover:text-error p-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-slate">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, parentGroups.length)} of {parentGroups.length} parent{parentGroups.length !== 1 ? 's' : ''} · {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-cloud text-sm text-slate disabled:opacity-40 hover:bg-paper transition-colors">
                  Prev
                </button>
                <span className="text-sm text-ink font-medium">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-cloud text-sm text-slate disabled:opacity-40 hover:bg-paper transition-colors">
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
