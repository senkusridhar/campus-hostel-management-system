'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { IssueFineModal } from '@/components/finance/IssueFineModal';
import { PrintableReceiptModal } from '@/components/finance/PrintableReceiptModal';
import { FineRecord, ReceiptRecord } from '@/types';
import { Scale, AlertTriangle, CheckCircle, Clock, Plus, IndianRupee, ShieldAlert, Printer } from 'lucide-react';

export default function FinesPage() {
  const [fines, setFines] = useState<FineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [selectedFineForPay, setSelectedFineForPay] = useState<FineRecord | null>(null);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const [selectedFineForWaive, setSelectedFineForWaive] = useState<FineRecord | null>(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [isWaiving, setIsWaiving] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const fetchFines = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserRole(userData.user?.role || '');
      }

      const res = await fetch('/api/finance/fines');
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to load disciplinary fines.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFines(data.fines || []);
    } catch (err: any) {
      setError(err.message || 'Network error fetching fines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const canIssue = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'WARDEN'].includes(
    currentUserRole.toUpperCase()
  );
  const canSettle = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'].includes(
    currentUserRole.toUpperCase()
  );

  const filteredFines = fines.filter((f) => {
    if (categoryFilter && f.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    if (statusFilter && f.status.toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = f.studentName.toLowerCase().includes(q);
      const matchReg = f.studentRegNo.toLowerCase().includes(q);
      const matchReason = f.reason.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchReason) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalIssued = filteredFines.reduce((s, f) => s + f.amount, 0);
  const collectedTotal = filteredFines
    .filter((f) => f.status === 'PAID')
    .reduce((s, f) => s + f.amount, 0);
  const pendingCount = filteredFines.filter((f) => f.status === 'PENDING').length;
  const waivedCount = filteredFines.filter((f) => f.status === 'WAIVED').length;

  const handlePayFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForPay) return;

    setIsPaying(true);
    try {
      const res = await fetch(`/api/finance/fines/${selectedFineForPay.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          paymentMethod: payMethod,
          transactionReference: payRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to settle fine.');
        setIsPaying(false);
        return;
      }

      setIsPaying(false);
      setSelectedFineForPay(null);
      if (data.receipt) {
        setSelectedReceipt(data.receipt);
      }
      fetchFines();
    } catch (err: any) {
      alert(err.message || 'Network error settling fine.');
      setIsPaying(false);
    }
  };

  const handleWaiveFineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFineForWaive) return;

    setIsWaiving(true);
    try {
      const res = await fetch(`/api/finance/fines/${selectedFineForWaive.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'waive',
          reason: waiveReason.trim() || 'Waiver approved on administrative review',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to waive fine.');
        setIsWaiving(false);
        return;
      }

      setIsWaiving(false);
      setSelectedFineForWaive(null);
      fetchFines();
    } catch (err: any) {
      alert(err.message || 'Network error waiving fine.');
      setIsWaiving(false);
    }
  };

  const handleViewReceipt = async (fine: FineRecord) => {
    if (!fine.receiptNumber) return;
    try {
      const res = await fetch(`/api/finance/receipts/${fine.receiptNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReceipt(data.receipt);
      }
    } catch {
      //
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fines & Disciplinary Penalties"
        subtitle="Disciplinary fines, curfew violation charges, asset damage assessments, and penalty status"
        actions={
          canIssue ? (
            <button
              onClick={() => setIsIssueOpen(true)}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Penalty Fine</span>
            </button>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Penalties Issued"
          value={`₹${totalIssued.toLocaleString('en-IN')}`}
          icon={Scale}
          badge={{ text: `${filteredFines.length} Fines`, type: 'neutral' }}
        />
        <StatCard
          title="Fines Collected"
          value={`₹${collectedTotal.toLocaleString('en-IN')}`}
          icon={CheckCircle}
          badge={{ text: 'Settled to Fund', type: 'positive' }}
        />
        <StatCard
          title="Pending Settlement"
          value={String(pendingCount)}
          icon={Clock}
          badge={{ text: 'Outstanding', type: 'warning' }}
        />
        <StatCard
          title="Waived on Appeal"
          value={String(waivedCount)}
          icon={AlertTriangle}
          badge={{ text: 'Admin Review', type: 'neutral' }}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student name, reg no or reason..."
        filters={[
          {
            key: 'category',
            placeholder: 'All Categories',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'Discipline', value: 'Discipline' },
              { label: 'Curfew Violation', value: 'Curfew Violation' },
              { label: 'Property Damage', value: 'Property Damage' },
              { label: 'Mess Violation', value: 'Mess Violation' },
              { label: 'Noise Complaint', value: 'Noise Complaint' },
              { label: 'Other', value: 'Other' },
            ],
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Pending', value: 'PENDING' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Waived', value: 'WAIVED' },
            ],
          },
        ]}
      />

      {/* Fines Table */}
      {loading ? (
        <LoadingState message="Loading disciplinary penalty ledgers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFines} />
      ) : filteredFines.length === 0 ? (
        <EmptyState
          title="No Fines Recorded"
          description="There are no disciplinary penalty records matching the selected filters."
          actionText={canIssue ? 'Issue Penalty Fine' : undefined}
          onAction={canIssue ? () => setIsIssueOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Violation Category</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{fine.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {fine.studentRegNo} • {fine.hostel} • Room {fine.roomNo}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-800">
                        {fine.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 truncate" title={fine.reason}>
                        {fine.reason}
                      </p>
                      {fine.waiveReason && (
                        <p className="text-[10px] text-slate-400 italic">Waive: {fine.waiveReason}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                      ₹{fine.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {fine.issuedByName || 'Warden'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(fine.issuedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={fine.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {fine.status === 'PENDING' && canSettle && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedFineForPay(fine);
                              setPayRef(`FINE/REC/${Date.now().toString().slice(-6)}`);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                          >
                            Collect
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFineForWaive(fine);
                              setWaiveReason('Waived on first-time resident counseling');
                            }}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors"
                          >
                            Waive
                          </button>
                        </>
                      )}
                      {fine.status === 'PAID' && fine.receiptNumber && (
                        <button
                          onClick={() => handleViewReceipt(fine)}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Fine Modal */}
      <IssueFineModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onFineIssued={() => fetchFines()}
      />

      {/* Collect Fine Modal */}
      {selectedFineForPay && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFineForPay(null)}
          title="Collect Fine Settlement"
          subtitle={`Penalty for ${selectedFineForPay.studentName} (${selectedFineForPay.studentRegNo})`}
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setSelectedFineForPay(null)}
                disabled={isPaying}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="collect-fine-form"
                disabled={isPaying}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
              >
                {isPaying ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          }
        >
          <form id="collect-fine-form" onSubmit={handlePayFineSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Penalty Amount</p>
              <p className="font-mono text-base font-bold text-slate-900 mt-0.5">
                ₹{selectedFineForPay.amount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{selectedFineForPay.reason}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              >
                <option value="UPI">UPI</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash Counter Receipt</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Reference</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. UTR / Receipt Ref"
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Waive Fine Modal */}
      {selectedFineForWaive && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFineForWaive(null)}
          title="Waive Disciplinary Penalty"
          subtitle={`Waiving fine for ${selectedFineForWaive.studentName} (${selectedFineForWaive.studentRegNo})`}
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setSelectedFineForWaive(null)}
                disabled={isWaiving}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="waive-fine-form"
                disabled={isWaiving}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-md text-xs font-semibold"
              >
                {isWaiving ? 'Waiving...' : 'Confirm Waiver'}
              </button>
            </div>
          }
        >
          <form id="waive-fine-form" onSubmit={handleWaiveFineSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              <p className="font-semibold">Notice of Penalty Waiver</p>
              <p className="mt-1 leading-relaxed text-[11px]">
                Waiving fine ₹{selectedFineForWaive.amount.toLocaleString('en-IN')} permanently clears the
                disciplinary penalty from the student’s active dues ledger.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Waiver</label>
              <textarea
                rows={2}
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </form>
        </Modal>
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
