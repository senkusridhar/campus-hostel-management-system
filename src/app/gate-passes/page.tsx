'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/StateFeedback';
import {
  Ticket,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Check,
  X,
  QrCode,
  Eye,
  MapPin,
  Calendar,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface GatePassItem {
  id: string;
  passNo: string;
  studentName: string;
  studentId: string;
  studentDbId?: string;
  rollNo?: string;
  roomNo: string;
  hostel: string;
  hostelId?: string;
  type: string;
  passType?: string;
  outTime: string;
  expectedInTime: string;
  fromDateTime?: string;
  toDateTime?: string;
  status: string;
  statusCode?: string;
  reason: string;
  destination?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  qrToken?: string;
}

export default function GatePassesPage() {
  const [passes, setPasses] = useState<GatePassItem[]>([]);
  const [stats, setStats] = useState({
    pending: 18,
    approved: 42,
    activeOutside: 12,
    expired: 3,
    completed: 154,
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STUDENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePassItem | null>(null);

  // Apply Form State
  const [applyType, setApplyType] = useState('Day Pass');
  const [applyReason, setApplyReason] = useState('');
  const [applyDestination, setApplyDestination] = useState('');
  const [applyFrom, setApplyFrom] = useState('');
  const [applyTo, setApplyTo] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);

  // Review Form State (Warden)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Action status message
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Fetch current user role
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch gate passes from API
  const fetchPasses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set('type', typeFilter);
      if (statusFilter) queryParams.set('status', statusFilter);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/gate-passes?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPasses(data.gatePasses || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load gate passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, [typeFilter, statusFilter, searchQuery]);

  // Handle new gate pass submission (Student)
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (!applyReason.trim()) {
      setApplyError('Please provide a reason or purpose for the gate pass.');
      return;
    }
    if (!applyDestination.trim()) {
      setApplyError('Please provide your destination address.');
      return;
    }
    if (!applyFrom) {
      setApplyError('Please choose a departure date and time.');
      return;
    }
    if (!applyTo) {
      setApplyError('Please choose an expected return date and time.');
      return;
    }

    try {
      setApplySubmitting(true);
      const res = await fetch('/api/gate-passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passType: applyType,
          reason: applyReason.trim(),
          destination: applyDestination.trim(),
          fromDateTime: applyFrom,
          toDateTime: applyTo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit gate pass request.');
      }

      setIsApplyModalOpen(false);
      setApplyReason('');
      setApplyDestination('');
      setApplyFrom('');
      setApplyTo('');
      setStatusMessage({
        text: 'Gate pass application submitted successfully! Awaiting Warden approval.',
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
      fetchPasses();
    } catch (err: any) {
      setApplyError(err.message || 'An error occurred while submitting application.');
    } finally {
      setApplySubmitting(false);
    }
  };

  // Handle Warden Review (Approve / Reject)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPass) return;

    try {
      setReviewSubmitting(true);
      const res = await fetch(`/api/gate-passes/${selectedPass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewAction,
          remarks: reviewRemarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update gate pass status.');
      }

      setIsReviewModalOpen(false);
      setSelectedPass(null);
      setReviewRemarks('');
      setStatusMessage({
        text: `Gate pass ${selectedPass.passNo} marked as ${reviewAction === 'APPROVED' ? 'Approved' : 'Rejected'}.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
      fetchPasses();
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to process gate pass.',
        type: 'error',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Security Quick Check-Out / Check-In
  const handleSecurityMovement = async (pass: GatePassItem, movementType: 'CHECK_OUT' | 'CHECK_IN') => {
    try {
      const res = await fetch('/api/gate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatePassId: pass.id,
          studentId: pass.studentId,
          activityType: movementType,
          gate: 'Main Gate',
          remarks: `Verified by Security Desk via Gate Pass ${pass.passNo}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to record ${movementType}.`);
      }

      setStatusMessage({
        text: `Security verified: ${movementType === 'CHECK_OUT' ? 'Check-out' : 'Check-in'} recorded for ${pass.studentName} (${pass.passNo}).`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
      fetchPasses();
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to record movement.',
        type: 'error',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Filter list client-side as secondary safeguard
  const filteredPasses = passes.filter((pass) => {
    if (typeFilter && pass.type !== typeFilter && pass.passType !== typeFilter) return false;
    if (statusFilter && pass.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
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
        actions={
          <div className="flex items-center gap-2">
            {(userRole === 'STUDENT' || userRole === 'SUPER_ADMIN') && (
              <button
                onClick={() => {
                  setApplyError(null);
                  setIsApplyModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Apply for Gate Pass
              </button>
            )}
          </div>
        }
      />

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Pending"
          value={String(stats.pending || passes.filter((p) => p.status === 'Pending').length)}
          icon={Clock}
          badge={{ text: 'Action Needed', type: 'warning' }}
        />
        <StatCard
          title="Approved"
          value={String(stats.approved || passes.filter((p) => p.status === 'Approved').length)}
          icon={CheckCircle}
          badge={{ text: 'Ready', type: 'positive' }}
        />
        <StatCard
          title="Active"
          value={String(stats.activeOutside || passes.filter((p) => p.status === 'Active').length)}
          icon={Ticket}
          badge={{ text: 'Outside', type: 'neutral' }}
        />
        <StatCard
          title="Expired"
          value={String(stats.expired || passes.filter((p) => p.status === 'Expired').length)}
          icon={AlertTriangle}
          badge={{ text: 'Overdue', type: 'danger' }}
        />
        <StatCard
          title="Completed"
          value={String(stats.completed || passes.filter((p) => p.status === 'Completed').length)}
          icon={FileText}
        />
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
              { label: 'Rejected', value: 'Rejected' },
            ],
          },
        ]}
      />

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8">
            <LoadingState message="Fetching authorized gate pass ledger..." />
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Gate Passes Found"
              description={
                searchQuery || typeFilter || statusFilter
                  ? 'No gate pass records matched your selected search filters.'
                  : 'No gate passes have been registered yet.'
              }
            />
          </div>
        ) : (
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{pass.passNo}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{pass.studentName}</p>
                      <p className="text-[10px] text-slate-400">
                        {pass.studentId} • Room {pass.roomNo} ({pass.hostel})
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{pass.type}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{pass.outTime}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{pass.expectedInTime}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={pass.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-400">{pass.requestedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Warden Review Action */}
                        {(userRole === 'WARDEN' || userRole === 'SUPER_ADMIN') &&
                          pass.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setSelectedPass(pass);
                                setReviewAction('APPROVED');
                                setReviewRemarks('');
                                setIsReviewModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              Review
                            </button>
                          )}

                        {/* Security Check-Out Action */}
                        {(userRole === 'SECURITY' || userRole === 'SUPER_ADMIN') &&
                          pass.status === 'Approved' && (
                            <button
                              onClick={() => handleSecurityMovement(pass, 'CHECK_OUT')}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                              title="Record student departure scan"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              Check-Out
                            </button>
                          )}

                        {/* Security Check-In Action */}
                        {(userRole === 'SECURITY' || userRole === 'SUPER_ADMIN') &&
                          pass.status === 'Active' && (
                            <button
                              onClick={() => handleSecurityMovement(pass, 'CHECK_IN')}
                              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors flex items-center gap-1"
                              title="Record student return entry scan"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Check-In
                            </button>
                          )}

                        {/* View Pass Details / Simulated QR View */}
                        <button
                          onClick={() => {
                            setSelectedPass(pass);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          View Pass
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Apply for Gate Pass (Student) */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Gate Pass"
        subtitle="Submit a formal campus leave or day pass application for hostel warden approval"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pass Category *</label>
            <select
              value={applyType}
              onChange={(e) => setApplyType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="Day Pass">Day Pass (Local city visit, return by curfew)</option>
              <option value="Night Out">Night Out (Overnight stay with verified guardian)</option>
              <option value="Long Leave">Long Leave (Vacation, medical, or hometown leave)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Purpose *</label>
            <input
              type="text"
              placeholder="e.g. Bank visit & study group at city library"
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination Address / Location *</label>
            <input
              type="text"
              placeholder="e.g. 42 MG Road, City Center, Bangalore"
              value={applyDestination}
              onChange={(e) => setApplyDestination(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Departure Date & Time *</label>
              <input
                type="datetime-local"
                value={applyFrom}
                onChange={(e) => setApplyFrom(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Return Date & Time *</label>
              <input
                type="datetime-local"
                value={applyTo}
                onChange={(e) => setApplyTo(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <strong>Hostel Regulation Notice:</strong> Return after designated curfew time without prior extension will be flagged on the security terminal and reported to the chief warden.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applySubmitting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-xs flex items-center gap-1 disabled:opacity-50"
            >
              {applySubmitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Warden Review (Approve / Reject) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Warden Gate Pass Review"
        subtitle={`Review application for ${selectedPass?.studentName} (${selectedPass?.passNo})`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          {selectedPass && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">
                  {selectedPass.studentName} ({selectedPass.studentId})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hostel & Room:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPass.hostel} • Room {selectedPass.roomNo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pass Type:</span>
                <span className="font-semibold text-indigo-700">{selectedPass.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <span className="font-semibold text-slate-800">{selectedPass.destination || 'City Center'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-700">{selectedPass.reason}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">Departure & Return:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPass.outTime} &rarr; {selectedPass.expectedInTime}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Approval Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReviewAction('APPROVED')}
                className={`py-2 px-3 rounded-md border text-center font-bold flex items-center justify-center gap-1.5 transition-all ${
                  reviewAction === 'APPROVED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Approve Pass
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('REJECTED')}
                className={`py-2 px-3 rounded-md border text-center font-bold flex items-center justify-center gap-1.5 transition-all ${
                  reviewAction === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                Reject Pass
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Warden Remarks / Instructions {reviewAction === 'REJECTED' ? '*' : '(Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={
                reviewAction === 'APPROVED'
                  ? 'e.g. Approved. Ensure strict curfew compliance.'
                  : 'e.g. Denied due to mid-semester exam schedule.'
              }
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              required={reviewAction === 'REJECTED'}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewSubmitting}
              className={`px-4 py-1.5 text-white font-semibold rounded-md shadow-xs flex items-center gap-1 disabled:opacity-50 ${
                reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {reviewSubmitting
                ? 'Processing...'
                : reviewAction === 'APPROVED'
                ? 'Confirm Approval'
                : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: View Pass & Simulated QR Verification Detail */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Gate Pass Digital Credential"
        subtitle={`Pass verification credential: ${selectedPass?.passNo}`}
      >
        {selectedPass && (
          <div className="space-y-4 text-xs">
            {/* Digital Pass Header Box */}
            <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                  CAMPUS HOSTEL PASS
                </span>
                <h3 className="text-base font-extrabold mt-1 text-white">{selectedPass.passNo}</h3>
                <p className="text-[11px] text-slate-300">
                  {selectedPass.type} • {selectedPass.hostel}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedPass.status} size="sm" />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {selectedPass.statusCode || selectedPass.status}
                </p>
              </div>
            </div>

            {/* Verification Barcode & Token Simulation */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-indigo-700 font-mono font-bold text-sm bg-white p-2.5 rounded border border-indigo-100">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>{selectedPass.qrToken || `QR-PASS-${selectedPass.id.slice(0, 8)}`}</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Authorized digital security token for main gate scanner terminal verification.
              </p>
            </div>

            {/* Pass Metadata details */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg text-slate-700">
              <div>
                <span className="text-slate-400 text-[10px]">Student Name</span>
                <p className="font-bold text-slate-900">{selectedPass.studentName}</p>
                <p className="text-[10px] text-slate-500">{selectedPass.studentId}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Hostel & Room</span>
                <p className="font-semibold text-slate-800">{selectedPass.hostel}</p>
                <p className="text-[10px] text-slate-500">Room {selectedPass.roomNo}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Departure Time</span>
                <p className="font-semibold text-slate-800">{selectedPass.outTime}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Expected Return</span>
                <p className="font-semibold text-slate-800">{selectedPass.expectedInTime}</p>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-2">
                <span className="text-slate-400 text-[10px]">Destination</span>
                <p className="font-semibold text-slate-800">{selectedPass.destination || 'City Center'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 text-[10px]">Purpose</span>
                <p className="font-medium text-slate-700">{selectedPass.reason}</p>
              </div>
              {selectedPass.approvedBy && (
                <div className="col-span-2 border-t border-slate-100 pt-2 bg-emerald-50/60 p-2 rounded">
                  <span className="text-emerald-800 text-[10px] font-bold">Warden Approval</span>
                  <p className="font-semibold text-emerald-900">Approved by {selectedPass.approvedBy}</p>
                  {selectedPass.approvedAt && (
                    <p className="text-[10px] text-emerald-700">Timestamp: {selectedPass.approvedAt}</p>
                  )}
                </div>
              )}
              {selectedPass.rejectionReason && (
                <div className="col-span-2 border-t border-slate-100 pt-2 bg-rose-50/60 p-2 rounded">
                  <span className="text-rose-800 text-[10px] font-bold">Rejection Note</span>
                  <p className="font-semibold text-rose-900">{selectedPass.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
