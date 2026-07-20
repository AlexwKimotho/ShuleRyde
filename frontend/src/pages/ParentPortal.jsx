import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { parentPortalAPI } from '../services/api';

// ── helpers ────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n || 0).toLocaleString('en-KE');

const last14Days = () =>
  Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

const PAYMENT_STATUS = {
  PAID:           { cls: 'bg-green-100 text-green-700',  label: 'Paid' },
  PENDING:        { cls: 'bg-amber-100 text-amber-700',  label: 'Pending' },
  PARTIALLY_PAID: { cls: 'bg-blue-100  text-blue-700',   label: 'Partial' },
};

// ── Attendance grid ─────────────────────────────────────────────
const AttendanceGrid = ({ checkins }) => {
  const days = last14Days();
  const present = new Set((checkins || []).map(c => c.check_date));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(day => {
        const arrived = present.has(day);
        const isToday = day === today;
        const label = new Date(day + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'narrow' });
        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
              ${arrived ? 'bg-green-500' : isToday ? 'border-2 border-sage-400' : 'bg-gray-100'}`}>
              {arrived && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[9px] text-gray-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Receipt printer ─────────────────────────────────────────────
const printReceipt = (payment, parent) => {
  const month = payment.invoice_month;
  const win = window.open('', '_blank', 'width=420,height=600');
  win.document.write(`<!DOCTYPE html><html><head><title>Receipt · ${month}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;padding:40px 32px;color:#111;max-width:400px;margin:0 auto}
    h1{font-size:20px;font-weight:700;margin-bottom:4px}
    .sub{color:#888;font-size:13px;margin-bottom:28px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    td{padding:10px 0;border-bottom:1px solid #f0f0f0}
    td:last-child{text-align:right;font-weight:500}
    .total td{font-weight:700;font-size:15px;border-bottom:none;padding-top:16px}
    .badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;
      background:${payment.status==='PAID'?'#dcfce7':'#fef3c7'};
      color:${payment.status==='PAID'?'#15803d':'#92400e'}}
    .footer{margin-top:40px;font-size:11px;color:#bbb;text-align:center}
    @media print{body{padding:20px}}
  </style></head><body>
  <h1>${parent.business_name}</h1>
  <p class="sub">Payment Receipt for ${parent.full_name}</p>
  <table>
    <tr><td>Invoice month</td><td>${month}</td></tr>
    <tr><td>Invoice amount</td><td>KES ${fmt(payment.amount)}</td></tr>
    <tr><td>Amount paid</td><td>KES ${fmt(payment.amount_collected)}</td></tr>
    <tr><td>Balance</td><td>KES ${fmt(parseFloat(payment.amount) - parseFloat(payment.amount_collected || 0))}</td></tr>
    <tr><td>Status</td><td><span class="badge">${payment.status === 'PARTIALLY_PAID' ? 'Partial' : payment.status}</span></td></tr>
    ${payment.payment_date ? `<tr><td>Payment date</td><td>${new Date(payment.payment_date).toLocaleDateString('en-KE',{year:'numeric',month:'long',day:'numeric'})}</td></tr>` : ''}
    ${payment.payment_method ? `<tr><td>Payment method</td><td>${payment.payment_method}</td></tr>` : ''}
  </table>
  <p class="footer">Powered by ShuleRyde</p>
  <script>window.onload=()=>{window.print()}</script>
  </body></html>`);
  win.document.close();
};

// ── Main component ──────────────────────────────────────────────
const ParentPortal = () => {
  const { uniqueId } = useParams();
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', email: '' });
  const [editingContact, setEditingContact] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    parentPortalAPI.get(uniqueId)
      .then(({ data }) => {
        setPortalData(data);
        setContactForm({ phone: data.parent.phone || '', email: data.parent.email || '' });
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [uniqueId]);

  const handleContactSave = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      const { data } = await parentPortalAPI.updateContact(uniqueId, contactForm);
      setPortalData(prev => ({ ...prev, parent: { ...prev.parent, ...data.parent } }));
      setEditingContact(false);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 3000);
    } catch {}
    finally { setContactSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-800 mb-1">Portal not found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or expired. Contact your transport operator.</p>
      </div>
    </div>
  );

  const { parent, children, payments, summary } = portalData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">ShuleRyde</p>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">{parent.business_name}</h1>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-bold text-sm">{parent.full_name?.[0]}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Welcome + outstanding */}
        <div className={`rounded-2xl p-5 ${summary.total_outstanding > 0 ? 'bg-amber-500' : 'bg-green-600'}`}>
          <p className="text-white/80 text-sm mb-1">Hi, {parent.full_name.split(' ')[0]}</p>
          {summary.total_outstanding > 0 ? (
            <>
              <p className="text-white text-2xl font-bold">KES {fmt(summary.total_outstanding)}</p>
              <p className="text-white/80 text-sm mt-1">Outstanding balance · please clear to avoid service disruption</p>
            </>
          ) : (
            <>
              <p className="text-white text-xl font-bold">All paid up ✓</p>
              <p className="text-white/80 text-sm mt-1">No outstanding balance · KES {fmt(summary.total_paid)} paid total</p>
            </>
          )}
          {parent.mpesa_paybill && (
            <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 inline-block">
              <p className="text-white text-xs font-medium">Pay via M-Pesa Paybill: <span className="font-bold">{parent.mpesa_paybill}</span></p>
            </div>
          )}
        </div>

        {/* Children & attendance */}
        {children.map(child => (
          <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{child.full_name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {child.school_name || 'No school set'}
                  {child.vehicles?.license_plate ? ` · Bus ${child.vehicles.license_plate}` : ''}
                </p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${
                child.recent_checkins?.some(c => c.check_date === new Date().toISOString().slice(0, 10))
                  ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Last 14 days</p>
              <AttendanceGrid checkins={child.recent_checkins} />
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-xs text-gray-400">Checked in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-100" />
                  <span className="text-xs text-gray-400">Not recorded</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Payment History</h2>
          </div>
          {payments.length === 0 ? (
            <p className="px-5 py-8 text-gray-400 text-sm text-center">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {payments.map(p => {
                const s = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.PENDING;
                const balance = parseFloat(p.amount) - parseFloat(p.amount_collected || 0);
                return (
                  <li key={p.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{p.invoice_month}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        KES {fmt(p.amount_collected)} paid
                        {balance > 0 ? ` · KES ${fmt(balance)} remaining` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">KES {fmt(p.amount)}</p>
                      {p.status !== 'PENDING' && (
                        <button
                          onClick={() => printReceipt(p, parent)}
                          title="Download receipt"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Contact details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your Contact Details</h2>
            {!editingContact && (
              <button
                onClick={() => setEditingContact(true)}
                className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingContact ? (
            <form onSubmit={handleContactSave} className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="+254712345678"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="you@email.com"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingContact(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={contactSaving}
                  className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60 transition-colors">
                  {contactSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="px-5 py-4 space-y-2">
              {contactSaved && (
                <p className="text-xs text-green-600 font-medium mb-2">✓ Contact details updated</p>
              )}
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p className="text-sm text-gray-900">{parent.phone || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-900">{parent.email || 'No email set'}</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-6">Powered by ShuleRyde</p>
      </div>
    </div>
  );
};

export default ParentPortal;
