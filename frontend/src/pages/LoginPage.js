import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2" data-testid="login-page">
      <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2540] text-white">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-2xl font-semibold text-slate-900">Orderly</span>
          </div>

          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              {isRegister ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {isRegister ? 'Set up your Orderly dashboard account' : 'Sign in to your Orderly dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="auth-form">
            {isRegister && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 transition focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-900 transition focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-slate-900 transition focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  placeholder="••••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600" data-testid="auth-form-error">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] text-base font-semibold text-white transition hover:bg-[#11365a] disabled:opacity-60"
              data-testid="auth-submit-button"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? 'login' : 'register');
                setError('');
              }}
              className="font-medium text-[#2563EB] hover:underline"
              data-testid="toggle-auth-mode"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-[#90ACC4] via-[#2E5F9B] to-[#06256E]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.34),rgba(255,255,255,0)_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_88%,rgba(125,170,255,0.28),rgba(125,170,255,0)_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_38%,rgba(3,17,58,0.38)_100%)]" />
        <div className="relative z-10 flex w-full items-center px-14 py-16 text-white">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">Orderly Workspace</p>
            <h2 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
              Manage your business,
              <br />
              not your chats.
            </h2>
            <p className="mt-7 text-[1.35rem] leading-relaxed text-white/90" style={{ fontFamily: 'Inter, sans-serif' }}>
              Stop losing orders in WhatsApp threads. Orderly keeps your customers, orders, and follow-ups organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
