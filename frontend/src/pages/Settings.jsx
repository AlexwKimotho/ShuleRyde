import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Settings = () => {
  const { operator: authOperator, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', business_name: '', phone: '', mpesa_paybill: '', profile_picture_url: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      const op = data.operator;
      setForm({ full_name: op.full_name, business_name: op.business_name, phone: op.phone, mpesa_paybill: op.mpesa_paybill || '', profile_picture_url: op.profile_picture_url || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError('File must be under 5 MB'); return; }
    setPhotoError('');
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await settingsAPI.uploadProfilePicture(fd);
      setForm(p => ({ ...p, profile_picture_url: data.operator.profile_picture_url }));
      await refreshUser();
    } catch {
      setPhotoError('Upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      await settingsAPI.update(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-sage-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Settings</h1>
        <p className="text-slate text-xs sm:text-sm mt-0.5">Manage your operator profile and business details</p>
      </div>

      <div className="bg-white rounded-2xl border border-cloud shadow-sm p-4 sm:p-6">
        <h2 className="text-base font-semibold text-ink mb-4 sm:mb-5">Business Profile</h2>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Settings saved successfully.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">

          {/* Profile Picture */}
          <div className="flex items-center gap-4 pb-4 sm:pb-5 border-b border-cloud">
            <div className="relative flex-shrink-0">
              {form.profile_picture_url ? (
                <img
                  src={form.profile_picture_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-cloud"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center border-2 border-cloud">
                  <span className="text-sage-700 font-semibold text-2xl">
                    {form.full_name?.[0] || authOperator?.email?.[0]?.toUpperCase() || 'O'}
                  </span>
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink mb-1">Profile Photo</p>
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-sage-600 hover:text-sage-700 font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploadingPhoto ? 'Uploading…' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              </label>
              {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
              <p className="text-xs text-slate mt-0.5">JPG, PNG or WebP · max 5 MB</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Email</label>
            <p className="px-3 py-2 rounded-lg border border-border bg-paper text-slate text-sm">{authOperator?.email}</p>
            <p className="text-xs text-slate">Email cannot be changed here.</p>
          </div>

          <Input id="full_name" name="full_name" label="Your Name" value={form.full_name} onChange={handleChange} />
          <Input id="business_name" name="business_name" label="Business Name" value={form.business_name} onChange={handleChange} />
          <Input id="phone" name="phone" label="Phone Number" placeholder="+254712345678" value={form.phone} onChange={handleChange} />

          <div>
            <Input id="mpesa_paybill" name="mpesa_paybill" label="M-Pesa Paybill / Till Number" placeholder="174379" value={form.mpesa_paybill} onChange={handleChange} />
            <p className="text-xs text-slate mt-1">Used for M-Pesa payment collection (coming soon).</p>
          </div>

          <div className="pt-1 sm:pt-2">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-cloud shadow-sm p-4 sm:p-6 mt-4">
        <h2 className="text-base font-semibold text-ink mb-1">Account</h2>
        <p className="text-sm text-slate mb-4">
          Member since {authOperator ? new Date(authOperator.created_at || Date.now()).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' }) : '—'}
        </p>
        <div className="flex items-center justify-between py-3 border-t border-cloud">
          <div>
            <p className="text-sm font-medium text-ink">Subscription</p>
            <p className="text-xs text-slate">Current plan</p>
          </div>
          <span className="px-3 py-1 bg-sage-50 text-sage-700 rounded-full text-xs font-medium">
            {authOperator?.subscription_status || 'ACTIVE'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
