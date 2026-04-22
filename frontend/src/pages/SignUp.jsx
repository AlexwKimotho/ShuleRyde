import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({
    full_name: '', business_name: '', email: '', phone: '', password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.business_name.trim()) e.business_name = 'Business name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <span className="text-xl font-display font-semibold text-ink">ShuleRyde</span>
            </div>
            <h1 className="text-2xl font-display font-semibold text-ink">Create your account</h1>
            <p className="text-slate text-sm mt-1">Set up your transport operation in minutes</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-terracotta-50 border border-terracotta-100 text-error text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="full_name"
                name="full_name"
                label="Full Name"
                placeholder="Jane Wanjiku"
                value={form.full_name}
                onChange={handleChange}
                error={errors.full_name}
              />
              <Input
                id="business_name"
                name="business_name"
                label="Business Name"
                placeholder="Wanjiku Shuttles"
                value={form.business_name}
                onChange={handleChange}
                error={errors.business_name}
              />
            </div>

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              placeholder="+254 700 000 000"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 pr-10 rounded-lg border bg-white text-ink text-sm placeholder:text-slate/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent ${errors.password ? 'border-error' : 'border-border hover:border-slate/50'}`}
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
              {errors.password && <p className="text-xs text-error">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-sage-500 hover:text-sage-700 font-medium">
              Sign in
            </Link>
          </p>
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

        {/* Floating feature cards */}
        <div className="absolute top-16 right-16 flex flex-col gap-3">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-5 py-3.5 text-white shadow-lg">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-0.5">Setup time</p>
            <p className="text-2xl font-bold">5 <span className="text-sm font-normal text-white/60">minutes</span></p>
          </div>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-8 flex flex-col gap-3">
          {[
            { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Payment Tracking', desc: 'Invoices & receipts' },
            { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Compliance', desc: 'Document alerts' },
            { icon: 'M8 17l4 4 4-4m-4-5v9m6-10.5A2.5 2.5 0 0016 6H8a2.5 2.5 0 00-2 4.5M12 3v3', label: 'Fleet Management', desc: 'Routes & vehicles' },
          ].map((f) => (
            <div key={f.label} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{f.label}</p>
                <p className="text-xs text-white/50">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-3">
            Get your fleet<br />running in minutes.
          </h2>
          <p className="text-white/60 text-base max-w-xs">
            Join transport operators across Nairobi managing routes, payments, and compliance on ShuleRyde.
          </p>
          <p className="text-white/30 text-xs mt-6 tracking-widest uppercase">
            Routes · Payments · Compliance · Students
          </p>
        </div>
      </div>

    </div>
  );
};

export default SignUp;
