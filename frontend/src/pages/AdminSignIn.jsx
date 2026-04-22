import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const AdminSignIn = () => {
  const { signin } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signin(form);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-display font-semibold text-ink">ShuleRyde</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-ink">Super Admin Portal</h1>
            <p className="text-slate text-sm mt-1">Restricted access — authorized personnel only</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="admin@shuleryde.com"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-ink text-sm placeholder:text-slate/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent hover:border-slate/50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Your password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-white text-ink text-sm placeholder:text-slate/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent hover:border-slate/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 rounded-lg bg-ink hover:bg-ink/90 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="/signin" className="text-xs text-slate/50 hover:text-slate transition-colors">
              ← Operator portal
            </a>
          </div>
        </div>
      </div>

      {/* ── Right panel — visual ──────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-start justify-end p-12"
        style={{
          background: 'linear-gradient(145deg, #0f1923 0%, #1a2535 30%, #243044 60%, #2C3E50 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6B9080 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-[-60px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E07A5F 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4a6fa5 0%, transparent 70%)' }} />

        {/* Floating system stat */}
        <div className="absolute top-16 right-16 flex flex-col gap-3">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-white shadow-lg">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <p className="text-base font-semibold">All systems operational</p>
            </div>
          </div>
        </div>

        {/* Floating admin metric cards */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 flex flex-col gap-3">
          {[
            {
              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
              label: 'Operators',
              value: '24',
            },
            {
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              label: 'Active Subscriptions',
              value: '21',
            },
            {
              icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
              label: 'Total Students',
              value: '3,842',
            },
          ].map((f) => (
            <div key={f.label} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs text-white/50">{f.label}</p>
                <p className="text-sm font-bold leading-tight">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-3">
            Full system<br />oversight.
          </h2>
          <p className="text-white/60 text-base max-w-xs">
            Manage operators, monitor platform health, and oversee all ShuleRyde activity from one place.
          </p>
          <p className="text-white/30 text-xs mt-6 tracking-widest uppercase">
            Operators · Subscriptions · Analytics · Compliance
          </p>
        </div>
      </div>

    </div>
  );
};

export default AdminSignIn;
