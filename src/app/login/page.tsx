'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Building2,
  Users,
  UserCheck,
  CreditCard,
  Wrench,
  Lock,
  ArrowRight,
} from 'lucide-react';

export default function LoginPortalSelectorPage() {
  const portals = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Admin',
      subtitle: 'System administration, user management, audit logs',
      href: '/login/admin',
      icon: Shield,
      email: 'admin@campushms.local',
    },
    {
      role: 'WARDEN',
      title: 'Hostel Warden',
      subtitle: 'Resident welfare, room allocation, roll calls, passes',
      href: '/login/warden',
      icon: Building2,
      email: 'warden@campushms.local',
    },
    {
      role: 'STUDENT',
      title: 'Student Portal',
      subtitle: 'Room details, pass applications, fees & mess menu',
      href: '/login/student',
      icon: Users,
      email: 'student@campushms.local',
    },
    {
      role: 'PARENT',
      title: 'Parent Portal',
      subtitle: 'Linked student profile, attendance & fee receipts',
      href: '/login/parent',
      icon: UserCheck,
      email: 'parent@campushms.local',
    },
    {
      role: 'SECURITY',
      title: 'Campus Security',
      subtitle: 'Gate pass check-in/out verification & curfew alerts',
      href: '/login/security',
      icon: Lock,
      email: 'security@campushms.local',
    },
    {
      role: 'FINANCE',
      title: 'Finance & Accounts',
      subtitle: 'Fee structures, billing, payment verification & fines',
      href: '/login/finance',
      icon: CreditCard,
      email: 'finance@campushms.local',
    },
    {
      role: 'MAINTENANCE',
      title: 'Facilities Maintenance',
      subtitle: 'Work order dispatches & repair status tracking',
      href: '/login/maintenance',
      icon: Wrench,
      email: 'maintenance@campushms.local',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xl mx-auto mb-3 shadow-sm">
            H
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus HMS Login Portals</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Select your assigned institutional role portal to sign in using your campus credentials
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
            <span>Development Password for all accounts:</span>
            <code className="bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded font-mono font-bold">CampusHMS@2026</code>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.role}
                href={portal.href}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-400 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-900 text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {portal.role.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{portal.subtitle}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span className="text-[10px] text-slate-400 font-mono">{portal.email}</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
