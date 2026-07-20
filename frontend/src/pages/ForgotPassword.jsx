import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="w-full max-w-[360px] animate-slide-up">
        <div className="mb-8">
          <Link to="/signin" className="inline-flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(107,144,128,0.4)]">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-display font-semibold text-ink tracking-tight">ShuleRyde</span>
          </Link>
          <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">Reset your password</h1>
          <p className="text-slate text-sm mt-1.5">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="font-medium text-green-800 text-sm">Check your inbox</p>
            <p className="text-green-700 text-sm mt-1">
              If <strong>{email}</strong> is registered, a password reset link is on its way.
            </p>
            <Link to="/signin" className="inline-block mt-4 text-sm text-sage-600 hover:text-sage-700 font-medium">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-error text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
                Send Reset Link
              </Button>
            </form>
            <p className="text-center text-[13px] text-slate mt-6">
              <Link to="/signin" className="text-sage-600 hover:text-sage-700 font-medium">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
