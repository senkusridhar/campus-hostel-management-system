'use client';

import React, { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FinanceLoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-4">
        <Link href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Switch Login Portal
        </Link>
      </div>

      <Suspense fallback={<div className="text-xs text-slate-500">Loading finance login...</div>}>
        <LoginForm
          portalRole="FINANCE"
          portalTitle="Finance & Accounts Login"
          portalSubtitle="Fee structures, billing, payment verification & student dues ledger"
          demoEmail="finance@campushms.local"
          demoPassword="CampusHMS@2026"
        />
      </Suspense>
    </div>
  );
}
