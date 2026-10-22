'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ReceiptRecord } from '@/types';
import { Printer, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

interface PrintableReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptRecord | null;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      subtitle={`Receipt Reference: ${receipt.receiptNumber}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital ledger verification complete</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      }
    >
      <div id="printable-receipt-content" className="space-y-6 text-slate-800">
        {/* Institutional Receipt Header */}
        <div className="border-b border-slate-200 pb-5 text-center relative">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-700 mb-2">
            <Building2 className="w-5 h-5 text-slate-800" />
          </div>
          <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
            Campus Hostel Management System
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Central Accounts & Student Finance Division • Main Campus
          </p>
          <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded text-[11px] font-bold text-slate-800 border border-slate-200 uppercase tracking-widest">
            Official E-Fee Receipt
          </div>
        </div>

        {/* Receipt Meta & Student Profile */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Receipt Number</p>
            <p className="font-mono font-bold text-slate-900 text-sm">{receipt.receiptNumber}</p>

            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-2.5">Date & Time</p>
            <p className="text-slate-700 font-medium">
              {new Date(receipt.paidAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>

            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-2.5">Associated Invoice</p>
            <p className="font-mono text-slate-700 font-medium">{receipt.invoiceNumber}</p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Student Name</p>
            <p className="font-bold text-slate-900">{receipt.studentName}</p>

            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-2.5">Registration Number</p>
            <p className="font-mono font-semibold text-slate-800">{receipt.studentRegNo}</p>

            <p className="text-[10px] text-slate-400 uppercase font-semibold mt-2.5">Hostel & Room</p>
            <p className="text-slate-700 font-medium">
              {receipt.hostel} • Room {receipt.roomNo || '101'}
            </p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Fee Head / Description</th>
                <th className="py-2.5 px-4">Payment Mode</th>
                <th className="py-2.5 px-4 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {receipt.feeType}
                  <p className="text-[10px] text-slate-400 font-normal">
                    Institutional ledger reconciliation reference: {receipt.transactionReference}
                  </p>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium">
                    {receipt.paymentMethod}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                  ₹{receipt.amount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td colSpan={2} className="py-2.5 px-4 text-right text-slate-600">
                  Total Remitted:
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-emerald-700 text-base">
                  ₹{receipt.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-md p-3 text-xs">
          <p className="text-[10px] text-emerald-800 uppercase font-semibold">Amount in Words</p>
          <p className="font-semibold text-emerald-950 mt-0.5">{receipt.amountInWords}</p>
        </div>

        {/* Audit Signatures & Verification */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status: PAYMENT VERIFIED</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Verified by: {receipt.verifiedBy}
            </p>
            <p className="text-[10px] text-slate-400">
              This is a computer-generated institutional receipt. No manual signature required.
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block border-b-2 border-slate-300 pb-1 px-8 text-center">
              <span className="font-serif italic text-slate-400 text-xs tracking-wider">Authorized</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Finance & Accounts Office</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
