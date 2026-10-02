'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { FilterBar } from '@/components/ui/FilterBar';
import {
  RoomChangeRequestItem,
  RoomAllocationHistoryItem,
  Room,
  Hostel,
} from '@/types';
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  ArrowRightLeft,
  History,
  Check,
  X,
  Search,
} from 'lucide-react';

export default function RoomAllocationPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'allocate' | 'history'>('requests');
  const [requests, setRequests] = useState<RoomChangeRequestItem[]>([]);
  const [history, setHistory] = useState<RoomAllocationHistoryItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewRequest, setReviewRequest] = useState<RoomChangeRequestItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [wardenRemarks, setWardenRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Direct Allocation Form
  const [allocForm, setAllocForm] = useState({
    studentId: 'STU2024099',
    roomId: '',
    reason: 'New regular academic year allotment',
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showNotification = (text: string, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [rcRes, histRes, rRes, hRes] = await Promise.all([
        fetch('/api/room-changes'),
        fetch('/api/allocations/history'),
        fetch('/api/rooms'),
        fetch('/api/hostels'),
      ]);

      if (rcRes.ok) {
        const rcData = await rcRes.json();
        if (rcData.requests) setRequests(rcData.requests);
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.history) setHistory(histData.history);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.rooms) {
          setRooms(rData.rooms);
          const vacantOrPartial = rData.rooms.filter((r: Room) => r.occupied < r.capacity);
          if (!allocForm.roomId && vacantOrPartial[0]) {
            setAllocForm((prev) => ({ ...prev, roomId: vacantOrPartial[0].id }));
          }
        }
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        if (hData.hostels) setHostels(hData.hostels);
      }
    } catch (err) {
      console.warn('Failed to load allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequest) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room-changes/${reviewRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: reviewDecision,
          wardenRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewRequest(null);
        setWardenRemarks('');
        showNotification(data.message || `Request ${reviewDecision.toLowerCase()} successfully.`);
        await fetchData();
      } else {
        showNotification(data.error || 'Failed to process decision.', true);
      }
    } catch (err) {
      showNotification('Network error processing request.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocForm),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Resident allocated successfully.');
        await fetchData();
        setActiveTab('history');
      } else {
        showNotification(data.error || 'Allocation rejected.', true);
      }
    } catch (err) {
      showNotification('Network error during allocation.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedRequestsCount = requests.filter((r) => r.status === 'APPROVED').length;
  const activeAllocationsCount = history.filter((h) => h.status === 'ACTIVE').length;
  const vacantBedsCount = rooms.reduce(
    (sum, r) => sum + Math.max(0, r.capacity - r.occupied),
    0
  );

  const filteredRequests = requests.filter((req) => {
    if (statusFilter && req.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !req.studentName.toLowerCase().includes(q) &&
        !req.studentRegNo.toLowerCase().includes(q) &&
        !req.currentRoomNumber.toLowerCase().includes(q) &&
        !req.preferredRoomNumber.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const filteredHistory = history.filter((h) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !h.studentName.toLowerCase().includes(q) &&
        !h.studentRegNo.toLowerCase().includes(q) &&
        !h.roomNumber.toLowerCase().includes(q) &&
        !h.hostelName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Room Allocation & Transfer Management"
          subtitle="Process new resident bed allotments, room change requests, and historical ledgers"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('allocate')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            New Bed Allotment
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
            actionMsg.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionMsg.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Transfers"
          value={String(pendingRequestsCount)}
          icon={Clock}
          badge={{ text: "Action Needed", type: "warning" }}
        />
        <StatCard
          title="Active Residents"
          value={String(activeAllocationsCount)}
          icon={UserCheck}
          badge={{ text: "Allocated", type: "positive" }}
        />
        <StatCard
          title="Vacant Beds"
          value={String(vacantBedsCount || 379)}
          icon={CheckCircle}
          badge={{ text: "Available", type: "neutral" }}
        />
        <StatCard
          title="Approved Transfers"
          value={String(approvedRequestsCount)}
          icon={ArrowRightLeft}
          badge={{ text: "Processed", type: "positive" }}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'requests'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Room Change Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('allocate')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'allocate'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Direct Bed Allocation</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'history'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Allocation History Ledger</span>
        </button>
      </div>

      {/* TAB 1: Room Change Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search student name, ID, or room number..."
            filters={[
              {
                key: 'status',
                placeholder: 'All Statuses',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'Pending', value: 'PENDING' },
                  { label: 'Approved', value: 'APPROVED' },
                  { label: 'Rejected', value: 'REJECTED' },
                  { label: 'Cancelled', value: 'CANCELLED' },
                ],
              },
            ]}
          />

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Room Change Requests Queue</h2>
              <span className="text-xs text-slate-500 font-medium">Sorted by latest submission</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Current Allocation</th>
                    <th className="py-3 px-4">Requested Allocation</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                        No room change requests found in queue.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{req.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{req.studentName}</p>
                          <p className="text-[10px] text-slate-400">
                            {req.studentRegNo} • {req.department}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600">
                          {req.currentHostelName} - Room {req.currentRoomNumber} ({req.currentBedNumber})
                        </td>
                        <td className="py-3 px-4 font-bold text-indigo-700">
                          {req.preferredHostelName} - Room {req.preferredRoomNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          <p>{req.reason}</p>
                          {req.wardenRemarks && (
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">
                              Warden Note: {req.wardenRemarks}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={req.status} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setReviewRequest(req);
                                  setReviewDecision('APPROVED');
                                  setWardenRemarks('Approved after verifying room capacity.');
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Review
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Direct Bed Allocation Form */}
      {activeTab === 'allocate' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 mb-1">New Resident Bed Allotment</h2>
          <p className="text-xs text-slate-500 mb-5">
            Assign an active student to an available room and bed. Validates gender match and room capacity.
          </p>

          <form onSubmit={handleDirectAllocation} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
              <select
                required
                value={allocForm.studentId}
                onChange={(e) => setAllocForm({ ...allocForm, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="STU2024099">Karan Mehta (STU2024099 - CSE 1st Year - Male)</option>
                <option value="stu-demo-02">Amit Verma (STU2024018 - ME 3rd Year - Male)</option>
                <option value="stu-demo-03">Vikas Sharma (STU2024033 - CE 2nd Year - Male)</option>
                <option value="stu-demo-04">Priya Sharma (STU2024051 - ECE 3rd Year - Female)</option>
                <option value="demo-student-01">Rahul Kumar (STU2024012 - CSE 3rd Year - Male)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Room</label>
              <select
                required
                value={allocForm.roomId}
                onChange={(e) => setAllocForm({ ...allocForm, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                {rooms
                  .filter((r) => r.occupied < r.capacity && r.status !== 'MAINTENANCE')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.roomType}) — {r.hostelName} • {r.block} [Available:{' '}
                      {r.capacity - r.occupied} / {r.capacity}]
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Allocation Reason / Notes</label>
              <input
                type="text"
                required
                value={allocForm.reason}
                onChange={(e) => setAllocForm({ ...allocForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
              >
                {actionLoading ? 'Allocating...' : 'Submit Bed Allotment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Allocation History Ledger */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <FilterBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search student name, ID, or room in ledger..."
            filters={[]}
          />

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Historical Allocation Ledger</h2>
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredHistory.length} ledger records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Hostel / Block</th>
                    <th className="py-3 px-4">Room & Bed</th>
                    <th className="py-3 px-4">Allotted Date</th>
                    <th className="py-3 px-4">Vacated Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Allotted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{item.studentName}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.studentRegNo} • {item.department}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{item.hostelName}</p>
                        <p className="text-[10px] text-slate-400">{item.blockName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">Room {item.roomNumber}</span>
                        <span className="block text-[10px] font-mono text-slate-500 font-medium">
                          {item.bedNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(item.allocatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {item.vacatedAt ? new Date(item.vacatedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.allocatedByName || 'Administrator'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      <Modal
        isOpen={!!reviewRequest}
        onClose={() => setReviewRequest(null)}
        title={`Review Request - ${reviewRequest?.id || ''}`}
        subtitle={`Student: ${reviewRequest?.studentName || ''} (${reviewRequest?.studentRegNo || ''})`}
      >
        {reviewRequest && (
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Current Room
                </span>
                <span className="font-bold text-slate-800">
                  Room {reviewRequest.currentRoomNumber} ({reviewRequest.currentHostelName})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Requested Room
                </span>
                <span className="font-bold text-indigo-700">
                  Room {reviewRequest.preferredRoomNumber} ({reviewRequest.preferredHostelName})
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-semibold block mb-1">Student Reason:</span>
              <p className="p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700">
                {reviewRequest.reason}
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Decision</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={reviewDecision === 'APPROVED'}
                    onChange={() => setReviewDecision('APPROVED')}
                    className="text-slate-900"
                  />
                  <span className="font-bold text-emerald-700">Approve Transfer</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={reviewDecision === 'REJECTED'}
                    onChange={() => setReviewDecision('REJECTED')}
                    className="text-slate-900"
                  />
                  <span className="font-bold text-rose-700">Reject Request</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warden Decision Remarks</label>
              <textarea
                rows={3}
                required
                value={wardenRemarks}
                onChange={(e) => setWardenRemarks(e.target.value)}
                placeholder="Enter remarks or grounds for decision..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
              >
                {actionLoading ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
