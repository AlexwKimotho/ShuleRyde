import { useEffect, useRef, useState } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Settings = () => {
  const { operator: authOperator } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ full_name: '', business_name: '', phone: '', mpesa_paybill: '' });

  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const logoInputRef = useRef();

  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      const op = data.operator;
      setForm({ full_name: op.full_name, business_name: op.business_name, phone: op.phone, mpesa_paybill: op.mpesa_paybill || '' });
      if (op.logo_url) setLogoPreview(op.logo_url);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true); setLogoSuccess(false);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const { data } = await settingsAPI.uploadLogo(formData);
      setLogoPreview(data.logo_url);
      setLogoFile(null);
      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload logo');
    } finally { setUploadingLogo(false); }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
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

      {/* Business Logo */}
      <div className="bg-white rounded-2xl border border-cloud shadow-sm p-4 sm:p-6 mb-4">
        <h2 className="text-base font-semibold text-ink mb-4">Business Logo</h2>

        {logoSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Logo updated successfully.
          </div>
        )}

        <div className="flex items-start gap-5">
          {/* Logo preview */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Business logo"
                className="w-20 h-20 rounded-xl object-contain border border-cloud bg-paper"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-cloud bg-paper flex items-center justify-center">
                <svg className="w-8 h-8 text-slate/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink font-medium mb-1">Upload company logo</p>
            <p className="text-xs text-slate mb-3">PNG, JPG or WebP. Max 2MB. Recommended: square, at least 200×200px.</p>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload"
            />

            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cloud bg-paper text-ink text-sm font-medium hover:bg-cloud transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose File
              </label>

              {logoFile && (
                <>
                  <Button size="sm" onClick={handleLogoUpload} loading={uploadingLogo}>
                    Upload Logo
                  </Button>
                  <button
                    onClick={handleLogoRemove}
                    className="px-3 py-2 rounded-lg border border-cloud text-slate hover:text-error text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {logoFile && (
              <p className="text-xs text-slate mt-2">{logoFile.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Profile */}
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
