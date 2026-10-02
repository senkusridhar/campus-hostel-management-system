import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Hostel Management System - Higher Education Institution',
  description: 'Enterprise hostel operations, bed allocation, gate passes, and student welfare administration system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
