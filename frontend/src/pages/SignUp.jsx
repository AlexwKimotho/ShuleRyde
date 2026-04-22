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
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
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
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-display font-semibold text-ink">ShuleRyde</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-ink">Create your account</h1>
          <p className="text-slate text-sm mt-1">Set up your transport operation in minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8 border border-cloud">
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
    </div>
  );
};

export default SignUp;
