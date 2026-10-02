'use client';

import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DEMO_COMPLAINTS } from '@/lib/demo-data';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Wrench, CheckSquare, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Tickets"
        subtitle="Work orders, repair dispatches, and facilities maintenance logs"
      />

      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
            Active Facility Work Orders
          </h2>
          <span className="text-xs text-slate-500">Updated today 09:30 AM</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Work Order ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Task Summary</th>
                <th className="py-3 px-4">Assigned Contractor / Staff</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {DEMO_COMPLAINTS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">WO-{item.ticketId}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {item.hostel} - Rm {item.room}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.category}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{item.title}</td>
                  <td className="py-3 px-4 text-slate-600">{item.assignedStaff || 'Central Maintenance'}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{item.priority}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={item.status} size="sm" />
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
