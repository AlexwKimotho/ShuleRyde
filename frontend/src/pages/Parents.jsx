import { useEffect, useState } from 'react';
import { parentsAPI, vehiclesAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// ── Student Modal ──────────────────────────────────────────
const StudentModal = ({ parentId, student, vehicles, onClose, onSaved }) => {
  const isEdit = Boolean(student?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: student?.full_name || '',
    school_name: student?.school_name || '',
    pickup_location: student?.pickup_location || '',
    dropoff_location: student?.dropoff_location || '',
    vehicle_id: student?.vehicle_id || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('Student name is required'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) {
        await parentsAPI.updateStudent(student.id, form);
      } else {
        await parentsAPI.createStudent(parentId, form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Student' : 'Add Student'}</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="full_name" name="full_name" label="Student Name" value={form.full_name} onChange={handleChange} />
          <Input id="school_name" name="school_name" label="School" value={form.school_name} onChange={handleChange} />
          <Input id="pickup_location" name="pickup_location" label="Pickup Location" value={form.pickup_location} onChange={handleChange} />
          <Input id="dropoff_location" name="dropoff_location" label="Drop-off Location" value={form.dropoff_location} onChange={handleChange} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Route / Vehicle</label>
            <select
              name="vehicle_id"
              value={form.vehicle_id}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
            >
              <option value="">— Unassigned —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} · {v.model}{v.route ? ` · ${v.route}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save' : 'Add Student'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Parent Modal ───────────────────────────────────────────
const ParentModal = ({ parent, onClose, onSaved }) => {
  const isEdit = Boolean(parent?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: parent?.full_name || '',
    phone: parent?.phone || '',
    email: parent?.email || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) { setError('Name and phone are required'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) await parentsAPI.update(parent.id, form);
      else await parentsAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Parent' : 'Add Parent'}</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="full_name" name="full_name" label="Full Name" value={form.full_name} onChange={handleChange} />
          <Input id="phone" name="phone" label="Phone Number" placeholder="+254712345678" value={form.phone} onChange={handleChange} />
          <Input id="email" name="email" type="email" label="Email (optional)" value={form.email} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save Changes' : 'Add Parent'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Parent Row ─────────────────────────────────────────────
const ParentRow = ({ parent, vehicles, onEdit, onDelete, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [studentModal, setStudentModal] = useState(null); // null | 'new' | student obj

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Delete this student?')) return;
    await parentsAPI.deleteStudent(studentId);
    onRefresh();
  };

  return (
    <>
      <tr className="hover:bg-paper/50">
        <td className="px-5 py-4">
          <button onClick={() => setExpanded((e) => !e)} className="text-slate hover:text-ink transition-colors mr-2">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="font-medium text-ink">{parent.full_name}</span>
        </td>
        <td className="px-5 py-4 text-slate">{parent.phone}</td>
        <td className="px-5 py-4 text-slate hidden sm:table-cell">{parent.email || '—'}</td>
        <td className="px-5 py-4 text-slate hidden md:table-cell">
          <span className="px-2 py-0.5 bg-sage-50 text-sage-700 rounded-full text-xs font-medium">
            {parent.children?.length ?? 0} student{parent.children?.length !== 1 ? 's' : ''}
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => onEdit(parent)} className="text-slate hover:text-ink transition-colors" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(parent.id)} className="text-slate hover:text-error transition-colors" title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="bg-paper px-8 py-4 border-t border-cloud">
            {studentModal && (
              <StudentModal
                parentId={parent.id}
                student={studentModal === 'new' ? null : studentModal}
                vehicles={vehicles}
                onClose={() => setStudentModal(null)}
                onSaved={() => { setStudentModal(null); onRefresh(); }}
              />
            )}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-ink">Students</h4>
              <Button size="sm" onClick={() => setStudentModal('new')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </Button>
            </div>
            {!parent.children?.length ? (
              <p className="text-sm text-slate">No students yet. Add one above.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {parent.children.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-cloud">
                    <div>
                      <p className="text-sm font-medium text-ink">{s.full_name}</p>
                      <p className="text-xs text-slate mt-0.5">
                        {s.school_name || 'No school set'}
                        {s.vehicles && <span className="ml-2 text-sage-600">· {s.vehicles.license_plate} {s.vehicles.route ? `(${s.vehicles.route})` : ''}</span>}
                        {!s.vehicles && <span className="ml-2 text-amber-600">· No route assigned</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setStudentModal(s)} className="text-slate hover:text-ink transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteStudent(s.id)} className="text-slate hover:text-error transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ── Page ───────────────────────────────────────────────────
const Parents = () => {
  const [parents, setParents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | parent obj

  const load = async () => {
    try {
      const [{ data: pd }, { data: vd }] = await Promise.all([parentsAPI.getAll(), vehiclesAPI.getAll()]);
      setParents(pd.parents);
      setVehicles(vd.vehicles);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parent and all their students?')) return;
    await parentsAPI.delete(id);
    setParents((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {modal && (
        <ParentModal
          parent={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">Parents & Students</h1>
          <p className="text-slate text-sm mt-1">Manage parents and their children's routes</p>
        </div>
        <Button onClick={() => setModal('new')}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Parent
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : parents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-20 px-6 text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Add Your First Parent</h3>
          <p className="text-slate text-sm max-w-xs mb-6">Add parents to manage students, assign routes, and track payments.</p>
          <Button onClick={() => setModal('new')}>Add Parent</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-cloud">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate">Name</th>
                <th className="px-5 py-3 text-left font-medium text-slate">Phone</th>
                <th className="px-5 py-3 text-left font-medium text-slate hidden sm:table-cell">Email</th>
                <th className="px-5 py-3 text-left font-medium text-slate hidden md:table-cell">Students</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {parents.map((p) => (
                <ParentRow
                  key={p.id}
                  parent={p}
                  vehicles={vehicles}
                  onEdit={(parent) => setModal(parent)}
                  onDelete={handleDelete}
                  onRefresh={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Parents;
