'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DEMO_NOTICES } from '@/lib/demo-data';
import { Bell, Calendar, Users, FileText } from 'lucide-react';

export default function NoticesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filteredNotices = DEMO_NOTICES.filter((n) => {
    if (categoryFilter && n.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !n.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Circulars & Notices"
        subtitle="Official institution announcements, mess schedules, maintenance alerts, and warden notices"
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search notice title or content..."
        filters={[
          {
            key: 'category',
            placeholder: 'All Categories',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'General', value: 'General' },
              { label: 'Mess', value: 'Mess' },
              { label: 'Maintenance', value: 'Maintenance' },
              { label: 'Discipline', value: 'Discipline' },
              { label: 'Fees', value: 'Fees' },
            ],
          },
        ]}
      />

      {/* Notice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {notice.category}
                </span>
                <StatusBadge status={notice.status} size="sm" />
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{notice.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{notice.content}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Published: {notice.publishedDate}
              </span>
              <span className="flex items-center gap-1 text-slate-600 font-semibold">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Audience: {notice.audience}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
