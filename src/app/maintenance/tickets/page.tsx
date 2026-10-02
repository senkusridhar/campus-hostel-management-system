'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Complaint } from '@/types';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Building,
  Check,
} from 'lucide-react';

export default function MaintenanceTicketsPage() {
  const [tickets, setTickets] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success) {
        setTickets(data.complaints);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionNotes: `Work updated to ${newStatus} by maintenance crew.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: data.complaint.status } : t))
        );
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter && statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (
      searchQuery &&
      !t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.room.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const assignedCount = tickets.filter((t) => t.status === 'Assigned' || t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Work Orders & Dispatch"
        subtitle="Active technician dispatches, plumbing & electrical repair executions, and resolution verification"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Assigned / Pending" value={String(assignedCount)} icon={AlertTriangle} badge={{ text: "Needs Dispatch", type: "warning" }} />
        <StatCard title="Work In Progress" value={String(inProgressCount)} icon={Wrench} badge={{ text: "Active Repair", type: "neutral" }} />
        <StatCard title="Resolved Completed" value={String(resolvedCount)} icon={CheckCircle2} badge={{ text: "Completed", type: "positive" }} />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search work order ID, issue title, or room location..."
        filters={[
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'All' },
              { label: 'Assigned', value: 'Assigned' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' },
              { label: 'Open', value: 'Open' },
            ],
          },
        ]}
      />

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading maintenance work orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Work Order</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      WO-{t.ticketId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{t.hostel}</p>
                      <p className="text-[10px] text-slate-400">Room {t.room}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{t.category}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{t.priority}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {t.assignedStaff || 'Suresh Kumar (Electrician)'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {t.status !== 'Resolved' && t.status !== 'Closed' && (
                        t.status !== 'In Progress' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(t.id, 'In Progress')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors"
                          >
                            Start Work
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickStatusUpdate(t.id, 'Resolved')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-semibold transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )
                      )}

                      <Link
                        href={`/complaints/${t.id}`}
                        className="inline-flex items-center gap-0.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
