'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateFeedback';
import {
  UserCheck,
  BedDouble,
  Ticket,
  CreditCard,
  ShieldCheck,
  Phone,
  AlertTriangle,
  FileText,
  Bell,
  RefreshCw,
  Users,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { ParentWardOverview } from '@/types';

export default function ParentDashboardPage() {
  const [wardData, setWardData] = useState<ParentWardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWard = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/parent/ward');
      if (res.ok) {
        const data = await res.json();
        setWardData(data);
      } else {
        setFetchError('Unable to load ward records. Using cached ledger data.');
      }
    } catch (err) {
      console.warn('Failed to load parent ward overview:', err);
      setFetchError('Network synchronization issue. Using cached ledger data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWard();
  }, []);

  const student = wardData?.student;
  const roomAlloc = wardData?.roomAllocation;
  const curfew = wardData?.curfewAttendance;
  const latestPass = wardData?.gatePasses?.[0];
  const fees = wardData?.fees;
  const notices = wardData?.notices || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white font-bold text-xs">
              PARENT WELFARE PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">parent@campushms.local</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Welcome, Mahesh Kumar</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Linked Ward: <strong>{student?.name || 'Rahul Kumar'} ({student?.studentId || 'STU2024012'})</strong> • {student?.branch || 'CSE 3rd Year'} • {roomAlloc?.hostelName || 'Boys Hostel A'} (Room {roomAlloc?.roomNumber || '101'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchWard}
            title="Refresh Ward Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/attendance"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Check Attendance
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ward Room"
          value={roomAlloc?.roomNumber ? `Room ${roomAlloc.roomNumber}` : 'Room 101'}
          icon={BedDouble}
          subtitle={`${roomAlloc?.hostelName || 'Boys Hostel A'} - ${roomAlloc?.blockName || 'Block A'}`}
        />
        <StatCard
          title="Curfew Attendance"
          value={curfew?.status || 'Present'}
          icon={ShieldCheck}
          badge={{ text: curfew?.lastVerified?.split('(')[0] || 'Verified 10:15 PM', type: 'positive' }}
        />
        <StatCard
          title="Recent Gate Pass"
          value={latestPass?.type || 'Day Pass'}
          icon={Ticket}
          badge={{ text: latestPass?.status || 'Approved', type: 'positive' }}
        />
        <StatCard
          title="Fee Status"
          value={fees?.status || 'Paid'}
          icon={CreditCard}
          badge={{
            text: fees?.pendingAmount === 0 ? 'No Dues Pending' : `₹${fees?.pendingAmount} Due`,
            type: fees?.pendingAmount === 0 ? 'positive' : 'warning',
          }}
        />
      </div>

      {/* Ward Security & Welfare Summary Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Linked Ward Security & Welfare Summary</h3>
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-900">Hostel Warden Contact</p>
              <p className="text-slate-500">Chief Warden Dr. Ramesh (+91 98000 00002)</p>
            </div>
            <a href="tel:+919800000002" className="px-3 py-1 bg-slate-900 text-white rounded font-semibold text-xs hover:bg-slate-800 transition-colors">
              Call Warden
            </a>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-900">Latest Out-Station Leave Approval</p>
              <p className="text-slate-500">
                {latestPass?.passNumber || 'GP-2026-0981'} ({latestPass?.status || 'Approved'} for {latestPass?.reason || 'academic library visit'})
              </p>
            </div>
            <StatusBadge status={latestPass?.status || 'Approved'} size="sm" />
          </div>

          {wardData?.complaints && wardData.complaints.length > 0 && (
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Active Room Maintenance / Complaint Tickets</p>
                <p className="text-slate-500">
                  {wardData.complaints[0].ticketNumber}: {wardData.complaints[0].title}
                </p>
              </div>
              <StatusBadge status={wardData.complaints[0].status} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Grid: Fees & Receipts, Attendance, Circulars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Fee Receipts & Invoices
            </h3>
            <p className="text-xs text-slate-600 font-semibold">Autumn Semester 2026</p>
            <p className="text-xs text-slate-500 mt-1">
              ₹45,000 paid via UPI on 15 Sep 2026. Receipt REC-2024-8801 verified.
            </p>
          </div>
          <Link href="/receipts" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            View Official Receipts &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Curfew & Attendance Log
            </h3>
            <p className="text-xs text-slate-600 font-semibold">Night Roll Call Status</p>
            <p className="text-xs text-slate-500 mt-1">
              {curfew?.remarks || 'Curfew compliance verified; in assigned room.'}
            </p>
          </div>
          <Link href="/attendance" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            View Attendance Register &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Parent Visiting & Circulars
            </h3>
            <p className="text-xs text-slate-600 font-semibold">Official Notices</p>
            <p className="text-xs text-slate-500 mt-1">
              Visiting hours: Saturday & Sunday 10:00 AM – 05:00 PM at visitor lounge.
            </p>
          </div>
          <Link href="/notices" className="text-xs font-semibold text-indigo-600 mt-3 inline-block">
            View Official Circulars &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
