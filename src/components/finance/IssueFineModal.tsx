'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface IssueFineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFineIssued: (fine: any) => void;
}

export const IssueFineModal: React.FC<IssueFineModalProps> = ({
  isOpen,
  onClose,
  onFineIssued,
}) => {
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState('Discipline');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid fine penalty amount greater than zero.');
      return;
    }

    if (!studentId.trim()) {
      setError('Please enter a valid student registration number or ID.');
      return;
    }

    if (!reason.trim()) {
      setError('Please describe the disciplinary or damage violation reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId.trim(),
          category,
          amount: parsedAmount,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to issue disciplinary fine.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      onFineIssued(data.fine);
    } catch (err: any) {
      setError(err.message || 'Network error while issuing fine.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Disciplinary Penalty / Fine"
      subtitle="Authorized for Hostel Wardens, Finance Officers & Campus Administration"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="issue-fine-form"
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Issue Formal Penalty</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="issue-fine-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Student Registration Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            placeholder="e.g. STU2024018 or STU2024210"
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Violation Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="Discipline">Discipline & Conduct</option>
              <option value="Curfew Violation">Curfew & Gate Violation</option>
              <option value="Property Damage">Hostel Property Damage</option>
              <option value="Mess Violation">Mess & Food Rule Violation</option>
              <option value="Noise Complaint">Noise & Curfew Disturbance</option>
              <option value="Other">Other Disciplinary Infraction</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Penalty Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 500 or 1500"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Violation Reason & Evidence Note <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Late entry past 10:30 PM without approved gate pass verified by night security guard"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};
