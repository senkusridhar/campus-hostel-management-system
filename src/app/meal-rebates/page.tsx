'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_MEAL_REBATES } from '@/lib/demo-data';
import { FileText, IndianRupee } from 'lucide-react';

export default function MealRebatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Rebate Applications"
        subtitle="Student mess fee waivers during approved academic leave & vacation periods"
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Hostel / Room</th>
                <th className="py-3 px-4">Rebate Dates</th>
                <th className="py-3 px-4">Total Days</th>
                <th className="py-3 px-4">Rebate Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {DEMO_MEAL_REBATES.map((rebate) => (
                <tr key={rebate.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">REB-{rebate.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{rebate.studentName}</p>
                    <p className="text-[10px] text-slate-400">{rebate.studentId}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {rebate.hostel} - Rm {rebate.roomNo}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {rebate.fromDate} to {rebate.toDate}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{rebate.totalDays} Days</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">₹{rebate.amount}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{rebate.reason}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={rebate.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
