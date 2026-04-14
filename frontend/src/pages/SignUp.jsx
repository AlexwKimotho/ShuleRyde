import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState({
    full_name: '', business_name: '', email: '', phone: '', password: '',
  });
  const [errors, setErrors] = useState({});

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

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />

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
