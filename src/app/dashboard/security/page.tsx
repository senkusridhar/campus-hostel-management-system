'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_GATE_ACTIVITY } from '@/lib/demo-data';
import { ShieldCheck, Ticket, Clock, AlertTriangle, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function SecurityDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-bold text-xs">
              SECURITY DESK PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">security@campushms.local</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Main Gate Security Terminal</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Inspector Ram Singh • Gate pass verification, student check-in/out register & scanner logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/gate-activity" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Gate Activity Log
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scans Today" value="482" icon={ShieldCheck} badge={{ text: "Active", type: "positive" }} />
        <StatCard title="Active Day Passes" value="12" icon={Ticket} badge={{ text: "Outside", type: "neutral" }} />
        <StatCard title="Curfew Breaches" value="3" icon={AlertTriangle} badge={{ text: "Flagged", type: "danger" }} />
        <StatCard title="Main Gate Scanner" value="Online" icon={QrCode} badge={{ text: "Operational", type: "positive" }} />
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-sm">Real-Time Security Gate Log</h3>
          <Link href="/gate-activity" className="text-xs font-semibold text-indigo-600">Full Terminal &rarr;</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500">
                <th className="py-2 px-3">Student</th>
                <th className="py-2 px-3">Gate</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {DEMO_GATE_ACTIVITY.map((act) => (
                <tr key={act.id}>
                  <td className="py-2 px-3 font-semibold text-slate-900">{act.studentName} ({act.studentId})</td>
                  <td className="py-2 px-3">{act.gate}</td>
                  <td className="py-2 px-3 font-bold text-indigo-600">{act.type}</td>
                  <td className="py-2 px-3 text-slate-500">{act.timestamp}</td>
                  <td className="py-2 px-3"><StatusBadge status={act.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
