'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState } from '@/components/ui/StateFeedback';
import { ShieldCheck, Clock, Plus, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';

interface GateActivityItem {
  id: string;
  gatePassId?: string;
  passNo?: string;
  studentName: string;
  studentId: string;
  rollNo?: string;
  hostel: string;
  roomNo: string;
  gate: string;
  type: string;
  timestamp: string;
  status: string;
  remarks?: string;
  verifiedByName?: string;
}

interface ApprovedPassOption {
  id: string;
  passNo: string;
  studentName: string;
  studentId: string;
  type: string;
  status: string;
}

export default function GateActivityPage() {
  const [activities, setActivities] = useState<GateActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('SECURITY');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Record Movement Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [approvedPasses, setApprovedPasses] = useState<ApprovedPassOption[]>([]);
  const [recordMovementType, setRecordMovementType] = useState<'CHECK_OUT' | 'CHECK_IN'>('CHECK_OUT');
  const [selectedPassId, setSelectedPassId] = useState('');
  const [customStudentId, setCustomStudentId] = useState('');
  const [selectedGate, setSelectedGate] = useState('Main Gate');
  const [recordRemarks, setRecordRemarks] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  // Status notification
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

  // Fetch gate activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set('type', typeFilter);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/gate-activity?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load gate activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [typeFilter, searchQuery]);

  // Load active/approved gate passes for quick selection in modal
  const loadApprovedPasses = async () => {
    try {
      const res = await fetch('/api/gate-passes');
      const data = await res.json();
      if (data.success && Array.isArray(data.gatePasses)) {
        setApprovedPasses(
          data.gatePasses.filter(
            (p: any) => p.status === 'Approved' || p.status === 'Active' || p.status === 'Pending'
          )
        );
      }
    } catch (err) {
      console.warn('Could not prefetch approved passes:', err);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);

    if (!selectedPassId && !customStudentId.trim()) {
      setRecordError('Please select a gate pass or enter a valid Student ID.');
      return;
    }

    try {
      setRecordSubmitting(true);
      const res = await fetch('/api/gate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatePassId: selectedPassId || undefined,
          studentId: customStudentId.trim() || undefined,
          activityType: recordMovementType,
          gate: selectedGate,
          remarks: recordRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record gate movement.');
      }

      setIsRecordModalOpen(false);
      setSelectedPassId('');
      setCustomStudentId('');
      setRecordRemarks('');
      setStatusMessage({
        text: `Successfully recorded ${recordMovementType === 'CHECK_OUT' ? 'Check-out' : 'Check-in'} for student ${data.activity?.studentName || ''} at ${selectedGate}.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 5000);
      fetchActivities();
    } catch (err: any) {
      setRecordError(err.message || 'An error occurred while recording movement.');
    } finally {
      setRecordSubmitting(false);
    }
  };

  const filteredActivity = activities.filter((act) => {
    if (typeFilter && act.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
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
        actions={
          <div className="flex items-center gap-2">
            {(userRole === 'SECURITY' || userRole === 'SUPER_ADMIN') && (
              <button
                onClick={() => {
                  setRecordError(null);
                  loadApprovedPasses();
                  setIsRecordModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Record Movement
              </button>
            )}
          </div>
        }
      />

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
        {loading ? (
          <div className="p-8">
            <LoadingState message="Synchronizing gate entry and exit ledger..." />
          </div>
        ) : filteredActivity.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Movement Logs Found"
              description={
                searchQuery || typeFilter
                  ? 'No gate logs match the specified search parameters.'
                  : 'No entry/exit activity has been recorded yet.'
              }
            />
          </div>
        ) : (
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
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {act.rollNo || act.studentId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {act.hostel} - Rm {act.roomNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{act.gate}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold ${
                          act.type === 'Check-in' || act.type === 'CHECK_IN'
                            ? 'text-indigo-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {act.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-500">{act.timestamp}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={act.status || 'Verified'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Movement Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Security Gate Movement"
        subtitle="Process manual or scanned gate verification for resident check-in / check-out"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          {recordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{recordError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Movement Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRecordMovementType('CHECK_OUT')}
                className={`py-2 px-3 rounded-md border text-center font-bold flex items-center justify-center gap-1.5 transition-all ${
                  recordMovementType === 'CHECK_OUT'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Check-Out (Exit)
              </button>
              <button
                type="button"
                onClick={() => setRecordMovementType('CHECK_IN')}
                className={`py-2 px-3 rounded-md border text-center font-bold flex items-center justify-center gap-1.5 transition-all ${
                  recordMovementType === 'CHECK_IN'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Check-In (Entry)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Active Gate Pass</label>
            <select
              value={selectedPassId}
              onChange={(e) => {
                setSelectedPassId(e.target.value);
                if (e.target.value) setCustomStudentId('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Choose from approved passes or enter ID below --</option>
              {approvedPasses.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.passNo} - {p.studentName} ({p.studentId}) [{p.type}] - Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Or Enter Student Reg ID / QR Token
            </label>
            <input
              type="text"
              placeholder="e.g. STU2024012"
              value={customStudentId}
              onChange={(e) => {
                setCustomStudentId(e.target.value);
                if (e.target.value) setSelectedPassId('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Security Gate Location *</label>
            <select
              value={selectedGate}
              onChange={(e) => setSelectedGate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="Main Gate">Main Gate Security Post</option>
              <option value="North Gate">North Gate Terminal</option>
              <option value="South Gate">South Gate Vehicle Barrier</option>
              <option value="Hostel Block Turnstile">Hostel Block Turnstile</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verification Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Verified photo ID and vehicle registration"
              value={recordRemarks}
              onChange={(e) => setRecordRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-md hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordSubmitting}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md shadow-xs flex items-center gap-1 disabled:opacity-50"
            >
              {recordSubmitting ? 'Logging Scan...' : 'Record & Verify Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
