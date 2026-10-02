'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DEMO_GATE_PASSES } from '@/lib/demo-data';
import { Ticket, CheckCircle, Clock, AlertTriangle, FileText, Lock } from 'lucide-react';

export default function GatePassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredPasses = DEMO_GATE_PASSES.filter((pass) => {
    if (typeFilter && pass.type !== typeFilter) return false;
    if (statusFilter && pass.status !== statusFilter) return false;
    if (
      searchQuery &&
      !pass.passNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !pass.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !pass.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Passes"
        subtitle="Manage student day passes, night out applications, and out-station leave approvals"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Pending" value="18" icon={Clock} badge={{ text: "Action Needed", type: "warning" }} />
        <StatCard title="Approved" value="42" icon={CheckCircle} badge={{ text: "Ready", type: "positive" }} />
        <StatCard title="Active" value="12" icon={Ticket} badge={{ text: "Outside", type: "neutral" }} />
        <StatCard title="Expired" value="3" icon={AlertTriangle} badge={{ text: "Overdue", type: "danger" }} />
        <StatCard title="Completed" value="154" icon={FileText} />
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search pass no or student ID..."
        filters={[
          {
            key: 'type',
            placeholder: 'All Pass Types',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: 'Day Pass', value: 'Day Pass' },
              { label: 'Night Out', value: 'Night Out' },
              { label: 'Long Leave', value: 'Long Leave' },
            ],
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Active', value: 'Active' },
              { label: 'Expired', value: 'Expired' },
              { label: 'Completed', value: 'Completed' },
            ],
          },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Pass ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Pass Type</th>
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">Expected To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPasses.map((pass) => (
                <tr key={pass.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{pass.passNo}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{pass.studentName}</p>
                    <p className="text-[10px] text-slate-400">
                      {pass.studentId} • Room {pass.roomNo}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{pass.type}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{pass.outTime}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{pass.expectedInTime}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={pass.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-400">{pass.requestedAt}</td>
                  <td className="py-3 px-4">
                    <button
                      disabled
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-400 rounded cursor-not-allowed flex items-center gap-1 opacity-70"
                      title="QR functionality will be enabled in Phase 2"
                    >
                      <Lock className="w-3 h-3" />
                      View Pass
                    </button>
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
