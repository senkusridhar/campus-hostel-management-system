'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isAuthOrStandalone =
    pathname.startsWith('/login') ||
    pathname.startsWith('/unauthorized');

  if (isAuthOrStandalone) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      <div className="flex flex-1 min-h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
