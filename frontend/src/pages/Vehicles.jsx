import { useEffect, useState } from 'react';
import { vehiclesAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-700',
  IDLE: 'bg-cloud text-slate',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

const VehicleModal = ({ vehicle, onClose, onSaved }) => {
  const isEdit = Boolean(vehicle?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    license_plate: vehicle?.license_plate || '',
    model: vehicle?.model || '',
    route: vehicle?.route || '',
    max_capacity: vehicle?.max_capacity || 7,
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
      if (isEdit) await vehiclesAPI.update(vehicle.id, form);
      else await vehiclesAPI.create(form);
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
          <div className="mb-4 p-3 rounded-lg bg-terracotta-50 border border-terracotta-100 text-error text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="license_plate" name="license_plate" label="License Plate" placeholder="KAA 123A" value={form.license_plate} onChange={handleChange} />
          <Input id="model" name="model" label="Vehicle Model" placeholder="Toyota HiAce" value={form.model} onChange={handleChange} />
          <Input id="route" name="route" label="Route (optional)" placeholder="Westlands — Kileleshwa — CBD" value={form.route} onChange={handleChange} />
          <Input id="max_capacity" name="max_capacity" type="number" label="Max Capacity" min={1} max={50} value={form.max_capacity} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save Changes' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const { data } = await vehiclesAPI.getAll();
      setVehicles(data.vehicles);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await vehiclesAPI.delete(id);
      setVehicles((v) => v.filter((x) => x.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const handleSaved = () => { setModalOpen(false); setEditTarget(null); load(); };

  return (
    <div className="max-w-4xl mx-auto">
      {(modalOpen || editTarget) && (
        <VehicleModal
          vehicle={editTarget}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}
      {viewTarget && <VehicleViewModal vehicle={viewTarget} onClose={() => setViewTarget(null)} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Vehicles</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Manage your fleet</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="self-start sm:self-auto">
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
        <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-16 sm:py-20 px-6 text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 17l4 4 4-4m-4-5v9m6-10.5A2.5 2.5 0 0016 6H8a2.5 2.5 0 00-2 4.5M12 3v3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Add Your First Vehicle</h3>
          <p className="text-slate text-sm max-w-xs mb-6">Add the vehicles in your fleet to start managing routes, students, and compliance documents.</p>
          <Button onClick={() => setModalOpen(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{v.license_plate}</p>
                    <p className="text-sm text-slate mt-0.5">{v.model}</p>
                    {v.route && <p className="text-xs text-slate mt-1">{v.route}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[v.status]}`}>
                    {v.status}
                  </span>
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

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Plate</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Model</th>
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
                    <td className="px-5 py-4 text-slate">{v.route || '—'}</td>
                    <td className="px-5 py-4 text-slate">{v.children?.length ?? 0} / {v.max_capacity}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>{v.status}</span>
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
    </div>
  );
};

export default Vehicles;
