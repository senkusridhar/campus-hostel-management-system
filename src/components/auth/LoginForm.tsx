'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  portalRole: 'SUPER_ADMIN' | 'WARDEN' | 'STUDENT' | 'PARENT' | 'SECURITY' | 'FINANCE' | 'MAINTENANCE';
  portalTitle: string;
  portalSubtitle: string;
  demoEmail: string;
  demoPassword: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  portalRole,
  portalTitle,
  portalSubtitle,
  demoEmail,
  demoPassword,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFillDemo = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          portalRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please check credentials.');
        setLoading(false);
        return;
      }

      // Successful login
      const targetUrl = redirectPath || data.redirectUrl || '/dashboard';
      router.push(targetUrl);
      router.refresh();
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm">
            H
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-indigo-300 px-2.5 py-1 rounded border border-slate-700">
            {portalRole.replace('_', ' ')}
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight mt-4">{portalTitle}</h2>
        <p className="text-xs text-slate-400 mt-1">{portalSubtitle}</p>
      </div>

      {/* Demo Credentials Box */}
      <div className="p-4 bg-amber-50/80 border-b border-amber-200/60 flex items-start justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-700" />
            Development Demo Credentials
          </span>
          <p className="text-[11px] text-amber-800 mt-0.5 font-mono">
            {demoEmail}
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillDemo}
          className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold rounded text-[11px] transition-colors shrink-0"
        >
          Auto-fill Demo
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Institutional Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@campushms.local"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Authenticating...</span>
          ) : (
            <>
              <span>Sign In to {portalTitle}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
        Campus HMS • HTTP-Only Cookie Session Active
      </div>
    </div>
  );
};
