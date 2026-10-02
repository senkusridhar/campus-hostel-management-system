'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Building, Sliders, Bell, Calendar, Shield, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'institution' | 'hostel' | 'academic' | 'notifications' | 'system'>('institution');

  return (
    <div className="space-y-6">
      <PageHeader
        title="HMS Settings & Administration"
        subtitle="Institution rules, curfew parameters, mess configuration, and system preferences"
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('institution')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'institution'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Institution Settings
        </button>
        <button
          onClick={() => setActiveTab('hostel')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'hostel'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Hostel Configuration
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'academic'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Academic Year
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Notification Preferences
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-3.5 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'system'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          System Preferences
        </button>
      </div>

      {/* Settings Form Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm max-w-4xl">
        {activeTab === 'institution' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Institution Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  defaultValue="National Institute of Technology & Engineering"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Code</label>
                <input
                  type="text"
                  defaultValue="NITE-MAIN"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Warden Contact Email</label>
                <input
                  type="email"
                  defaultValue="chiefwarden@institution.edu.in"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Security Desk Helpline</label>
                <input
                  type="text"
                  defaultValue="+91 (011) 2345 6789"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hostel' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Hostel & Gate Curfew Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weeknight Curfew Timing</label>
                <input
                  type="text"
                  defaultValue="10:00 PM"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weekend Curfew Timing</label>
                <input
                  type="text"
                  defaultValue="10:30 PM"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gate Pass Request Cutoff</label>
                <input
                  type="text"
                  defaultValue="06:00 PM (Same Day)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Night Roll Call Deadline</label>
                <input
                  type="text"
                  defaultValue="10:45 PM"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Academic Year & Session</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Active Academic Session</label>
                <input
                  type="text"
                  defaultValue="2026 – 2027 (Autumn Semester)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester Start Date</label>
                <input
                  type="date"
                  defaultValue="2026-08-01"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Notification & SMS Channels</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-700 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                Send instant SMS alert to guardian on unexcused night curfew absence
              </label>
              <label className="flex items-center gap-2 text-slate-700 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                Email warden whenever critical electrical or plumbing complaint is logged
              </label>
              <label className="flex items-center gap-2 text-slate-700 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                Notify student 3 days prior to mess fee invoice due date
              </label>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-3 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">System Maintenance & Logs</h3>
            <p className="text-slate-500">UI configuration mode enabled. Settings are currently pre-populated for demonstration.</p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Save Configuration (Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
