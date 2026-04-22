import { useEffect, useState } from 'react';
import { complianceAPI, vehiclesAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const DOC_TYPES = ['Insurance', 'NTSA Inspection', 'PSV License', 'Route License', 'Driver License', 'Good Conduct', 'Other'];

const STATUS_COLORS = {
  VALID: 'bg-green-100 text-green-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

const DocumentModal = ({ doc, vehicles, onClose, onSaved }) => {
  const isEdit = Boolean(doc?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    document_type: doc?.document_type || DOC_TYPES[0],
    vehicle_id: doc?.vehicle_id || '',
    issue_date: doc?.issue_date?.slice(0, 10) || '',
    expiry_date: doc?.expiry_date?.slice(0, 10) || '',
    file_url: doc?.file_url || '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.issue_date || !form.expiry_date || !form.file_url) { setError('All fields are required'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) await complianceAPI.update(doc.id, form);
      else await complianceAPI.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save document');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">{isEdit ? 'Edit Document' : 'Add Document'}</h2>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Document Type</label>
            <select name="document_type" value={form.document_type} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Vehicle (optional)</label>
            <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-sage-500">
              <option value="">— Operator-wide —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.license_plate} · {v.model}</option>)}
            </select>
          </div>
          <Input id="issue_date" name="issue_date" type="date" label="Issue Date" value={form.issue_date} onChange={handleChange} />
          <Input id="expiry_date" name="expiry_date" type="date" label="Expiry Date" value={form.expiry_date} onChange={handleChange} />
          <Input id="file_url" name="file_url" label="Document URL" placeholder="https://drive.google.com/..." value={form.file_url} onChange={handleChange} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">{isEdit ? 'Save' : 'Add Document'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Compliance = () => {
  const [documents, setDocuments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const load = async () => {
    try {
      const [{ data: cd }, { data: vd }] = await Promise.all([complianceAPI.getAll(), vehiclesAPI.getAll()]);
      setDocuments(cd.documents);
      setVehicles(vd.vehicles);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await complianceAPI.delete(id);
    setDocuments((d) => d.filter((x) => x.id !== id));
  };

  const filtered = filterStatus === 'ALL' ? documents : documents.filter((d) => d.status === filterStatus);

  const expiredCount = documents.filter((d) => d.status === 'EXPIRED').length;
  const expiringSoonCount = documents.filter((d) => d.status === 'EXPIRING_SOON').length;

  return (
    <div className="max-w-5xl mx-auto">
      {modal && (
        <DocumentModal
          doc={modal === 'new' ? null : modal}
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Compliance</h1>
          <p className="text-slate text-xs sm:text-sm mt-0.5">Track licenses, insurance, and document expiry</p>
        </div>
        <Button onClick={() => setModal('new')} className="self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Document
        </Button>
      </div>

      {/* Alert banners */}
      {expiredCount > 0 && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {expiredCount} document{expiredCount !== 1 ? 's' : ''} expired — action required
        </div>
      )}
      {expiringSoonCount > 0 && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
          {expiringSoonCount} document{expiringSoonCount !== 1 ? 's' : ''} expiring within 30 days
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['ALL', 'VALID', 'EXPIRING_SOON', 'EXPIRED'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-ink text-white' : 'bg-white border border-cloud text-slate hover:bg-paper'}`}>
            {s === 'ALL' ? 'All' : s === 'EXPIRING_SOON' ? 'Expiring Soon' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
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
          <p className="text-slate text-sm">No documents found. Add your first compliance document above.</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-cloud shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{doc.document_type}</p>
                    <p className="text-xs text-slate mt-0.5">
                      {doc.vehicles ? `${doc.vehicles.license_plate} · ${doc.vehicles.model}` : 'Operator-wide'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[doc.status]}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate mb-3">
                  <span>Expires {new Date(doc.expiry_date).toLocaleDateString('en-KE')}</span>
                  <span className="mx-1.5">·</span>
                  <span>
                    {doc.days_until_expiry < 0
                      ? `${Math.abs(doc.days_until_expiry)}d overdue`
                      : `${doc.days_until_expiry}d left`}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-cloud">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer"
                      className="text-slate hover:text-sage-500 transition-colors" title="View document">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <button onClick={() => setModal(doc)} className="text-slate hover:text-ink transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="text-slate hover:text-error transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-cloud shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-cloud">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-slate">Document</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Vehicle</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Expiry</th>
                  <th className="px-5 py-3 text-left font-medium text-slate">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-paper/50">
                    <td className="px-5 py-4 font-medium text-ink">{doc.document_type}</td>
                    <td className="px-5 py-4 text-slate">
                      {doc.vehicles ? `${doc.vehicles.license_plate} · ${doc.vehicles.model}` : 'Operator-wide'}
                    </td>
                    <td className="px-5 py-4 text-slate">
                      <p>{new Date(doc.expiry_date).toLocaleDateString('en-KE')}</p>
                      <p className="text-xs">
                        {doc.days_until_expiry < 0
                          ? `${Math.abs(doc.days_until_expiry)}d overdue`
                          : `${doc.days_until_expiry}d left`}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-slate hover:text-sage-500 transition-colors" title="View document">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button onClick={() => setModal(doc)} className="text-slate hover:text-ink transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(doc.id)} className="text-slate hover:text-error transition-colors">
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

export default Compliance;
