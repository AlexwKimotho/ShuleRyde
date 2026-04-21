import { useEffect, useState } from 'react';
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

  useEffect(() => {
    settingsAPI.get().then(({ data }) => {
      const op = data.operator;
      setForm({ full_name: op.full_name, business_name: op.business_name, phone: op.phone, mpesa_paybill: op.mpesa_paybill || '' });
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
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-ink">Settings</h1>
        <p className="text-slate text-sm mt-1">Manage your operator profile and business details</p>
      </div>

      <div className="bg-white rounded-2xl border border-cloud shadow-sm p-6">
        <h2 className="text-base font-semibold text-ink mb-5">Business Profile</h2>

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Settings saved successfully.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="pt-2">
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-cloud shadow-sm p-6 mt-4">
        <h2 className="text-base font-semibold text-ink mb-1">Account</h2>
        <p className="text-sm text-slate mb-4">Member since {authOperator ? new Date(authOperator.created_at || Date.now()).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' }) : '—'}</p>
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
