'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/StateFeedback';
import { DEMO_GATE_PASSES, DEMO_COMPLAINTS } from '@/lib/demo-data';
import {
  Building2,
  Ticket,
  AlertTriangle,
  Moon,
  BedDouble,
  ArrowRightLeft,
  Wrench,
  Package,
  Layers,
  CheckCircle,
  DoorOpen,
  ArrowRight,
  RefreshCw,
  Bell,
  Star,
  Users,
} from 'lucide-react';
import Link from 'next/link';

export default function WardenDashboardPage() {
  const [stats, setStats] = useState({
    totalRooms: 120,
    occupiedRooms: 83,
    partiallyOccupiedRooms: 21,
    vacantRooms: 12,
    maintenanceRooms: 4,
    totalBeds: 420,
    occupiedBeds: 356,
    availableBeds: 64,
    pendingChangeRequests: 2,
    damagedAssetsCount: 3,
  });

  const [complaints, setComplaints] = useState<any[]>(DEMO_COMPLAINTS);
  const [feedbackAvg, setFeedbackAvg] = useState<number>(4.4);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [statsRes, complaintsRes, feedbackRes] = await Promise.all([
        fetch('/api/warden/room-stats'),
        fetch('/api/complaints'),
        fetch('/api/monthly-feedback/analytics?month=10&year=2026'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }

      if (complaintsRes.ok) {
        const cData = await complaintsRes.json();
        if (cData.complaints && cData.complaints.length > 0) {
          setComplaints(cData.complaints);
        }
      }

      if (feedbackRes.ok) {
        const fData = await feedbackRes.json();
        if (fData.analytics?.overallAverage) {
          setFeedbackAvg(fData.analytics.overallAverage);
        }
      }
    } catch (err) {
      console.warn('Failed to load warden room stats:', err);
      setFetchError('Using cached hostel occupancy metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-600 text-white font-bold text-xs">
              WARDEN PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">warden@campushms.local</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Boys Hostel A - Warden Dashboard</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Dr. Ramesh Chandra • Resident welfare, room allocations, gate passes & curfew attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            title="Refresh Warden Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/night-roll-call"
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Moon className="w-3.5 h-3.5" />
            Night Roll Call
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Residents"
          value={String(stats.occupiedBeds)}
          subtitle={`${stats.totalRooms} Rooms configured`}
          icon={Building2}
          badge={{ text: "Boys Hostel A", type: "neutral" }}
        />
        <StatCard
          title="Pending Gate Passes"
          value="18"
          subtitle="Awaiting review & signature"
          icon={Ticket}
          badge={{ text: "Action Needed", type: "warning" }}
        />
        <StatCard
          title="Transfer Requests"
          value={String(stats.pendingChangeRequests)}
          subtitle="Inter-room reallocations"
          icon={ArrowRightLeft}
          badge={{ text: stats.pendingChangeRequests > 0 ? "In Review" : "Clear", type: stats.pendingChangeRequests > 0 ? "warning" : "positive" }}
        />
        <StatCard
          title="Maintenance Rooms"
          value={String(stats.maintenanceRooms)}
          subtitle={`${stats.damagedAssetsCount} damaged asset items`}
          icon={Wrench}
          badge={{ text: stats.maintenanceRooms > 0 ? "Active Repairs" : "Normal", type: stats.maintenanceRooms > 0 ? "danger" : "positive" }}
        />
      </div>

      {/* HOSTEL ROOM & BED OCCUPANCY SUMMARY */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-slate-700" />
              Hostel Room & Bed Allocation Statistics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time occupancy tracking, bed utilization, and room health breakdown
            </p>
          </div>
          <Link
            href="/rooms"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Open Room Matrix Grid &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center mb-5">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rooms</span>
            <span className="text-xl font-black text-slate-900">{stats.totalRooms}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Full Rooms</span>
            <span className="text-xl font-black text-slate-900">{stats.occupiedRooms}</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-[10px] font-bold text-amber-600 uppercase block">Partially Occupied</span>
            <span className="text-xl font-black text-amber-900">{stats.partiallyOccupiedRooms}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Vacant Rooms</span>
            <span className="text-xl font-black text-emerald-900">{stats.vacantRooms}</span>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-[10px] font-bold text-purple-600 uppercase block">Maintenance</span>
            <span className="text-xl font-black text-purple-900">{stats.maintenanceRooms}</span>
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-600 uppercase block">Available Beds</span>
            <span className="text-xl font-black text-indigo-900">{stats.availableBeds}</span>
          </div>
        </div>

        {/* Bed Capacity Progress */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Overall Bed Occupancy</span>
              <span>
                {stats.occupiedBeds} / {stats.totalBeds} Beds (
                {Math.round((stats.occupiedBeds / (stats.totalBeds || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-slate-900 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((stats.occupiedBeds / (stats.totalBeds || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACCESS ACTIONS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/rooms"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Room Matrix</span>
            <DoorOpen className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-[11px] text-slate-500">Visual grid & room tiles</span>
        </Link>

        <Link
          href="/room-allocation"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Bed Allocation</span>
            <BedDouble className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[11px] text-slate-500">Assign new students</span>
        </Link>

        <Link
          href="/room-allocation"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Change Requests</span>
            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500">
            {stats.pendingChangeRequests} requests pending
          </span>
        </Link>

        <Link
          href="/students"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Hostel Residents</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[11px] text-slate-500">{stats.occupiedBeds} students ledger</span>
        </Link>

        <Link
          href="/feedback/analytics"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Feedback Index</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500">{feedbackAvg} ★ monthly score</span>
        </Link>

        <Link
          href="/notices"
          className="p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="font-bold text-xs text-slate-900">Hostel Notices</span>
            <Bell className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[11px] text-slate-500">Circulars & alerts</span>
        </Link>
      </div>

      {/* Existing Quick Action Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Pending Gate Pass Approvals</h3>
            <Link href="/gate-passes" className="text-xs font-semibold text-indigo-600">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {DEMO_GATE_PASSES.slice(0, 3).map((gp) => (
              <div key={gp.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {gp.studentName} ({gp.studentId})
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {gp.type} • {gp.reason}
                  </p>
                </div>
                <StatusBadge status={gp.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Complaints Logged</h3>
            <Link href="/complaints" className="text-xs font-semibold text-indigo-600">
              View All &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {complaints.slice(0, 3).map((c: any) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {c.ticketNumber || c.ticketId} - {c.title}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Room {c.room || '101'} • {c.category}
                  </p>
                </div>
                <StatusBadge status={c.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
