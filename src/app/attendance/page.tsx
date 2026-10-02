'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DEMO_ATTENDANCE } from '@/lib/demo-data';
import { UserCheck, UserX, Clock, Moon, AlertTriangle } from 'lucide-react';

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredAttendance = DEMO_ATTENDANCE.filter((att) => {
    if (statusFilter && att.status !== statusFilter) return false;
    if (
      searchQuery &&
      !att.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !att.studentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !att.room.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Night Roll Call & Attendance"
        subtitle="Daily biometric & manual hostel roll call verification register"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present" value="2,312" icon={UserCheck} badge={{ text: "93%", type: "positive" }} />
        <StatCard title="Absent" value="18" icon={UserX} badge={{ text: "Unexcused", type: "danger" }} />
        <StatCard title="On Leave" value="124" icon={Clock} badge={{ text: "Approved", type: "neutral" }} />
        <StatCard title="Outside Curfew" value="32" icon={Moon} badge={{ text: "Flagged", type: "warning" }} />
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student name or room..."
        filters={[
          {
            key: 'status',
            placeholder: 'All Attendance Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Present', value: 'Present' },
              { label: 'Absent', value: 'Absent' },
              { label: 'Outside after curfew', value: 'Outside after curfew' },
              { label: 'Not marked', value: 'Not marked' },
              { label: 'On leave', value: 'On leave' },
            ],
          },
        ]}
      />

      {/* Attendance Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Hostel / Room</th>
                <th className="py-3 px-4">Roll Call Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4">Remarks & Warden Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{att.studentName}</p>
                    <p className="text-[10px] text-slate-400">{att.studentId}</p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {att.hostel} - Rm {att.room}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={att.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">{att.lastSeen}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {att.remarks || <span className="text-slate-400 italic">No issues logged</span>}
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
