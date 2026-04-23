import { useEffect, useState } from 'react';
import { vehiclesAPI, driversAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  MOVING: 'bg-blue-100 text-blue-700',
  IDLE: 'bg-cloud text-slate',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const DRIVER_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-cloud text-slate',
};

const STATUS_OPTIONS = ['ACTIVE', 'MOVING', 'IDLE', 'MAINTENANCE', 'SUSPENDED'];

// ── Vehicle Modal ──────────────────────────────────────────────
const VehicleModal = ({ vehicle, drivers, onClose, onSaved }) => {
  const isEdit = Boolean(vehicle?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    license_plate: vehicle?.license_plate || '',
    model: vehicle?.model || '',
    route: vehicle?.route || '',
    max_capacity: vehicle?.max_capacity || 7,
    driver_id: vehicle?.driver_id || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.license_plate.trim() || !form.model.trim()) {
      setError('License plate and model are required');
      return;
    }
    setLoading(true); setError('');
    try {
      const payload = { ...form, driver_id: form.driver_id || null };
      if (isEdit) await vehiclesAPI.update(vehicle.id, payload);
      else await vehiclesAPI.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save vehicle');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="license_plate" name="license_plate" label="License Plate" placeholder="KAA 123A" value={form.license_plate} onChange={handleChange} />
          <Input id="model" name="model" label="Vehicle Model" placeholder="Toyota HiAce" value={form.model} onChange={handleChange} />
          <Input id="route" name="route" label="Route (optional)" placeholder="Westlands — Kileleshwa — CBD" value={form.route} onChange={handleChange} />
          <Input id="max_capacity" name="max_capacity" type="number" label="Max Capacity" min={1} max={50} value={form.max_capacity} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Assign Driver (optional)</label>
            <select name="driver_id" value={form.driver_id} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">— No driver assigned —</option>
              {drivers.filter((d) => d.status === 'ACTIVE').map((d) => (
                <option key={d.id} value={d.id}>{d.full_name} · {d.phone}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save Changes' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Vehicle View Modal ─────────────────────────────────────────
const VehicleViewModal = ({ vehicle, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-ink">Vehicle Details</h2>
        <button onClick={onClose} className="text-slate hover:text-ink p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-paper rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate mb-1">License Plate</p>
            <p className="font-semibold text-ink">{vehicle.license_plate}</p>
          </div>
          <div className="bg-paper rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate mb-1">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[vehicle.status]}`}>{vehicle.status}</span>
          </div>
        </div>
        <div className="bg-paper rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Model</p>
          <p className="font-semibold text-ink">{vehicle.model}</p>
        </div>
        {vehicle.route && (
          <div className="bg-paper rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate mb-1">Route</p>
            <p className="font-semibold text-ink">{vehicle.route}</p>
          </div>
        )}
        <div className="bg-paper rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Capacity</p>
          <p className="font-semibold text-ink">{vehicle.children?.length ?? 0} / {vehicle.max_capacity} students</p>
        </div>

        {/* Assigned Driver */}
        <div className="bg-paper rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Assigned Driver</p>
          {vehicle.drivers ? (
            <div>
              <p className="font-semibold text-ink">{vehicle.drivers.full_name}</p>
              <p className="text-sm text-slate">{vehicle.drivers.phone}</p>
              {vehicle.drivers.license_number && <p className="text-xs text-slate">Lic: {vehicle.drivers.license_number}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate">No driver assigned</p>
          )}
        </div>

        <div className="bg-paper rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate mb-2">Students ({vehicle.children?.length ?? 0})</p>
          {vehicle.children?.length > 0 ? (
            <div className="space-y-2">
              {vehicle.children.map((child) => (
                <div key={child.id} className="flex items-start justify-between gap-2 py-2 border-b border-cloud last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{child.full_name}</p>
                    {child.school_name && <p className="text-xs text-slate">{child.school_name}</p>}
                    {child.pickup_location && <p className="text-xs text-slate/70">↑ {child.pickup_location}</p>}
                  </div>
                  {child.parents && (
                    <p className="text-xs text-slate flex-shrink-0">{child.parents.full_name}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">No students assigned yet</p>
          )}
        </div>
      </div>
      <div className="mt-5">
        <button onClick={onClose} className="w-full px-4 py-2.5 rounded-lg border border-cloud text-slate hover:bg-paper text-sm font-medium transition-colors">Close</button>
      </div>
    </div>
  </div>
);

// ── Driver Modal ───────────────────────────────────────────────
const DriverModal = ({ driver, onClose, onSaved }) => {
  const isEdit = Boolean(driver?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: driver?.full_name || '',
    phone: driver?.phone || '',
    license_number: driver?.license_number || '',
    status: driver?.status || 'ACTIVE',
    notes: driver?.notes || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      setError('Full name and phone are required');
      return;
    }
    setLoading(true); setError('');
    try {
      if (isEdit) await driversAPI.update(driver.id, form);
      else await driversAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save driver');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Driver' : 'Add Driver'}</h2>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="full_name" name="full_name" label="Full Name" placeholder="John Mwangi" value={form.full_name} onChange={handleChange} />
          <Input id="phone" name="phone" label="Phone Number" placeholder="+254712345678" value={form.phone} onChange={handleChange} />
          <Input id="license_number" name="license_number" label="License Number (optional)" placeholder="DL-12345" value={form.license_number} onChange={handleChange} />
          {isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          )}
          <Input id="notes" name="notes" label="Notes (optional)" placeholder="Additional details…" value={form.notes} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save Changes' : 'Add Driver'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Fleet Tab ──────────────────────────────────────────────────
const FleetTab = ({ vehicles, loading, drivers, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await vehiclesAPI.delete(id);
      onRefresh();
    } catch {}
    finally { setDeleting(null); }
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(id);
    try {
      await vehiclesAPI.update(id, { status: newStatus });
      onRefresh();
    } catch {}
    finally { setUpdatingStatus(null); }
  };

  return (
    <>
      {(modalOpen || editTarget) && (
        <VehicleModal
          vehicle={editTarget}
          drivers={drivers}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSaved={() => { setModalOpen(false); setEditTarget(null); onRefresh(); }}
        />
      )}
      {viewTarget && <VehicleViewModal vehicle={viewTarget} onClose={() => setViewTarget(null)} />}

      <div className="flex items-center justify-between mb-4">
        <p className="text-slate text-sm">Manage your fleet</p>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-16 px-6 text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17l4 4 4-4m-4-5v9m6-10.5A2.5 2.5 0 0016 6H8a2.5 2.5 0 00-2 4.5M12 3v3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Add Your First Vehicle</h3>
          <p className="text-slate text-sm max-w-xs mb-6">Add the vehicles in your fleet to start managing routes, students, and compliance.</p>
          <Button onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{v.license_plate}</p>
                    <p className="text-sm text-slate mt-0.5">{v.model}</p>
                    {v.route && <p className="text-xs text-slate mt-1">{v.route}</p>}
                    {v.drivers && <p className="text-xs text-sage-700 mt-1">Driver: {v.drivers.full_name}</p>}
                  </div>
                  <select
                    value={v.status}
                    disabled={updatingStatus === v.id}
                    onChange={(e) => handleStatusChange(v.id, e.target.value)}
                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 ${STATUS_COLORS[v.status]} ${updatingStatus === v.id ? 'opacity-50' : ''}`}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-cloud">
                  <p className="text-xs text-slate">{v.children?.length ?? 0} / {v.max_capacity} students</p>
                  <div className="flex gap-3">
                    <button onClick={() => setViewTarget(v)} className="text-slate hover:text-ink transition-colors" title="View">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button onClick={() => setEditTarget(v)} className="text-slate hover:text-ink transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} className="text-slate hover:text-error transition-colors disabled:opacity-50" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Plate</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Model</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Driver</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Route</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Students</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-paper/50">
                    <td className="px-5 py-4 font-medium text-ink">{v.license_plate}</td>
                    <td className="px-5 py-4 text-slate">{v.model}</td>
                    <td className="px-5 py-4">
                      {v.drivers ? (
                        <div>
                          <p className="text-sm font-medium text-ink">{v.drivers.full_name}</p>
                          <p className="text-xs text-slate">{v.drivers.phone}</p>
                        </div>
                      ) : <span className="text-slate text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate">{v.route || '—'}</td>
                    <td className="px-5 py-4 text-slate">{v.children?.length ?? 0} / {v.max_capacity}</td>
                    <td className="px-5 py-4">
                      <select
                        value={v.status}
                        disabled={updatingStatus === v.id}
                        onChange={(e) => handleStatusChange(v.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 ${STATUS_COLORS[v.status]} ${updatingStatus === v.id ? 'opacity-50' : ''}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewTarget(v)} className="text-slate hover:text-ink transition-colors" title="View">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => setEditTarget(v)} className="text-slate hover:text-ink transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id} className="text-slate hover:text-error transition-colors disabled:opacity-50" title="Delete">
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

// ── Drivers Tab ────────────────────────────────────────────────
const DriversTab = ({ drivers, vehicles, loading, onRefresh }) => {
  const [driverModal, setDriverModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver? They will be unassigned from any vehicle.')) return;
    setDeleting(id);
    try {
      await driversAPI.delete(id);
      onRefresh();
    } catch {}
    finally { setDeleting(null); }
  };

  return (
    <>
      {driverModal && (
        <DriverModal
          driver={driverModal === 'new' ? null : driverModal}
          onClose={() => setDriverModal(null)}
          onSaved={() => { setDriverModal(null); onRefresh(); }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-slate text-sm">Manage drivers and vehicle assignments</p>
        <Button onClick={() => setDriverModal('new')} size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-16 px-6 text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Add Your First Driver</h3>
          <p className="text-slate text-sm max-w-xs mb-6">Add drivers to assign them to vehicles and track who's operating each route.</p>
          <Button onClick={() => setDriverModal('new')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Driver
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile */}
          <div className="md:hidden flex flex-col gap-3">
            {drivers.map((d) => {
              const assignedVehicle = vehicles.find((v) => v.driver_id === d.id);
              return (
                <div key={d.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{d.full_name}</p>
                      <p className="text-sm text-slate mt-0.5">{d.phone}</p>
                      {d.license_number && <p className="text-xs text-slate mt-0.5">Lic: {d.license_number}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${DRIVER_STATUS_COLORS[d.status]}`}>{d.status}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-cloud flex items-center justify-between">
                    <p className="text-xs text-slate">
                      {assignedVehicle ? `Vehicle: ${assignedVehicle.license_plate}` : 'No vehicle assigned'}
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setDriverModal(d)} className="text-slate hover:text-ink transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} className="text-slate hover:text-error transition-colors disabled:opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Name</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Phone</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">License No.</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Assigned Vehicle</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {drivers.map((d) => {
                  const assignedVehicle = vehicles.find((v) => v.driver_id === d.id);
                  return (
                    <tr key={d.id} className="hover:bg-paper/50">
                      <td className="px-5 py-4 font-medium text-ink">{d.full_name}</td>
                      <td className="px-5 py-4 text-slate">{d.phone}</td>
                      <td className="px-5 py-4 text-slate">{d.license_number || '—'}</td>
                      <td className="px-5 py-4">
                        {assignedVehicle ? (
                          <div>
                            <p className="text-sm font-medium text-ink">{assignedVehicle.license_plate}</p>
                            <p className="text-xs text-slate">{assignedVehicle.model}</p>
                          </div>
                        ) : <span className="text-slate text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DRIVER_STATUS_COLORS[d.status]}`}>{d.status}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setDriverModal(d)} className="text-slate hover:text-ink transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} className="text-slate hover:text-error transition-colors disabled:opacity-50" title="Delete">
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
        </>
      )}
    </>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fleet');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: vd }, { data: dd }] = await Promise.all([vehiclesAPI.getAll(), driversAPI.getAll()]);
      setVehicles(vd.vehicles);
      setDrivers(dd.drivers);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const TABS = [
    { id: 'fleet', label: 'Fleet', count: vehicles.length },
    { id: 'drivers', label: 'Drivers', count: drivers.length },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Vehicles</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Fleet and driver management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-paper rounded-xl p-1 mb-5 sm:mb-6 border border-cloud w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-white text-ink shadow-sm' : 'text-slate hover:text-ink'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-sage-100 text-sage-700' : 'bg-cloud text-slate'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'fleet' && (
        <FleetTab vehicles={vehicles} loading={loading} drivers={drivers} onRefresh={load} />
      )}
      {activeTab === 'drivers' && (
        <DriversTab drivers={drivers} vehicles={vehicles} loading={loading} onRefresh={load} />
      )}
    </div>
  );
};

export default Vehicles;
