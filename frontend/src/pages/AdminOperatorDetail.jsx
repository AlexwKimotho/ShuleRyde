import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const VEHICLE_STATUS = {
  ACTIVE: 'bg-green-100 text-green-700',
  IDLE: 'bg-cloud text-slate',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
};

const StatCard = ({ label, value, sub, color = 'text-ink' }) => (
  <div className="bg-white rounded-xl border border-cloud p-4 shadow-sm">
    <p className="text-xs text-slate uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate mt-0.5">{sub}</p>}
  </div>
);

const AdminOperatorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await adminAPI.getOperatorDetail(id);
      setData(res);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleFreeze = async () => {
    if (!window.confirm(`Freeze ${data.operator.business_name}? They will lose access immediately.`)) return;
    setActioning(true);
    try {
      const { data: res } = await adminAPI.freezeOperator(id);
      setData((prev) => ({ ...prev, operator: { ...prev.operator, ...res.operator } }));
    } catch {}
    finally { setActioning(false); }
  };

  const handleUnfreeze = async () => {
    setActioning(true);
    try {
      const { data: res } = await adminAPI.unfreezeOperator(id);
      setData((prev) => ({ ...prev, operator: { ...prev.operator, ...res.operator } }));
    } catch {}
    finally { setActioning(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`PERMANENTLY DELETE ${data.operator.business_name}? This cannot be undone. All their data will be lost.`)) return;
    if (!window.confirm('Are you absolutely sure? Type OK to confirm.\n\nThis will delete the operator, all their vehicles, parents, students and payments.')) return;
    setActioning(true);
    try {
      await adminAPI.deleteOperator(id);
      navigate('/admin/dashboard');
    } catch {}
    finally { setActioning(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!data) return <p className="text-slate">Operator not found.</p>;

  const { operator, vehicles, parents, payments, stats } = data;
  const isSuspended = operator.subscription_status === 'SUSPENDED';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 text-slate hover:text-ink text-sm mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Operators
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-semibold text-ink">{operator.business_name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[operator.subscription_status] || 'bg-cloud text-slate'}`}>
                {operator.subscription_status}
              </span>
            </div>
            <p className="text-slate text-sm mt-0.5">{operator.full_name} · {operator.email} · {operator.phone}</p>
            <p className="text-slate/60 text-xs mt-0.5">
              Joined {new Date(operator.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
              {operator.suspension_date && ` · Suspended ${new Date(operator.suspension_date).toLocaleDateString('en-KE')}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isSuspended ? (
              <button
                onClick={handleUnfreeze} disabled={actioning}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actioning ? '…' : 'Unfreeze Account'}
              </button>
            ) : (
              <button
                onClick={handleFreeze} disabled={actioning}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actioning ? '…' : 'Freeze Account'}
              </button>
            )}
            <button
              onClick={handleDelete} disabled={actioning}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Vehicles" value={stats.vehicles} />
        <StatCard label="Parents" value={stats.parents} />
        <StatCard label="Students" value={stats.students} />
        <StatCard label="Revenue Collected" value={`KES ${stats.revenue.toLocaleString()}`} color="text-green-600" />
        <StatCard label="Outstanding" value={`KES ${stats.pending.toLocaleString()}`} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vehicles */}
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-cloud">
            <h2 className="font-semibold text-ink text-sm">Vehicles ({stats.vehicles})</h2>
          </div>
          {vehicles.length === 0 ? (
            <p className="px-5 py-6 text-slate text-sm">No vehicles added.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Plate</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Model</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Cap.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="px-5 py-3 font-medium text-ink">{v.license_plate}</td>
                    <td className="px-5 py-3 text-slate">{v.model}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VEHICLE_STATUS[v.status]}`}>{v.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate">{v.max_capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Parents */}
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-cloud">
            <h2 className="font-semibold text-ink text-sm">Parents ({stats.parents})</h2>
          </div>
          {parents.length === 0 ? (
            <p className="px-5 py-6 text-slate text-sm">No parents registered.</p>
          ) : (
            <div className="divide-y divide-cloud max-h-64 overflow-y-auto">
              {parents.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{p.full_name}</p>
                    <p className="text-xs text-slate">{p.phone}</p>
                  </div>
                  {p.email && <p className="text-xs text-slate">{p.email}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-cloud">
          <h2 className="font-semibold text-ink text-sm">Recent Payments</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 py-6 text-slate text-sm">No payments recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-cloud">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Parent</th>
                <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Month</th>
                <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Amount</th>
                <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Collected</th>
                <th className="px-5 py-2.5 text-left font-medium text-slate text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium text-ink">{p.parents?.full_name || '—'}</td>
                  <td className="px-5 py-3 text-slate">{p.invoice_month}</td>
                  <td className="px-5 py-3 text-slate">KES {parseFloat(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate">KES {parseFloat(p.amount_collected || 0).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS[p.status] || 'bg-cloud text-slate'}`}>
                      {p.status === 'PARTIALLY_PAID' ? 'Partial' : p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOperatorDetail;
