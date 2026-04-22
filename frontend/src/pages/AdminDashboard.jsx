import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const MODULE_KEYS = ['vehicles', 'parents', 'compliance', 'finance'];
const MODULE_LABELS = { vehicles: 'Vehicles', parents: 'Parents', compliance: 'Compliance', finance: 'Finance' };

const defaultPerms = { vehicles: true, parents: true, compliance: true, finance: true };

const PermissionsModal = ({ op, onClose, onSave }) => {
  const [perms, setPerms] = useState({ ...defaultPerms, ...(op.permissions || {}) });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(op.id, perms);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-cloud rounded-full" />
        </div>

        <div className="px-6 py-4 border-b border-cloud">
          <h2 className="font-semibold text-ink text-base">Module Permissions</h2>
          <p className="text-xs text-slate mt-0.5 truncate">{op.business_name}</p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {MODULE_KEYS.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink font-medium">{MODULE_LABELS[key]}</p>
                <p className="text-xs text-slate">{perms[key] ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  perms[key] ? 'bg-green-500' : 'bg-cloud'
                }`}
                role="switch"
                aria-checked={perms[key]}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    perms[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-cloud flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-cloud text-slate hover:bg-paper text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(null);
  const [search, setSearch] = useState('');
  const [permissionsOp, setPermissionsOp] = useState(null);

  const load = async () => {
    try {
      const { data } = await adminAPI.getOperators();
      setOperators(data.operators);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load operators');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFreeze = async (op) => {
    if (!window.confirm(`Freeze account for ${op.business_name}? They will lose access immediately.`)) return;
    setActioning(op.id);
    try {
      const { data } = await adminAPI.freezeOperator(op.id);
      setOperators((prev) => prev.map((o) => o.id === op.id ? { ...o, ...data.operator } : o));
    } catch {}
    finally { setActioning(null); }
  };

  const handleUnfreeze = async (op) => {
    setActioning(op.id);
    try {
      const { data } = await adminAPI.unfreezeOperator(op.id);
      setOperators((prev) => prev.map((o) => o.id === op.id ? { ...o, ...data.operator } : o));
    } catch {}
    finally { setActioning(null); }
  };

  const handleSavePermissions = async (id, perms) => {
    const { data } = await adminAPI.updatePermissions(id, perms);
    setOperators((prev) => prev.map((o) => o.id === id ? { ...o, permissions: data.operator.permissions } : o));
  };

  const filtered = operators.filter((op) =>
    !search ||
    op.full_name.toLowerCase().includes(search.toLowerCase()) ||
    op.business_name.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = operators.filter((o) => o.subscription_status === 'ACTIVE').length;
  const totalSuspended = operators.filter((o) => o.subscription_status === 'SUSPENDED').length;

  return (
    <div>
      {permissionsOp && (
        <PermissionsModal
          op={permissionsOp}
          onClose={() => setPermissionsOp(null)}
          onSave={handleSavePermissions}
        />
      )}

      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Operators</h1>
        <p className="text-slate text-sm mt-0.5">All registered business operators on ShuleRyde</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 shadow-sm">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Total</p>
          <p className="text-xl sm:text-2xl font-semibold text-ink">{operators.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 shadow-sm">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Active</p>
          <p className="text-xl sm:text-2xl font-semibold text-green-600">{totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-cloud p-3 sm:p-4 shadow-sm">
          <p className="text-xs text-slate uppercase tracking-wide mb-1">Suspended</p>
          <p className="text-xl sm:text-2xl font-semibold text-red-600">{totalSuspended}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Error loading operators:</strong> {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, business or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 rounded-lg border border-cloud bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-cloud p-10 text-center">
          <p className="text-slate text-sm">{search ? 'No operators match your search.' : 'No operators have signed up yet.'}</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {filtered.map((op) => (
              <div key={op.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{op.business_name}</p>
                    <p className="text-xs text-slate truncate">{op.full_name}</p>
                    <p className="text-xs text-slate/70 truncate mt-0.5">{op.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[op.subscription_status] || 'bg-cloud text-slate'}`}>
                    {op.subscription_status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate mb-3">
                  <span>{op.stats?.vehicles ?? 0} vehicles</span>
                  <span>·</span>
                  <span>{op.stats?.parents ?? 0} parents</span>
                  <span>·</span>
                  <span>{new Date(op.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/admin/operators/${op.id}`)}
                    className="px-3 py-1.5 rounded-lg border border-cloud text-slate hover:bg-paper text-xs font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setPermissionsOp(op)}
                    className="px-3 py-1.5 rounded-lg border border-cloud text-slate hover:bg-paper text-xs font-medium transition-colors"
                  >
                    Permissions
                  </button>
                  {op.subscription_status === 'SUSPENDED' ? (
                    <button
                      onClick={() => handleUnfreeze(op)}
                      disabled={actioning === op.id}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {actioning === op.id ? '…' : 'Unfreeze'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFreeze(op)}
                      disabled={actioning === op.id}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {actioning === op.id ? '…' : 'Freeze'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table — tablet and up */}
          <div className="hidden sm:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-paper border-b border-cloud">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-slate">Business</th>
                    <th className="px-5 py-3 text-left font-medium text-slate">Contact</th>
                    <th className="px-5 py-3 text-left font-medium text-slate">Vehicles</th>
                    <th className="px-5 py-3 text-left font-medium text-slate">Parents</th>
                    <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-slate hidden lg:table-cell">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-cloud">
                  {filtered.map((op) => (
                    <tr key={op.id} className="hover:bg-paper/50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{op.business_name}</p>
                        <p className="text-xs text-slate">{op.full_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-ink text-xs sm:text-sm">{op.email}</p>
                        <p className="text-xs text-slate">{op.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-slate">{op.stats?.vehicles ?? 0}</td>
                      <td className="px-5 py-4 text-slate">{op.stats?.parents ?? 0}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[op.subscription_status] || 'bg-cloud text-slate'}`}>
                          {op.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate text-xs hidden lg:table-cell">
                        {new Date(op.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/admin/operators/${op.id}`)}
                            className="px-3 py-1.5 rounded-lg border border-cloud text-slate hover:bg-paper text-xs font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setPermissionsOp(op)}
                            className="px-3 py-1.5 rounded-lg border border-cloud text-slate hover:bg-paper text-xs font-medium transition-colors"
                          >
                            Permissions
                          </button>
                          {op.subscription_status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleUnfreeze(op)}
                              disabled={actioning === op.id}
                              className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {actioning === op.id ? '…' : 'Unfreeze'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFreeze(op)}
                              disabled={actioning === op.id}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              {actioning === op.id ? '…' : 'Freeze'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
