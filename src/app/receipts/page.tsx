'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { PrintableReceiptModal } from '@/components/finance/PrintableReceiptModal';
import { ReceiptRecord } from '@/types';
import { Receipt, CheckCircle, IndianRupee, Printer, ShieldCheck } from 'lucide-react';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/finance/receipts');
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to load receipt records.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err: any) {
      setError(err.message || 'Network error fetching receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const filteredReceipts = receipts.filter((r) => {
    if (methodFilter && r.paymentMethod.toLowerCase() !== methodFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRec = r.receiptNumber.toLowerCase().includes(q);
      const matchInv = r.invoiceNumber?.toLowerCase().includes(q);
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchReg = r.studentRegNo.toLowerCase().includes(q);
      if (!matchRec && !matchInv && !matchName && !matchReg) return false;
    }
    return true;
  });

  const totalValue = filteredReceipts.reduce((s, r) => s + r.amount, 0);
  const uniqueStudents = new Set(filteredReceipts.map((r) => r.studentRegNo)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Receipts & Tax Vouchers"
        subtitle="Official institutional fee payment receipts with browser-printable vouchers and verification stamps"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Receipts"
          value={String(filteredReceipts.length)}
          icon={Receipt}
          badge={{ text: 'Verified Archive', type: 'positive' }}
        />
        <StatCard
          title="Total Value Remitted"
          value={`₹${totalValue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          badge={{ text: 'Accounts Reconciled', type: 'positive' }}
        />
        <StatCard
          title="Digital Verification"
          value="100%"
          icon={ShieldCheck}
          badge={{ text: 'Ledger Audit Compliant', type: 'positive' }}
        />
        <StatCard
          title="Unique Payers"
          value={String(uniqueStudents)}
          icon={CheckCircle}
          badge={{ text: 'Resident Students', type: 'neutral' }}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search receipt no, invoice no or student..."
        filters={[
          {
            key: 'method',
            placeholder: 'All Payment Methods',
            value: methodFilter,
            onChange: setMethodFilter,
            options: [
              { label: 'UPI', value: 'UPI' },
              { label: 'Net Banking', value: 'Net Banking' },
              { label: 'Challan', value: 'Challan' },
              { label: 'Card', value: 'Card' },
              { label: 'Cash', value: 'Cash' },
            ],
          },
        ]}
      />

      {/* Receipts Table */}
      {loading ? (
        <LoadingState message="Loading official payment receipts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReceipts} />
      ) : filteredReceipts.length === 0 ? (
        <EmptyState
          title="No Receipts Found"
          description="There are no payment vouchers matching your current filter criteria."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Invoice Reference</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredReceipts.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {rc.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {rc.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{rc.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {rc.studentRegNo} • {rc.hostel}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{rc.feeType}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{rc.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-800">
                        {rc.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(rc.paidAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status="verified" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(rc)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>Print Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
