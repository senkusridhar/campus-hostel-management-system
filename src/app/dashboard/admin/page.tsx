'use client';

import React, { useState, useEffect } from 'react';
import DashboardPage from '../page';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Shield,
  Users,
  Building,
  FileText,
  Settings,
  Key,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { UserManagementItem, AdminOverviewStats } from '@/types';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserManagementItem[]>([]);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, overviewRes] = await Promise.all([
        fetch(`/api/admin/users?role=${selectedRole === 'ALL' ? '' : selectedRole}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`),
        fetch('/api/admin/overview'),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (overviewRes.ok) {
        const oData = await overviewRes.json();
        setStats(oData.overview || null);
      }
    } catch (err) {
      console.warn('Failed to load admin governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRole, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ text: data.message || `Status updated for ${userName}.` });
        setTimeout(() => setNotification(null), 4000);
        await fetchData();
      } else {
        setNotification({ text: data.error || 'Failed to update user status.', isError: true });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      setNotification({ text: 'Network error updating user.', isError: true });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-xs">
              SUPER_ADMIN
            </span>
            <span className="text-xs text-slate-400 font-mono">admin@campushms.local</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-2">Super Admin Governance Portal</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Institutional governance, user access management, warden assignments, system configuration & security audit logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-md border border-slate-700 transition-colors flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            System Settings
          </Link>
          <Link href="/reports" className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Audit Logs
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

      {/* Governance & User Accounts Operational Console */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Institutional User Accounts & Role Control
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify active user privileges, audit credentials & manage system access permissions
            </p>
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search user / email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 text-xs pl-7 pr-3 py-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </form>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="WARDEN">Warden</option>
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SECURITY">Security</option>
              <option value="FINANCE">Finance</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>

            <button
              onClick={fetchData}
              title="Refresh User Ledger"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {user.phone || '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="text-[11px] text-slate-400 font-medium italic">Master Admin</span>
                    ) : (
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive, user.name)}
                        disabled={actionLoadingId === user.id}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          user.isActive
                            ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {actionLoadingId === user.id ? (
                          'Updating...'
                        ) : user.isActive ? (
                          <span className="flex items-center gap-1"><UserX className="w-3 h-3" /> Deactivate</span>
                        ) : (
                          <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> Activate</span>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                    No users matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Main Overview Dashboard */}
      <DashboardPage />
    </div>
  );
}

