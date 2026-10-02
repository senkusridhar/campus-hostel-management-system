'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Wrench,
  CreditCard,
  Utensils,
  ClipboardCheck,
  Bell,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BedDouble,
  Layers,
  Grid,
  UserCheck,
  Ticket,
  Clock,
  Receipt,
  FileText,
  DollarSign,
  AlertTriangle,
  Moon,
  Star,
} from 'lucide-react';
import { isRoleAllowedOnRoute, getRoleDashboardRoute, ROLE_CONFIGS } from '@/lib/permissions/rbac';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavSubItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('SUPER_ADMIN');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Hostel Management': true,
    'Gate Management': true,
    'Maintenance': true,
    'Finance': true,
    'Mess': true,
    'Attendance': true,
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: getRoleDashboardRoute(userRole),
      icon: LayoutDashboard,
    },
    {
      label: 'Students',
      href: '/students',
      icon: Users,
    },
    {
      label: 'Hostel Management',
      icon: Building2,
      children: [
        { label: 'Hostels', href: '/hostels', icon: Building2 },
        { label: 'Blocks', href: '/blocks', icon: Layers },
        { label: 'Floors', href: '/floors', icon: Grid },
        { label: 'Rooms', href: '/rooms', icon: BedDouble },
        { label: 'Room Allocation', href: '/room-allocation', icon: UserCheck },
      ],
    },
    {
      label: 'Gate Management',
      icon: ShieldCheck,
      children: [
        { label: 'Gate Passes', href: '/gate-passes', icon: Ticket },
        { label: 'Gate Activity', href: '/gate-activity', icon: Clock },
      ],
    },
    {
      label: 'Maintenance',
      icon: Wrench,
      children: [
        { label: 'Complaints', href: '/complaints', icon: AlertTriangle },
        { label: 'Maintenance Tickets', href: '/maintenance', icon: Wrench },
      ],
    },
    {
      label: 'Finance',
      icon: CreditCard,
      children: [
        { label: 'Fees', href: '/fees', icon: DollarSign },
        { label: 'Invoices', href: '/invoices', icon: FileText },
        { label: 'Payments', href: '/payments', icon: CreditCard },
        { label: 'Fines', href: '/fines', icon: AlertTriangle },
        { label: 'Receipts', href: '/receipts', icon: Receipt },
      ],
    },
    {
      label: 'Mess',
      icon: Utensils,
      children: [
        { label: 'Menu', href: '/mess', icon: Utensils },
        { label: 'Meal Rebates', href: '/meal-rebates', icon: FileText },
      ],
    },
    {
      label: 'Feedback',
      icon: Star,
      children: [
        { label: 'Monthly Feedback', href: '/feedback/monthly', icon: Star },
        { label: 'Feedback Analytics', href: '/feedback/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Attendance',
      icon: ClipboardCheck,
      children: [
        { label: 'Night Roll Call', href: '/night-roll-call', icon: Moon },
        { label: 'Attendance Records', href: '/attendance', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Notices',
      href: '/notices',
      icon: Bell,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  // Filter navigation items by active user role
  const navItems = allNavItems
    .map((item) => {
      if (item.children) {
        const allowedChildren = item.children.filter((child) =>
          isRoleAllowedOnRoute(userRole, child.href)
        );
        if (allowedChildren.length === 0) return null;
        return { ...item, children: allowedChildren };
      }
      if (item.href && !isRoleAllowedOnRoute(userRole, item.href)) {
        return null;
      }
      return item;
    })
    .filter(Boolean) as NavItem[];

  const isLinkActive = (href?: string) => {
    if (!href) return false;
    if (href.startsWith('/dashboard') && pathname.startsWith('/dashboard')) return true;
    return pathname === href;
  };

  const isGroupActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.href);
  };

  const portalTitle = ROLE_CONFIGS[userRole]?.portalName || 'Campus HMS';

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            H
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-bold text-slate-100 text-sm leading-tight">Campus HMS</h1>
              <p className="text-[10px] text-indigo-300 font-medium tracking-wide uppercase">
                {portalTitle}
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="md:hidden text-slate-400 hover:text-white p-1"
          aria-label="Close Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;

          // Single Link Item
          if (!item.children) {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                onClick={onMobileClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          // Group Parent Item
          const groupActive = isGroupActive(item);
          const isOpen = openGroups[item.label] ?? false;

          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => toggleGroup(item.label)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  groupActive
                    ? 'text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && (
                  isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )
                )}
              </button>

              {/* Sub items */}
              {!collapsed && isOpen && (
                <div className="pl-9 pr-1 space-y-1">
                  {item.children.map((child) => {
                    const active = isLinkActive(child.href);
                    const SubIcon = child.icon;
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          active
                            ? 'bg-slate-800 text-indigo-400 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        {SubIcon && <SubIcon className="w-3.5 h-3.5" />}
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer info / Collapse button */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        {!collapsed && (
          <div className="truncate">
            <p className="font-semibold text-slate-300 truncate">National Institute of Tech</p>
            <p className="text-[10px] text-slate-500">v1.0.0 (Academic 2026-27)</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
