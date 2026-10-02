'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { MonthlyFeedbackRecord } from '@/types';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  Calendar,
  Building,
  EyeOff,
  History,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function MonthlyFeedbackPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pastFeedbacks, setPastFeedbacks] = useState<MonthlyFeedbackRecord[]>([]);

  const [month, setMonth] = useState(10); // October 2026
  const [year, setYear] = useState(2026);
  const [hostel, setHostel] = useState('hostel-bha');
  const [hostelName, setHostelName] = useState('Boys Hostel A');
  const [generalComment, setGeneralComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  // 8 Core Categories
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Food Quality': 4,
    'Food Taste': 4,
    'Mess Hygiene': 5,
    'Staff Behaviour': 5,
    'Hostel Cleanliness': 4,
    'Security': 5,
    'Maintenance': 4,
    'Overall Hostel Experience': 4,
  });

  // Staff Ratings
  const [staffRatings, setStaffRatings] = useState<Record<string, number>>({
    'Behaviour': 5,
    'Responsiveness': 4,
    'Helpfulness': 5,
    'Professionalism': 4,
  });

  const fetchPastFeedbacks = async () => {
    try {
      const res = await fetch('/api/monthly-feedback');
      const data = await res.json();
      if (data.success) {
        setPastFeedbacks(data.feedbacks);
      }
    } catch (err) {
      console.error('Failed to fetch past feedback:', err);
    }
  };

  useEffect(() => {
    fetchPastFeedbacks();
  }, []);

  const handleRatingChange = (criterion: string, score: number) => {
    setRatings((prev) => ({ ...prev, [criterion]: score }));
  };

  const handleStaffRatingChange = (criterion: string, score: number) => {
    setStaffRatings((prev) => ({ ...prev, [criterion]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formattedRatings = [
      ...Object.entries(ratings).map(([criterion, rating]) => ({
        category: criterion.includes('Food') || criterion.includes('Mess') ? 'FOOD' : criterion === 'Hostel Cleanliness' ? 'CLEANLINESS' : criterion === 'Security' ? 'SECURITY' : criterion === 'Maintenance' ? 'MAINTENANCE' : criterion === 'Staff Behaviour' ? 'STAFF' : 'EXPERIENCE',
        criterion,
        rating,
      })),
      ...Object.entries(staffRatings).map(([criterion, rating]) => ({
        category: 'STAFF',
        criterion: `Staff ${criterion}`,
        rating,
      })),
    ];

    try {
      const res = await fetch('/api/monthly-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          hostelId: hostel,
          hostelName,
          generalComment,
          isAnonymous,
          ratings: formattedRatings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit monthly feedback.');
        setLoading(false);
        return;
      }

      setSuccess('Monthly feedback recorded successfully! Thank you for contributing to hostel improvement.');
      setGeneralComment('');
      fetchPastFeedbacks();
      setLoading(false);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Monthly Hostel & Mess Feedback"
        subtitle="Submit your monthly resident experience review to evaluate food, sanitation, security, and staff responsiveness"
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Month & Hostel Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Feedback Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-semibold focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name} 2026
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hostel Building
            </label>
            <select
              value={hostel}
              onChange={(e) => {
                setHostel(e.target.value);
                setHostelName(e.target.options[e.target.selectedIndex].text);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none"
            >
              <option value="hostel-bha">Boys Hostel A</option>
              <option value="hostel-bhb">Boys Hostel B</option>
              <option value="hostel-gha">Girls Hostel A</option>
              <option value="hostel-ghb">Girls Hostel B</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Privacy Preference
            </label>
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-slate-900"
              />
              <span className="flex items-center gap-1 font-medium">
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                Anonymous to staff
              </span>
            </label>
          </div>
        </div>

        {/* Section 1: 8 Core Hostel Experience Ratings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">1. Core Hostel & Mess Experience (1 to 5 Stars)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ratings).map(([criterion, score]) => (
              <div
                key={criterion}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{criterion}</p>
                  <span className="text-[10px] text-slate-500">
                    {score === 5 ? 'Excellent' : score === 4 ? 'Good' : score === 3 ? 'Average' : score === 2 ? 'Needs Attention' : 'Poor'}
                  </span>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleRatingChange(criterion, num)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          num <= score
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Structured Staff Ratings */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">2. Hostel Support Staff Evaluation</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(staffRatings).map(([criterion, score]) => (
              <div
                key={criterion}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">Staff {criterion}</p>
                  <span className="text-[10px] text-slate-500">
                    {score === 5 ? 'Exceptional' : score >= 4 ? 'Satisfactory' : 'Requires Improvement'}
                  </span>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleStaffRatingChange(criterion, num)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          num <= score
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Optional Resident Comments */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-800">
            Detailed Monthly Observations & Suggestions <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            rows={3}
            placeholder="Share specific suggestions for mess menu changes, facility improvements, or positive feedback for staff members..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            {isAnonymous ? '🔒 Identity hidden from staff reports' : '👤 Submitting as registered resident'}
          </span>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Submitting Feedback...' : 'Submit Monthly Review'}</span>
          </button>
        </div>
      </form>

      {/* Past Submissions History */}
      {pastFeedbacks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            My Past Monthly Feedback Submissions
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {pastFeedbacks.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">
                    {months.find((m) => m.num === item.month)?.name} {item.year} — {item.hostelName}
                  </p>
                  {item.generalComment && (
                    <p className="text-slate-500 text-[11px] mt-0.5 italic">"{item.generalComment}"</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Submitted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
