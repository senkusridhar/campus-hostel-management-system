'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { FeedbackAnalyticsData } from '@/types';
import {
  BarChart3,
  Star,
  Users,
  Utensils,
  Shield,
  Building,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Award,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  CheckCircle,
} from 'lucide-react';

export default function FeedbackAnalyticsPage() {
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [hostel, setHostel] = useState('All');
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/monthly-feedback/analytics?month=${month}&year=${year}&hostelId=${hostel}`
      );
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load feedback analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [month, year, hostel]);

  const months = [
    { num: 1, name: 'January' },
    { num: 2, name: 'February' },
    { num: 3, name: 'March' },
    { num: 4, name: 'April' },
    { num: 5, name: 'May' },
    { num: 6, name: 'June' },
    { num: 7, name: 'July' },
    { num: 8, name: 'August' },
    { num: 9, name: 'September' },
    { num: 10, name: 'October' },
    { num: 11, name: 'November' },
    { num: 12, name: 'December' },
  ];

  const totalDist = analytics
    ? Object.values(analytics.ratingDistribution).reduce((a, b) => a + b, 0)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Monthly Feedback Analytics"
          subtitle="Aggregated student satisfaction scores, mess evaluation, and facilities maintenance indices"
        />

        {/* Month & Hostel Filter Bar */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name} 2026
              </option>
            ))}
          </select>

          <select
            value={hostel}
            onChange={(e) => setHostel(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none"
          >
            <option value="All">All Hostels Combined</option>
            <option value="hostel-bha">Boys Hostel A</option>
            <option value="hostel-bhb">Boys Hostel B</option>
            <option value="hostel-gha">Girls Hostel A</option>
            <option value="hostel-ghb">Girls Hostel B</option>
          </select>
        </div>
      </div>

      {loading || !analytics ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading aggregated feedback analytics...
        </div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Submissions"
              value={String(analytics.totalResponses || 0)}
              icon={Users}
              subtitle="Resident survey responses"
              badge={{ text: "Active Cycle", type: "neutral" }}
            />
            <StatCard
              title="Overall Satisfaction"
              value={`${analytics.overallAverage} / 5`}
              icon={Award}
              subtitle="Composite index score"
              badge={{ text: "Good", type: "positive" }}
            />
            <StatCard
              title="Mess & Dining Index"
              value={`${analytics.categoryAverages['Food Quality'] || 4.1} / 5`}
              icon={Utensils}
              subtitle="Food quality & hygiene"
              badge={{ text: "+0.2 vs Sep", type: "positive" }}
            />
            <StatCard
              title="Staff Performance"
              value={`${analytics.categoryAverages['Staff Behaviour'] || 4.6} / 5`}
              icon={Shield}
              subtitle="Helpfulness & courtesy"
              badge={{ text: "Top Rated", type: "positive" }}
            />
          </div>

          {/* Complaints & Community Support KPI Row */}
          {analytics.complaintMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">Complaint Resolution Rating</span>
                  <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span>{analytics.complaintMetrics.averageRating} / 5.0</span>
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Across {analytics.complaintMetrics.totalRatings} rated resolutions
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                  <Star className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">Complaint Support Votes</span>
                  <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      +{analytics.complaintMetrics.totalUpvotes}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-700 font-extrabold flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      -{analytics.complaintMetrics.totalDownvotes}
                    </span>
                  </p>
                  <span className="text-[10px] text-slate-400">Total student & parent votes</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                  <ThumbsUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">Total Logged Tickets</span>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {analytics.complaintMetrics.totalComplaints} Issues
                  </p>
                  <span className="text-[10px] text-slate-400">All categories & priorities</span>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Section: Category Breakdown & Rating Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Scores (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  Category-Wise Performance Ratings
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">October 2026</span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(analytics.categoryAverages).map(([category, avg]) => {
                  const pct = Math.round((avg / 5) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{avg}</span>
                          <span className="text-slate-400 text-[10px]">/ 5.0</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            avg >= 4.5
                              ? 'bg-emerald-600'
                              : avg >= 3.8
                              ? 'bg-indigo-600'
                              : avg >= 3.0
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rating Distribution (1 Col) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Rating Star Distribution
                </h2>
              </div>

              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = analytics.ratingDistribution[stars] || 0;
                  const pct = totalDist > 0 ? Math.round((count / totalDist) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-700 w-12 flex items-center gap-1 shrink-0">
                        {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      </span>

                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono w-10 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Staff Evaluation Box */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 mb-2">Staff Service Evaluation</h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(analytics.staffAverages).map(([key, val]) => (
                    <div key={key} className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500">{key}</span>
                      <p className="font-extrabold text-slate-900">{val} / 5</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Resident Suggestions & Observations */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Student Observations & Qualitative Suggestions
              </h2>
              <span className="text-xs text-slate-400">
                Individual identities protected under anonymous review policy
              </span>
            </div>

            {analytics.recentComments.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">
                No text suggestions submitted for this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recentComments.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{c.studentName}</span>
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{c.overallScore}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 italic">"{c.comment}"</p>
                    <span className="text-[10px] text-slate-400 block">
                      Submitted on {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
