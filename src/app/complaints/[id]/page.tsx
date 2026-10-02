'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Complaint } from '@/types';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  ThumbsUp,
  ThumbsDown,
  Star,
  User,
  Building,
  DoorOpen,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; role: string; name: string } | null>(null);

  // Workflow update states
  const [statusUpdate, setStatusUpdate] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Rating states
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Vote state
  const [voting, setVoting] = useState(false);

  const fetchComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      if (data.success) {
        setComplaint(data.complaint);
        setStatusUpdate(data.complaint.status);
        setResolutionNotes(data.complaint.resolutionNotes || '');
        setAssignedStaff(data.complaint.assignedStaffId || 'demo-maintenance-01');
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
    if (!complaint || (user?.role !== 'STUDENT' && user?.role !== 'PARENT')) return;
    setVoting(true);
    try {
      if (complaint.userVote === type) {
        // Remove vote
        const res = await fetch(`/api/complaints/${complaint.id}/vote`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setComplaint((prev) =>
            prev
              ? {
                  ...prev,
                  votesCount: data.votesCount,
                  upvotesCount: data.upvotesCount,
                  downvotesCount: data.downvotesCount,
                  userVote: null,
                  hasVoted: false,
                }
              : null
          );
        }
      } else {
        // Add or switch vote
        const res = await fetch(`/api/complaints/${complaint.id}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });
        const data = await res.json();
        if (data.success) {
          setComplaint((prev) =>
            prev
              ? {
                  ...prev,
                  votesCount: data.votesCount,
                  upvotesCount: data.upvotesCount,
                  downvotesCount: data.downvotesCount,
                  userVote: type,
                  hasVoted: true,
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to update vote:', err);
    } finally {
      setVoting(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setUpdating(true);
    setActionMessage('');
    setActionError('');

    try {
      const res = await fetch(`/api/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusUpdate,
          assignedToId: assignedStaff,
          resolutionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Failed to update complaint.');
        setUpdating(false);
        return;
      }

      setActionMessage('Complaint updated successfully.');
      setComplaint(data.complaint);
      setUpdating(false);
    } catch (err) {
      setActionError('Connection error. Please try again.');
      setUpdating(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;

    setSubmittingRating(true);
    setRatingError('');

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: ratingScore,
          comment: ratingComment,
          resolutionStatus: 'FULLY_RESOLVED',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRatingError(data.error || 'Failed to submit rating.');
        setSubmittingRating(false);
        return;
      }

      setComplaint((prev) => (prev ? { ...prev, rating: data.rating } : null));
      setSubmittingRating(false);
    } catch (err) {
      setRatingError('Connection error. Please try again.');
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">Complaint not found.</p>
        <Link href="/complaints" className="text-xs text-indigo-600 underline">
          Return to Complaints Register
        </Link>
      </div>
    );
  }

  const isResolvedOrClosed = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isOwner = user?.id === complaint.ownerStudentId || user?.name === complaint.studentName;
  const canManageStaff = user?.role === 'SUPER_ADMIN' || user?.role === 'WARDEN' || user?.role === 'MAINTENANCE';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/complaints" className="hover:text-slate-900 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Complaints Register
        </Link>
        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
          Ticket #{complaint.ticketId}
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                {complaint.category}
              </span>
              <span
                className={`text-xs font-extrabold ${
                  complaint.priority === 'Urgent' || complaint.priority === 'Critical'
                    ? 'text-rose-600'
                    : complaint.priority === 'High'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {complaint.priority} Priority
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">SLA: {complaint.sla || '24 Hours'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{complaint.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={complaint.status} size="md" />

            {(user?.role === 'STUDENT' || user?.role === 'PARENT') ? (
              <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
                <button
                  type="button"
                  onClick={() => handleVote('UPVOTE')}
                  disabled={voting}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    complaint.userVote === 'UPVOTE'
                      ? 'bg-emerald-100 text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-100'
                  }`}
                  title={complaint.userVote === 'UPVOTE' ? 'Click to remove upvote' : 'Upvote this complaint'}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${complaint.userVote === 'UPVOTE' ? 'fill-emerald-600' : ''}`} />
                  <span>{complaint.upvotesCount || 0}</span>
                  <span className="hidden sm:inline font-normal">Upvote</span>
                </button>
                <span className="text-slate-300 text-xs">|</span>
                <button
                  type="button"
                  onClick={() => handleVote('DOWNVOTE')}
                  disabled={voting}
                  className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    complaint.userVote === 'DOWNVOTE'
                      ? 'bg-rose-100 text-rose-800 shadow-xs'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-slate-100'
                  }`}
                  title={complaint.userVote === 'DOWNVOTE' ? 'Click to remove downvote' : 'Downvote this complaint'}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${complaint.userVote === 'DOWNVOTE' ? 'fill-rose-600' : ''}`} />
                  <span>{complaint.downvotesCount || 0}</span>
                  <span className="hidden sm:inline font-normal">Downvote</span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  {complaint.upvotesCount || 0} Upvotes
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                  {complaint.downvotesCount || 0} Downvotes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">Reported By</span>
            <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {complaint.studentName} ({complaint.studentId})
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">Hostel & Room Location</span>
            <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {complaint.hostel} • Rm {complaint.room}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">Logged Timestamp</span>
            <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">Assigned Technician</span>
            <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              {complaint.assignedStaff || 'Pending Assignment'}
            </p>
          </div>
        </div>

        {/* Issue Description */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Detailed Problem Description
          </h3>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
            {complaint.description}
          </p>
        </div>

        {/* Photo Attachment if available */}
        {complaint.imageUrl && (
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-700 block mb-1">Attached Photo Evidence</span>
            <div className="p-2 bg-slate-50 rounded border border-slate-200 inline-block">
              <img
                src={complaint.imageUrl}
                alt="Complaint attachment"
                className="max-h-48 rounded object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Resolution Details & Resolution Rating Card */}
      {isResolvedOrClosed && (
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Work Order Resolution Details</h2>
            </div>
            {complaint.resolvedAt && (
              <span className="text-[11px] text-slate-500 font-medium">
                Resolved on {new Date(complaint.resolvedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
            {complaint.resolutionNotes || 'Maintenance completed as per safety standards.'}
          </p>

          {/* Rating Section */}
          {complaint.rating ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Student Resolution Rating</span>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= complaint.rating!.score
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-extrabold text-slate-800 ml-1">
                    {complaint.rating.score} / 5
                  </span>
                </div>
              </div>
              {complaint.rating.comment && (
                <p className="text-xs text-slate-600 italic">"{complaint.rating.comment}"</p>
              )}
            </div>
          ) : isOwner ? (
            /* Student Rating Submission Form */
            <form onSubmit={handleRatingSubmit} className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
              <div>
                <h3 className="text-xs font-bold text-amber-900">Rate the Resolution Quality</h3>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Your rating helps the warden office assess maintenance vendor speed and workmanship.
                </p>
              </div>

              {ratingError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {ratingError}
                </div>
              )}

              {/* Star Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRatingScore(num)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          num <= ratingScore
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-extrabold text-amber-900 ml-2">
                  {ratingScore} Stars ({ratingScore === 5 ? 'Excellent' : ratingScore >= 4 ? 'Good' : ratingScore === 3 ? 'Average' : 'Poor'})
                </span>
              </div>

              <div>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional comments regarding resolution speed, staff behavior, or room condition..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-md text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingRating ? 'Saving Rating...' : 'Submit Resolution Feedback'}</span>
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 italic">
              Awaiting student resolution satisfaction review.
            </p>
          )}
        </div>
      )}

      {/* Staff / Warden Management Card */}
      {canManageStaff && (
        <form onSubmit={handleStatusUpdate} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Administrative Workflow & Dispatch Controls
            </h2>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {user?.role.replace('_', ' ')}
            </span>
          </div>

          {actionMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs">
              {actionMessage}
            </div>
          )}

          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Update Ticket Status
              </label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 font-semibold focus:outline-none"
              >
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assign Maintenance Staff
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none"
              >
                <option value="demo-maintenance-01">Suresh Kumar (Chief Electrician)</option>
                <option value="demo-maintenance-02">Ramesh Yadav (Plumber)</option>
                <option value="demo-maintenance-03">Kailash (Housekeeping & Cleanliness)</option>
                <option value="demo-maintenance-04">Vikram (Network / Wi-Fi Support)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Technician Notes / Resolution Description
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              placeholder="Record repairs executed, replacement parts used, or inspection findings..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              {updating ? 'Updating Ticket...' : 'Save Workflow Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
