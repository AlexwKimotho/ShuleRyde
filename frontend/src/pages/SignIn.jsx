import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const EyeIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
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
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    <div className="min-h-screen flex bg-paper">

      {/* ── Left — form panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-[360px] animate-slide-up">

          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center
                shadow-[0_2px_8px_rgba(107,144,128,0.4)]">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-display font-semibold text-ink tracking-tight">ShuleRyde</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">Welcome back</h1>
            <p className="text-slate text-sm mt-1.5">Sign in to your operator account</p>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-error text-sm flex items-start gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-ink/80 tracking-tight">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="
                    w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm text-ink
                    bg-white border border-border/70 hover:border-border
                    placeholder:text-slate/45
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-sage-500/30 focus:border-sage-500/60
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)]
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              Sign In
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-[13px] text-slate hover:text-sage-600 transition-colors">
              Forgot password?
            </Link>
          </div>

          <p className="text-center text-[13px] text-slate mt-4">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-sage-600 hover:text-sage-700 font-medium">
              Sign up
            </Link>
          </p>

          <div className="text-center mt-4">
            <Link to="/admin/signin" className="text-[11px] text-slate/40 hover:text-slate transition-colors">
              Admin portal →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right — visual panel ──────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-start justify-end p-12"
        style={{ background: 'linear-gradient(150deg, #182d23 0%, #233d30 35%, #3d5c48 65%, #5a7a6c 100%)' }}
      >
        {/* Ambient orbs */}
        <div className="absolute top-[-60px] right-[-60px] w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(107,144,128,0.25) 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-[-80px] w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(224,122,95,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 right-8 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(107,144,128,0.18) 0%, transparent 70%)' }} />

        {/* Glass stat cards */}
        <div className="absolute top-14 right-14 flex flex-col gap-3">
          <div className="backdrop-blur-xl bg-white/[0.09] border border-white/[0.13] rounded-2xl px-5 py-4 text-white
            shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.12em] mb-1.5">Active Routes</p>
            <p className="text-3xl font-bold tracking-tight">12</p>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-10 flex flex-col gap-3 w-52">
          <div className="backdrop-blur-xl bg-white/[0.11] border border-white/[0.16] rounded-2xl px-5 py-4 text-white
            shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-sage-500/70 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-medium">Students</p>
                <p className="font-bold text-xl tracking-tight leading-none">247</p>
              </div>
            </div>
            <div className="h-1 bg-white/[0.15] rounded-full overflow-hidden">
              <div className="h-full bg-sage-400 rounded-full transition-all" style={{ width: '78%' }} />
            </div>
            <p className="text-[10px] text-white/40 mt-2">78% collection rate</p>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-2xl px-5 py-3.5 text-white
            shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.12em] mb-1">Fleet</p>
            <p className="text-2xl font-bold tracking-tight">8
              <span className="text-sm font-normal text-white/50 ml-1.5">vehicles</span>
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-[40px] font-display font-bold text-white leading-[1.1] tracking-tight mb-4">
            Manage your fleet.<br />
            Track payments.<br />
            Stay compliant.
          </h2>
          <p className="text-white/55 text-[15px] max-w-xs leading-relaxed">
            Everything a Nairobi school transport operator needs, in one place.
          </p>
          <div className="flex items-center gap-2 mt-8">
            {['Routes', 'Payments', 'Compliance', 'Students'].map(tag => (
              <span key={tag} className="text-[10px] font-semibold text-white/30 uppercase tracking-widest
                bg-white/[0.06] rounded-full px-2.5 py-1 border border-white/[0.08]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
