'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'User';
  const attempted = searchParams.get('attempted') || 'Protected Resource';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
        <p className="text-xs text-slate-500 mt-1">
          Your account role (<span className="font-semibold text-slate-800">{role}</span>) does not have authorization to view <span className="font-semibold text-slate-800">{attempted}</span>.
        </p>

        <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Security & Governance Policy
          </p>
          <p className="text-[11px] text-slate-500">
            Navigation attempts across unpermitted portal boundaries are logged by campus security audit.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Authorized Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading authorization check...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
