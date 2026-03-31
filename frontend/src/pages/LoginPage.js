import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A2540]" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = isRegister
      ? await register(name.trim(), email.trim(), password)
      : await login(email.trim(), password);

    if (!result.success) {
      setError(result.error || 'Unable to continue. Please try again.');
    }

    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0A2540] text-white flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Orderly
            </h1>
            <p className="text-sm text-slate-500">
              {isRegister ? 'Create your account' : 'Sign in to continue'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600" data-testid="auth-form-error">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-lg bg-[#0A2540] text-white hover:bg-[#103154] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            data-testid="auth-submit-button"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600 text-center">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register');
              setError('');
            }}
            className="text-[#2563EB] hover:underline font-medium"
            data-testid="toggle-auth-mode"
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
