'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DEMO_MESS_TODAY, DEMO_MESS_TOMORROW } from '@/lib/demo-data';
import { Utensils, Calendar, Clock, CheckCircle2, Leaf, Egg } from 'lucide-react';

export default function MessPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const currentMenu = activeTab === 'today' ? DEMO_MESS_TODAY : DEMO_MESS_TOMORROW;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mess Management & Food Menu"
        subtitle="Daily dining hall menu schedule, nutritional breakdown, and meal rebate applications"
      />

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Today's Menu ({DEMO_MESS_TODAY.day} - {DEMO_MESS_TODAY.date})
        </button>
        <button
          onClick={() => setActiveTab('tomorrow')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
            activeTab === 'tomorrow'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tomorrow's Menu ({DEMO_MESS_TOMORROW.day} - {DEMO_MESS_TOMORROW.date})
        </button>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakfast */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-600" />
                Breakfast
              </h3>
              <p className="text-xs text-slate-500">07:30 AM – 09:30 AM</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200">
              Morning
            </span>
          </div>
          <div className="space-y-3">
            {currentMenu.breakfast.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    {item.isVeg ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" title="Veg" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" title="Non-Veg" />
                    )}
                    {item.name}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lunch */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-indigo-600" />
                Lunch
              </h3>
              <p className="text-xs text-slate-500">12:30 PM – 02:30 PM</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-200">
              Afternoon
            </span>
          </div>
          <div className="space-y-3">
            {currentMenu.lunch.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    {item.isVeg ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" title="Veg" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" title="Non-Veg" />
                    )}
                    {item.name}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Snacks */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Evening Snacks
              </h3>
              <p className="text-xs text-slate-500">05:00 PM – 06:15 PM</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
              Tea Time
            </span>
          </div>
          <div className="space-y-3">
            {currentMenu.snacks.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    {item.name}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dinner */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-purple-600" />
                Dinner
              </h3>
              <p className="text-xs text-slate-500">07:30 PM – 09:30 PM</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
              Night
            </span>
          </div>
          <div className="space-y-3">
            {currentMenu.dinner.map((item, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    {item.isVeg ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" title="Veg" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" title="Non-Veg" />
                    )}
                    {item.name}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
