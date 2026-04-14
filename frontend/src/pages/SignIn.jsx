import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignIn = () => {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

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
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-sage-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-display font-semibold text-ink">ShuleRyde</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-ink">Welcome back</h1>
          <p className="text-slate text-sm mt-1">Sign in to your operator account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8 border border-cloud">
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

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-sage-500 hover:text-sage-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
