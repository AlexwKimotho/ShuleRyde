import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash: #access_token=...&type=recovery
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const t = params.get('access_token');
    const type = params.get('type');
    if (t && type === 'recovery') {
      setToken(t);
    } else {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
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
          <h1 className="text-2xl font-display font-semibold text-ink tracking-tight">Set new password</h1>
          <p className="text-slate text-sm mt-1.5">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="font-medium text-green-800 text-sm">Password updated</p>
            <p className="text-green-700 text-sm mt-1">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-error text-sm">
                {error}
                {!token && (
                  <div className="mt-2">
                    <Link to="/forgot-password" className="font-medium underline">Request a new link</Link>
                  </div>
                )}
              </div>
            )}
            {token && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="New password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  label="Confirm new password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
                  Update Password
                </Button>
              </form>
            )}
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

export default ResetPassword;
