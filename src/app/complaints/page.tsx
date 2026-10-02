'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Complaint } from '@/types';
import {
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Star,
  MessageSquare,
  Flame,
  Check,
} from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'popular'>('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/complaints?scope=${activeTab === 'my' ? 'my' : 'all'}${
          activeTab === 'popular' ? '&sortBy=votes' : ''
        }`
      );
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserRole(data.user.role);
          if (data.user.role === 'STUDENT' || data.user.role === 'PARENT') {
            setActiveTab('all');
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [activeTab]);

  const handleVote = async (complaintId: string, type: 'UPVOTE' | 'DOWNVOTE') => {
    if (userRole !== 'STUDENT' && userRole !== 'PARENT') return;
    setVotingId(complaintId);
    try {
      const target = complaints.find((c) => c.id === complaintId);
      if (target?.userVote === type) {
        // Remove vote
        const res = await fetch(`/api/complaints/${complaintId}/vote`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setComplaints((prev) =>
            prev.map((c) =>
              c.id === complaintId
                ? {
                    ...c,
                    votesCount: data.votesCount,
                    upvotesCount: data.upvotesCount,
                    downvotesCount: data.downvotesCount,
                    userVote: null,
                    hasVoted: false,
                  }
                : c
            )
          );
        }
      } else {
        // Add or switch vote (e.g. from UPVOTE to DOWNVOTE)
        const res = await fetch(`/api/complaints/${complaintId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (data.success) {
          setComplaints((prev) =>
            prev.map((c) =>
              c.id === complaintId
                ? {
                    ...c,
                    votesCount: data.votesCount,
                    upvotesCount: data.upvotesCount,
                    downvotesCount: data.downvotesCount,
                    userVote: type,
                    hasVoted: true,
                  }
                : c
            )
          );
        }
      }
    } catch (err) {
      console.error('Error recording vote:', err);
    } finally {
      setVotingId(null);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (categoryFilter && categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (priorityFilter && priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (statusFilter && statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (
      searchQuery &&
      !c.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.room.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const openCount = complaints.filter((c) => c.status === 'Open' || c.status === 'Under Review').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const urgentCount = complaints.filter((c) => c.priority === 'Urgent' || c.priority === 'Critical').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hostel Complaints & Maintenance"
          subtitle="Submit maintenance issues, track real-time resolution SLAs, and support community hostel tickets"
        />

        <div className="flex items-center gap-2 shrink-0">
          {(userRole === 'STUDENT' || userRole === 'SUPER_ADMIN' || userRole === 'WARDEN') && (
            <Link
              href="/complaints/new"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Raise New Complaint</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open / Review" value={String(openCount)} icon={AlertTriangle} badge={{ text: "Needs Action", type: "warning" }} />
        <StatCard title="In Progress" value={String(inProgressCount)} icon={Wrench} badge={{ text: "Staff Assigned", type: "neutral" }} />
        <StatCard title="Urgent / High" value={String(urgentCount)} icon={AlertCircle} badge={{ text: "Priority SLA", type: "danger" }} />
        <StatCard title="Resolved Issues" value={String(resolvedCount)} icon={CheckCircle} badge={{ text: "Resolved", type: "positive" }} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Hostel Complaints ({complaints.length})
          </button>

          {userRole === 'STUDENT' && (
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'my'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Reported Tickets
            </button>
          )}

          <button
            onClick={() => setActiveTab('popular')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'popular'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Most Supported / Voted
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search ticket ID, issue title, student, or room..."
        filters={[
          {
            key: 'category',
            placeholder: 'All Categories',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'All Categories', value: 'All' },
              { label: 'Plumbing', value: 'Plumbing' },
              { label: 'Electrical', value: 'Electrical' },
              { label: 'Furniture', value: 'Furniture' },
              { label: 'Internet', value: 'Internet' },
              { label: 'Cleanliness', value: 'Cleanliness' },
              { label: 'Food / Mess', value: 'Food / Mess' },
              { label: 'Water', value: 'Water' },
              { label: 'Security', value: 'Security' },
              { label: 'Room', value: 'Room' },
              { label: 'Other', value: 'Other' },
            ],
          },
          {
            key: 'priority',
            placeholder: 'All Priorities',
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: 'All Priorities', value: 'All' },
              { label: 'Low', value: 'Low' },
              { label: 'Medium', value: 'Medium' },
              { label: 'High', value: 'High' },
              { label: 'Urgent', value: 'Urgent' },
              { label: 'Critical', value: 'Critical' },
            ],
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'All' },
              { label: 'Open', value: 'Open' },
              { label: 'Under Review', value: 'Under Review' },
              { label: 'Assigned', value: 'Assigned' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' },
              { label: 'Closed', value: 'Closed' },
            ],
          },
        ]}
      />

      {/* Complaints Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading complaints register...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No complaints found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Student & Room</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Community Support</th>
                  <th className="py-3 px-4">Status & Resolution</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link href={`/complaints/${c.id}`} className="hover:text-indigo-600 hover:underline">
                        {c.ticketId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{c.studentName}</p>
                      <p className="text-[10px] text-slate-400">
                        Room {c.room} • {c.hostel}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{c.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          c.priority === 'Urgent' || c.priority === 'Critical'
                            ? 'text-rose-600'
                            : c.priority === 'High'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {userRole === 'STUDENT' || userRole === 'PARENT' ? (
                          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={() => handleVote(c.id, 'UPVOTE')}
                              disabled={votingId === c.id}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                c.userVote === 'UPVOTE'
                                  ? 'bg-emerald-100 text-emerald-800 font-extrabold shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                              }`}
                              title={c.userVote === 'UPVOTE' ? 'Click to remove upvote' : 'Upvote this complaint'}
                            >
                              <ThumbsUp className={`w-3 h-3 ${c.userVote === 'UPVOTE' ? 'fill-emerald-600' : ''}`} />
                              <span>{c.upvotesCount || 0}</span>
                            </button>
                            <span className="text-slate-300 text-[10px] px-0.5">|</span>
                            <button
                              type="button"
                              onClick={() => handleVote(c.id, 'DOWNVOTE')}
                              disabled={votingId === c.id}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                                c.userVote === 'DOWNVOTE'
                                  ? 'bg-rose-100 text-rose-800 font-extrabold shadow-xs'
                                  : 'text-slate-600 hover:text-rose-700 hover:bg-slate-100'
                              }`}
                              title={c.userVote === 'DOWNVOTE' ? 'Click to remove downvote' : 'Downvote this complaint'}
                            >
                              <ThumbsDown className={`w-3 h-3 ${c.userVote === 'DOWNVOTE' ? 'fill-rose-600' : ''}`} />
                              <span>{c.downvotesCount || 0}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700">
                            <span className="flex items-center gap-1 text-emerald-700 font-bold" title="Upvotes">
                              <ThumbsUp className="w-3 h-3 text-emerald-600" />
                              {c.upvotesCount || 0}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 text-rose-700 font-bold" title="Downvotes">
                              <ThumbsDown className="w-3 h-3 text-rose-600" />
                              {c.downvotesCount || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <StatusBadge status={c.status} size="sm" />
                        {c.rating && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{c.rating.score}/5 Stars</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded transition-colors"
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
