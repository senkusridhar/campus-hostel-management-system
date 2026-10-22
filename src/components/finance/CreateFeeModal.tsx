'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';

interface CreateFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeeCreated: (fee: any) => void;
}

export const CreateFeeModal: React.FC<CreateFeeModalProps> = ({
  isOpen,
  onClose,
  onFeeCreated,
}) => {
  const [studentId, setStudentId] = useState('');
  const [feeType, setFeeType] = useState('Hostel Fee');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [academicTerm, setAcademicTerm] = useState('Autumn Semester 2026');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid fee amount greater than zero.');
      return;
    }

    if (!studentId.trim()) {
      setError('Please enter a valid student registration number or ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId.trim(),
          feeType,
          amount: parsedAmount,
          dueDate,
          academicTerm,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create fee demand.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      onFeeCreated(data.fee);
    } catch (err: any) {
      setError(err.message || 'Network error while creating fee demand.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Student Fee Demand"
      subtitle="Issue an institutional semester invoice, mess charge, or deposit"
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
            form="create-fee-form"
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice Demand</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="create-fee-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
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
            placeholder="e.g. STU2024012 or STU2024051"
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Fee Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="Hostel Fee">Hostel Fee</option>
              <option value="Mess Fee">Mess Fee</option>
              <option value="Security Deposit">Security Deposit</option>
              <option value="Other">Other / Sundry Fee</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Total Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 45000"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Term</label>
            <input
              type="text"
              value={academicTerm}
              onChange={(e) => setAcademicTerm(e.target.value)}
              placeholder="e.g. Autumn Semester 2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Assessment Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Regular semester accommodation fee installment"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};
