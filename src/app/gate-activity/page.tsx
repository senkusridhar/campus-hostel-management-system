'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_GATE_ACTIVITY } from '@/lib/demo-data';
import { ShieldCheck, Clock } from 'lucide-react';

export default function GateActivityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredActivity = DEMO_GATE_ACTIVITY.filter((act) => {
    if (typeFilter && act.type !== typeFilter) return false;
    if (
      searchQuery &&
      !act.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !act.studentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !act.gate.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Activity"
        subtitle="Real-time register of campus entry and exit scans across security gates"
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student, gate or ID..."
        filters={[
          {
            key: 'type',
            placeholder: 'All Movements',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'Check-in', value: 'Check-in' },
              { label: 'Check-out', value: 'Check-out' },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Hostel / Room</th>
                <th className="py-3 px-4">Security Gate</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredActivity.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{act.studentName}</p>
                    <p className="text-[10px] text-slate-400">{act.studentId}</p>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{act.rollNo}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {act.hostel} - Rm {act.roomNo}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{act.gate}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        act.type === 'Check-in' ? 'text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {act.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">{act.timestamp}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={act.status} size="sm" />
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
