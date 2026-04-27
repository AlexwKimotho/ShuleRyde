import { useEffect, useState } from 'react';
import { schoolsAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SchoolModal = ({ school, onClose, onSaved }) => {
  const isEdit = Boolean(school?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: school?.name || '', location: school?.location || '' });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('School name is required'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) await schoolsAPI.update(school.id, form);
      else await schoolsAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save school');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit School' : 'Add School'}</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" name="name" label="School Name" placeholder="e.g. Nairobi Academy" value={form.name} onChange={handleChange} />
          <Input id="location" name="location" label="Location (optional)" placeholder="e.g. Westlands, Nairobi" value={form.location} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save' : 'Add School'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const { data } = await schoolsAPI.getAll();
      setSchools(data.schools);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this school? Students linked to it will become unassigned.')) return;
    await schoolsAPI.delete(id);
    setSchools((p) => p.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {modal && (
        <SchoolModal
          school={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Schools</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Manage schools and track student distribution</p>
        </div>
        <Button onClick={() => setModal('new')} className="self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add School
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : schools.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cloud shadow-sm flex flex-col items-center py-16 sm:py-20 px-6 text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-ink mb-2">Add Your First School</h3>
          <p className="text-slate text-sm max-w-xs mb-6">Add schools to assign students and track per-school payment performance.</p>
          <Button onClick={() => setModal('new')}>Add School</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper border-b border-cloud">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate">School Name</th>
                <th className="px-5 py-3 text-left font-medium text-slate hidden sm:table-cell">Location</th>
                <th className="px-5 py-3 text-left font-medium text-slate hidden md:table-cell">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-paper/50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{s.name}</p>
                    {s.location && <p className="text-xs text-slate sm:hidden mt-0.5">{s.location}</p>}
                  </td>
                  <td className="px-5 py-4 text-slate hidden sm:table-cell">{s.location || '—'}</td>
                  <td className="px-5 py-4 text-slate hidden md:table-cell">
                    {new Date(s.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(s)} className="text-slate hover:text-ink transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="text-slate hover:text-error transition-colors" title="Delete">
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
      )}
    </div>
  );
};

export default Schools;
