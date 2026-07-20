import { useEffect, useState } from 'react';
import { driversAPI, vehiclesAPI } from '../services/api';

const STATUS_STYLES = {
  ACTIVE:   'bg-green-100 text-green-700',
  INACTIVE: 'bg-cloud text-slate',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
};

const EMPTY_FORM = { name: '', phone: '', license_number: '', license_expiry: '', vehicle_id: '', status: 'ACTIVE' };

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <button onClick={onClose} className="text-slate hover:text-ink transition-colors p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const DriverForm = ({ form, onChange, vehicles, onSubmit, loading, submitLabel, error }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {error && (
      <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
    )}
    <div>
      <label className="block text-xs font-medium text-slate mb-1">Full Name *</label>
      <input
        required value={form.name} onChange={e => onChange('name', e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400"
        placeholder="Driver name"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate mb-1">Phone</label>
        <input
          value={form.phone} onChange={e => onChange('phone', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400"
          placeholder="+254…"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate mb-1">Status</label>
        <select
          value={form.status} onChange={e => onChange('status', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate mb-1">License No.</label>
        <input
          value={form.license_number} onChange={e => onChange('license_number', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400"
          placeholder="DL-12345"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate mb-1">Expiry Date</label>
        <input
          type="date" value={form.license_expiry} onChange={e => onChange('license_expiry', e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs font-medium text-slate mb-1">Assigned Vehicle</label>
      <select
        value={form.vehicle_id} onChange={e => onChange('vehicle_id', e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-cloud text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
      >
        <option value="">— None —</option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>{v.license_plate} {v.model ? `· ${v.model}` : ''}</option>
        ))}
      </select>
    </div>
    <div className="flex justify-end gap-2 pt-1">
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  </form>
);

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    Promise.all([driversAPI.getAll(), vehiclesAPI.getAll()])
      .then(([d, v]) => {
        setDrivers(d.data.drivers || []);
        setVehicles(v.data.vehicles || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fieldChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const { data } = await driversAPI.create(form);
      setDrivers(prev => [data.driver, ...prev]);
      setShowAdd(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || err.message
        || 'Failed to add driver';
      setFormError(msg);
    } finally { setSaving(false); }
  };

  const handleEdit = (driver) => {
    setEditing(driver.id);
    setForm({
      name: driver.name || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry ? driver.license_expiry.slice(0, 10) : '',
      vehicle_id: driver.vehicle_id || '',
      status: driver.status || 'ACTIVE',
    });
  };

  const handleUpdate = async (e) => {
    setFormError('');
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await driversAPI.update(editing, form);
      setDrivers(prev => prev.map(d => d.id === editing ? data.driver : d));
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || err.message
        || 'Failed to update driver';
      setFormError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await driversAPI.delete(deleteTarget);
      setDrivers(prev => prev.filter(d => d.id !== deleteTarget));
    } catch {}
    finally { setDeleteTarget(null); }
  };

  const isExpiringSoon = (expiry) => {
    if (!expiry) return false;
    const diff = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const isExpired = (expiry) => expiry && new Date(expiry) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Drivers</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud p-12 text-center">
          <div className="w-12 h-12 bg-cloud rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-ink font-medium">No drivers yet</p>
          <p className="text-slate text-sm mt-1">Add your first driver to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cloud bg-paper">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase tracking-wide">License</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {drivers.map(driver => {
                  const expired = isExpired(driver.license_expiry);
                  const expiringSoon = !expired && isExpiringSoon(driver.license_expiry);
                  const assignedVehicle = vehicles.find(v => v.id === driver.vehicle_id);
                  return (
                    <tr key={driver.id} className="hover:bg-paper transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{driver.name}</td>
                      <td className="px-4 py-3 text-slate">{driver.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {driver.license_number ? (
                          <div>
                            <span className="text-ink">{driver.license_number}</span>
                            {driver.license_expiry && (
                              <span className={`block text-[11px] mt-0.5 ${expired ? 'text-red-500 font-semibold' : expiringSoon ? 'text-amber-600 font-medium' : 'text-slate'}`}>
                                {expired ? 'EXPIRED' : expiringSoon ? 'Expiring soon' : ''}{' '}
                                {new Date(driver.license_expiry).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate">
                        {assignedVehicle ? assignedVehicle.license_plate : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[driver.status] || STATUS_STYLES.INACTIVE}`}>
                          {driver.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => handleEdit(driver)}
                            className="p-1.5 text-slate hover:text-sage-600 hover:bg-sage-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget(driver.id)}
                            className="p-1.5 text-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </div>
      )}

      {showAdd && (
        <Modal title="Add Driver" onClose={() => setShowAdd(false)}>
          <DriverForm form={form} onChange={fieldChange} vehicles={vehicles} onSubmit={handleAdd} loading={saving} submitLabel="Add Driver" error={formError} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Driver" onClose={() => setEditing(null)}>
          <DriverForm form={form} onChange={fieldChange} vehicles={vehicles} onSubmit={handleUpdate} loading={saving} submitLabel="Save Changes" error={formError} />
        </Modal>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-ink mb-2">Remove Driver?</h2>
            <p className="text-slate text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate hover:text-ink border border-cloud rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
