'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User as UserIcon,
  Shield,
  KeyRound,
  LogOut,
  Sliders,
  HelpCircle,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Format breadcrumbs based on active path
  const getBreadcrumb = () => {
    if (pathname === '/' || pathname === '/dashboard') return 'Dashboard / Overview';
    const parts = pathname.split('/').filter(Boolean);
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))
      .join(' / ');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AU';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            HMS
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700 capitalize">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Right: Search, Notifications & Profile */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Search Field */}
        <div className="hidden sm:flex items-center relative w-48 md:w-64">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, rooms, passes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-semibold text-slate-800">Overdue Gate Pass Alert</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Student Vikram Singh (401-BHB) exceeded curfew by 2 hours.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-semibold text-slate-800">High Priority Complaint</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Electrical spark reported in Room 101 (Boys Hostel A).
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">35 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-semibold flex items-center justify-center text-xs shadow-xs">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user ? user.name : 'Admin User'}
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                {user ? user.role.replace('_', ' ') : 'Super Administrator'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{user ? user.name : 'Admin User'}</p>
                <p className="text-[11px] text-slate-500">{user ? user.email : 'admin@campushms.local'}</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  My Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  Role & Permissions
                </button>
                <Link
                  href="/change-password"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  Change Password
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 font-medium hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
