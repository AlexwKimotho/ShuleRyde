import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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

const SignIn = () => {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signin(form);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
              <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <span className="text-xl font-display font-semibold text-ink">ShuleRyde</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-ink">Welcome back!</h1>
            <p className="text-slate text-sm mt-1">Sign in to your operator account</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-terracotta-50 border border-terracotta-100 text-error text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-white text-ink text-sm placeholder:text-slate/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent hover:border-slate/50"
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

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-sage-500 hover:text-sage-700 font-medium">
              Sign Up
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/admin/signin" className="text-xs text-slate/50 hover:text-slate transition-colors">
              Admin Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right panel — visual ──────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-start justify-end p-12"
        style={{
          background: 'linear-gradient(145deg, #1a3a2e 0%, #2d5a45 30%, #4a7c5e 60%, #6B9080 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a8d5b5 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-[-60px] w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E07A5F 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 right-12 w-48 h-48 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #6B9080 0%, transparent 70%)' }} />

        {/* Floating stat cards */}
        <div className="absolute top-16 right-16 flex flex-col gap-3">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-white shadow-lg">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">Active Routes</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-8 flex flex-col gap-3">
          <div className="backdrop-blur-md bg-white/15 border border-white/25 rounded-2xl px-5 py-4 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sage-500/80 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-white/60">Students</p>
                <p className="font-bold text-lg leading-none">247</p>
              </div>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-sage-400 rounded-full" style={{ width: '78%' }} />
            </div>
            <p className="text-xs text-white/50 mt-1">78% collection rate</p>
          </div>

          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-white shadow-lg">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">Fleet</p>
            <p className="text-2xl font-bold">8 <span className="text-sm font-normal text-white/60">vehicles</span></p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-3">
            Manage your fleet.<br />Track payments.<br />Stay compliant.
          </h2>
          <p className="text-white/60 text-base max-w-xs">
            Everything a Nairobi school transport operator needs, in one place.
          </p>
          <p className="text-white/30 text-xs mt-6 tracking-widest uppercase">
            Routes · Payments · Compliance · Students
          </p>
        </div>
      </div>

    </div>
  );
};

export default SignIn;
