'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateFeedback';
import {
  BedDouble,
  Ticket,
  AlertTriangle,
  CreditCard,
  Utensils,
  CheckCircle,
  ArrowRightLeft,
  Users,
  Building,
  Layers,
  Calendar,
  Info,
  Star,
  Bell,
  RefreshCw,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { StudentSelfServiceOverview } from '@/types';

export default function StudentDashboardPage() {
  const [overview, setOverview] = useState<StudentSelfServiceOverview | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [selectedPreferredRoom, setSelectedPreferredRoom] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [changeComment, setChangeComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [overviewRes, roomsRes] = await Promise.all([
        fetch('/api/student/overview'),
        fetch('/api/rooms'),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
      }
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        if (rData.rooms) {
          const available = rData.rooms.filter(
            (r: any) => r.occupied < r.capacity && r.status !== 'MAINTENANCE'
          );
          setAvailableRooms(available);
          if (available[0]) setSelectedPreferredRoom(available[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load student self-service info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const handleRoomChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/room-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredRoomId: selectedPreferredRoom,
          reason: changeReason,
          comment: changeComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsChangeModalOpen(false);
        setChangeReason('');
        setChangeComment('');
        setNotification({ text: data.message || 'Room change request submitted successfully.' });
        setTimeout(() => setNotification(null), 4000);
        await fetchStudentData();
      } else {
        setNotification({ text: data.error || 'Failed to submit request.', isError: true });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({ text: 'Network error submitting request.', isError: true });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const profile = overview?.profile;
  const room = overview?.room;
  const roommates = room?.roommates || [];
  const pendingChange = overview?.pendingRoomChange;
  const complaintsSummary = overview?.complaintsSummary || {
    myComplaintsCount: 1,
    openCount: 0,
    resolvedCount: 1,
    pendingRatingCount: 0,
  };
  const feedbackStatus = overview?.monthlyFeedbackStatus || {
    submittedCurrentMonth: true,
    currentMonth: 10,
    currentYear: 2026,
    rating: 5,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-xs">
              STUDENT PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">{profile?.email || 'student@campushms.local'}</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Welcome, {profile?.name || 'Rahul Kumar'}</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {profile?.studentId || 'STU2024012'} • {profile?.department || 'Computer Science & Engineering'} ({profile?.academicYear || '3rd Year'}) • Room {room?.roomNumber || '101'} ({room?.hostelName || 'Boys Hostel A'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStudentData}
            title="Refresh Student Overview"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/gate-passes"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Ticket className="w-3.5 h-3.5" />
            Apply Gate Pass
          </Link>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-md text-xs flex items-center gap-2 border ${
            notification.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Bed Assignment"
          value={room?.bedNumber || '101-A'}
          icon={BedDouble}
          subtitle={`${room?.hostelName || 'Boys Hostel A'} • ${room?.blockName || 'Block A'}`}
        />
        <StatCard
          title="Active Pass"
          value={overview?.gatePassSummary?.recentStatus === 'Approved' ? 'GP-2026-0981' : 'None Active'}
          icon={Ticket}
          badge={{
            text: overview?.gatePassSummary?.recentStatus === 'Approved' ? 'Valid Today' : 'No Pass',
            type: overview?.gatePassSummary?.recentStatus === 'Approved' ? 'positive' : 'neutral',
          }}
        />
        <StatCard
          title="Semester Dues"
          value={overview?.feesSummary?.dueAmount === 0 ? '₹0' : `₹${overview?.feesSummary?.dueAmount}`}
          icon={CreditCard}
          badge={{
            text: overview?.feesSummary?.dueAmount === 0 ? 'All Paid' : 'Pending Due',
            type: overview?.feesSummary?.dueAmount === 0 ? 'positive' : 'warning',
          }}
        />
        <StatCard
          title="My Complaints"
          value={`${complaintsSummary.myComplaintsCount} Ticket${complaintsSummary.myComplaintsCount !== 1 ? 's' : ''}`}
          icon={AlertTriangle}
          badge={{
            text: complaintsSummary.openCount > 0 ? `${complaintsSummary.openCount} Open` : 'All Resolved',
            type: complaintsSummary.openCount > 0 ? 'warning' : 'positive',
          }}
        />
      </div>

      {/* MY ROOM RESIDENTIAL PROFILE CARD */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-900">
                My Room: Room {room?.roomNumber || '101'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {room?.hostelName || 'Boys Hostel A'} • {room?.blockName || 'Block A'} • Floor {room?.floorNumber || 1}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {pendingChange ? (
              <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Change In Review (Room {pendingChange.preferredRoomNumber})
              </span>
            ) : (
              <button
                onClick={() => setIsChangeModalOpen(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Request Room Change
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Column 1: Details */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Hostel Complex</span>
              <span className="font-bold text-slate-900">{room?.hostelName || 'Boys Hostel A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Block & Floor</span>
              <span className="font-bold text-slate-900">
                {room?.blockName || 'Block A'}, Floor {room?.floorNumber || 1}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Room Type</span>
              <span className="font-bold text-slate-900">Double Occupancy</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Allotment Date</span>
              <span className="font-bold text-slate-900">
                {room?.allocatedAt
                  ? new Date(room.allocatedAt).toLocaleDateString()
                  : '01 Aug 2026'}
              </span>
            </div>
          </div>

          {/* Column 2: Occupancy & Room Capacity */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Room Capacity & Beds
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {room?.occupied || 2} / {room?.capacity || 2}
                </span>
                <span className="text-xs text-slate-500 font-medium">Beds Occupied</span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      ((room?.occupied || 2) / (room?.capacity || 2)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">My Assigned Bed:</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900">
                {room?.bedNumber || '101-A'}
              </span>
            </div>
          </div>

          {/* Column 3: Roommates */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Roommates ({roommates.length})
            </h4>

            {roommates.length > 0 ? (
              <div className="space-y-2">
                {roommates.map((rm: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{rm.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {rm.studentId} • {rm.department}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded">
                      {rm.bedNumber || '101-B'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-100">
                No other roommates currently assigned to this room.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards: Mess, Gate Pass, Complaints, Monthly Feedback, Receipts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mess Menu */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-600" />
              Today's Mess Menu
            </h3>
            <p className="text-[11px] text-slate-600 font-semibold">Lunch (12:30 PM - 02:30 PM)</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Paneer Butter Masala, Dal Tadka, Steamed Rice, Butter Roti & Gulab Jamun
            </p>
          </div>
          <Link href="/mess" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            View Full Menu &rarr;
          </Link>
        </div>

        {/* Gate Pass */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-indigo-600" />
              Gate Pass Application
            </h3>
            <p className="text-[11px] text-slate-700 font-bold">
              {overview?.gatePassSummary?.recentStatus === 'Approved' ? 'Day Pass (Local Market Visit)' : 'No Active Gate Pass'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Approved by Warden Dr. Ramesh</p>
          </div>
          <Link href="/gate-passes" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            Manage Passes &rarr;
          </Link>
        </div>

        {/* Complaints & Voting */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Complaints & Voting
            </h3>
            <p className="text-[11px] text-slate-700 font-bold">
              {complaintsSummary.myComplaintsCount} Logged • {complaintsSummary.openCount} In Progress
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Support tickets & rate resolution</p>
          </div>
          <Link href="/complaints" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            View & Vote &rarr;
          </Link>
        </div>

        {/* Monthly Feedback */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              Monthly Resident Feedback
            </h3>
            <p className="text-[11px] text-slate-700 font-bold">
              {feedbackStatus.submittedCurrentMonth ? 'Submitted for October' : 'Feedback Cycle Open'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Rate food, staff & cleanliness</p>
          </div>
          <Link href="/feedback/monthly" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            {feedbackStatus.submittedCurrentMonth ? 'View Submitted Feedback →' : 'Submit Monthly Rating →'}
          </Link>
        </div>
      </div>

      {/* Request Room Change Modal */}
      <Modal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        title="Request Room Change"
        subtitle="Submit a formal room change request to hostel warden office"
      >
        <form onSubmit={handleRoomChangeSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Current Allotment
            </span>
            <span className="font-bold text-slate-900">
              Room {room?.roomNumber || '101'} ({room?.hostelName || 'Boys Hostel A'} - {room?.blockName || 'Block A'})
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Preferred Room</label>
            <select
              required
              value={selectedPreferredRoom}
              onChange={(e) => setSelectedPreferredRoom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              {availableRooms
                .filter((r) => r.id !== room?.roomNumber && r.roomNumber !== room?.roomNumber)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomType}) — {r.hostelName} • {r.block} • Floor {r.floor} [Available:{' '}
                    {r.capacity - r.occupied} / {r.capacity}]
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Room Change</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical request for lower floor / Academic peer study"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Additional Comments (Optional)</label>
            <textarea
              rows={2}
              placeholder="Doctor advice note or study branch requirement details..."
              value={changeComment}
              onChange={(e) => setChangeComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsChangeModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
            >
              {actionLoading ? 'Submitting...' : 'Submit Change Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
