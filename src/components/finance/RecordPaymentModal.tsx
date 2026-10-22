'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FeeItem } from '@/types';
import { IndianRupee, AlertCircle, Loader2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee: FeeItem | null;
  onPaymentSuccess: (payment: any, receipt: any) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  fee,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fee) {
      setAmount(String(fee.balanceDue));
      setTransactionRef(`TXN/${Date.now().toString().slice(-6)}`);
      setError(null);
    }
  }, [fee]);

  if (!fee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (parsedAmount > fee.balanceDue) {
      setError(
        `Overpayment rejected: Entered amount (₹${parsedAmount.toLocaleString(
          'en-IN'
        )}) exceeds outstanding balance (₹${fee.balanceDue.toLocaleString('en-IN')}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeId: fee.id,
          amount: parsedAmount,
          paymentMethod,
          transactionReference: transactionRef.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to record payment.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      onPaymentSuccess(data.payment, data.receipt);
    } catch (err: any) {
      setError(err.message || 'Network error while recording payment.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee Payment"
      subtitle={`Billing Invoice: ${fee.invoiceNumber} • ${fee.studentName} (${fee.studentRegNo})`}
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
            form="record-payment-form"
            disabled={isSubmitting}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Confirm & Generate Receipt</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Fee Info Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 gap-3 text-slate-700">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Fee Type</p>
            <p className="font-semibold text-slate-900">{fee.feeType}</p>
            <p className="text-[11px] text-slate-500 mt-1">Total Fee: ₹{fee.amount.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Outstanding Balance</p>
            <p className="text-base font-bold text-amber-700 font-mono">
              ₹{fee.balanceDue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400">Due: {fee.dueDate}</p>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Payment Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
            <input
              type="number"
              step="any"
              min="1"
              max={fee.balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md font-mono text-sm focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. 45000"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Supports partial payments (maximum ₹{fee.balanceDue.toLocaleString('en-IN')}). Overpayment is rejected.
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Payment Method <span className="text-rose-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
            <option value="Net Banking">Net Banking (NEFT / RTGS / IMPS)</option>
            <option value="Card">Debit / Credit Card</option>
            <option value="Challan">Bank Challan</option>
            <option value="Cash">Cash at Institutional Counter</option>
          </select>
        </div>

        {/* Transaction Reference */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference Number</label>
          <input
            type="text"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            placeholder="e.g. UPI/62819401289/PAY or Challan No"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Unique bank settlement or UTR reference number. Duplicate references are rejected.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Administrative Notes (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received counter copy of challan verified with SBI branch"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </form>
    </Modal>
  );
};
