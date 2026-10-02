'use client';

import React from 'react';
import FinancePage from '@/app/finance/page';

export default function FinanceDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-xs">
              FINANCE & ACCOUNTS PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">finance@campushms.local</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Accounts Ledger & Collection Dashboard</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Rajiv Malhotra • Fee structures, student dues, payment verification & penalty fines ledger
          </p>
        </div>
      </div>

      <FinancePage />
    </div>
  );
}
