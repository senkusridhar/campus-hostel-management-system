'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  Info,
  Building,
  DoorOpen,
} from 'lucide-react';

export default function NewComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [category, setCategory] = useState('ELECTRICAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [room, setRoom] = useState('101');
  const [hostel, setHostel] = useState('Boys Hostel A');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const categories = [
    { value: 'PLUMBING', label: 'Plumbing (Taps, Pipes, Drains, Flush)' },
    { value: 'ELECTRICAL', label: 'Electrical (Fan, Light, Switch, Wiring)' },
    { value: 'FURNITURE', label: 'Furniture (Bed, Study Table, Wardrobe)' },
    { value: 'INTERNET', label: 'Internet / Wi-Fi Connectivity' },
    { value: 'CLEANLINESS', label: 'Cleanliness & Housekeeping' },
    { value: 'FOOD_MESS', label: 'Food & Mess Dining' },
    { value: 'WATER', label: 'Water Supply & Drinking Purifier' },
    { value: 'SECURITY', label: 'Security & Access Gate' },
    { value: 'ROOM', label: 'Room Door, Lock & Windows' },
    { value: 'OTHER', label: 'Other General Maintenance' },
  ];

  const priorities = [
    { value: 'LOW', label: 'Low (General upkeep, 48h SLA)' },
    { value: 'MEDIUM', label: 'Medium (Normal fault, 24h SLA)' },
    { value: 'HIGH', label: 'High (Immediate inconvenience, 12h SLA)' },
    { value: 'URGENT', label: 'Urgent / Critical (Safety, Spark, Water Leak, 4h SLA)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both the issue title and detailed description.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          priority,
          roomId: room,
          hostelId: hostel,
          title,
          description,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit complaint.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/complaints/${data.complaint.id}`);
      }, 1200);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/complaints" className="hover:text-slate-900 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Complaints Register
        </Link>
      </div>

      <PageHeader
        title="Raise Maintenance Complaint"
        subtitle="Report room or common hostel facility issues directly to the warden desk and maintenance crew"
      />

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Complaint ticket registered successfully! Redirecting to ticket view...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        {/* Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Urgency & Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Hostel Building
            </label>
            <input
              type="text"
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none"
              placeholder="e.g. Boys Hostel A"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
              Room Number / Location
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none"
              placeholder="e.g. Room 101 or 2nd Floor Common Washroom"
              required
            />
          </div>
        </div>

        {/* Issue Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Brief Issue Summary <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ceiling fan speed regulator sparking when turned on"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            required
          />
        </div>

        {/* Issue Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Provide exact details of the issue, when it started, and specific location in the room..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            required
          />
        </div>

        {/* Optional Photo Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Photo Attachment URL <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Upload className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photos/fan-spark.jpg"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Providing a clear photo helps maintenance staff bring the right replacement parts on the first visit.
          </p>
        </div>

        {/* Governance Notice */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Campus SLA Guarantee:</span> Critical plumbing and electrical complaints receive response within 4 hours. Once resolved, you will be prompted to submit a resolution satisfaction rating.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link
            href="/complaints"
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting Ticket...' : 'Register Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}
