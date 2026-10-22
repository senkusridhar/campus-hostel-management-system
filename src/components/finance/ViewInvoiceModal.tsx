'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { InvoiceRecord } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Printer, Building2, Calendar, User, CheckCircle } from 'lucide-react';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  onRecordPayment?: (feeItem: any) => void;
  canRecordPayment?: boolean;
}

export const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
  canRecordPayment = false,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Fee Invoice Statement"
      subtitle={`Invoice ID: ${invoice.invoiceNumber} • ${invoice.academicTerm}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            {invoice.balanceDue > 0 ? (
              <span className="text-amber-700 font-semibold">
                Balance Outstanding: ₹{invoice.balanceDue.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Invoice fully settled
              </span>
            )}
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
              className="px-3.5 py-1.5 text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            {canRecordPayment && invoice.balanceDue > 0 && onRecordPayment && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors shadow-xs"
              >
                Record Payment
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
              <Building2 className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">CAMPUS HOSTEL MANAGEMENT SYSTEM</h3>
              <p className="text-[11px] text-slate-500 font-medium">Fee Assessment & Student Accounts Division</p>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={invoice.status} />
            <p className="font-mono font-bold text-slate-900 text-xs mt-1.5">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Student & Date Meta */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Billed Student</p>
            <p className="font-bold text-slate-900">{invoice.studentName}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{invoice.studentRegNo}</p>
            <p className="text-[11px] text-slate-600 mt-1">
              {invoice.hostel} • Room {invoice.roomNo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Billing Schedule</p>
            <p className="text-slate-700">Issue Date: {invoice.issueDate}</p>
            <p className="text-slate-900 font-semibold mt-0.5">Due Date: {invoice.dueDate}</p>
            <p className="text-[11px] text-slate-500 mt-1">{invoice.academicTerm}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Line Item Breakdown</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-4">{item.description}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium">
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="py-2.5 px-4 font-semibold text-slate-700 text-right">Invoice Subtotal:</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                  ₹{invoice.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-700 text-right">Amount Paid:</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                  ₹{invoice.paidAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-100/80 font-bold">
                <td className="py-2.5 px-4 text-slate-900 text-right text-xs">Outstanding Balance Due:</td>
                <td className="py-2.5 px-4 text-right font-mono text-amber-700 text-sm">
                  ₹{invoice.balanceDue.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-800 text-xs mb-2">Recorded Payment History</h4>
            <div className="border border-slate-200 rounded-md divide-y divide-slate-100 overflow-hidden">
              {invoice.payments.map((p, idx) => (
                <div key={idx} className="p-2.5 bg-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{p.receiptNumber}</span>
                    <span className="text-[11px] text-slate-400 ml-2">via {p.paymentMethod}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(p.paidAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
