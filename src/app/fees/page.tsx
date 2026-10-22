'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { PrintableReceiptModal } from '@/components/finance/PrintableReceiptModal';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { CreateFeeModal } from '@/components/finance/CreateFeeModal';
import { ViewInvoiceModal } from '@/components/finance/ViewInvoiceModal';
import { FeeItem, ReceiptRecord, InvoiceRecord } from '@/types';
import { IndianRupee, Clock, AlertTriangle, CheckCircle, Plus, FileText } from 'lucide-react';

export default function FeesPage() {
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');

  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserRole(userData.user?.role || '');
      }

      const res = await fetch('/api/finance/fees');
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to load fee records.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFees(data.fees || []);
    } catch (err: any) {
      setError(err.message || 'Network error fetching fees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'].includes(
    currentUserRole.toUpperCase()
  );

  const filteredFees = fees.filter((f) => {
    if (feeTypeFilter && f.feeType.toLowerCase() !== feeTypeFilter.toLowerCase()) return false;
    if (statusFilter && f.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (hostelFilter && !f.hostel.toLowerCase().includes(hostelFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchInv = f.invoiceNumber?.toLowerCase().includes(q);
      const matchName = f.studentName.toLowerCase().includes(q);
      const matchReg = f.studentRegNo.toLowerCase().includes(q);
      if (!matchInv && !matchName && !matchReg) return false;
    }
    return true;
  });

  // Calculate stats
  const totalBilled = filteredFees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = filteredFees.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalBalance = filteredFees.reduce((sum, f) => sum + f.balanceDue, 0);
  const overdueCount = filteredFees.filter((f) => f.status === 'Overdue').length;

  const handlePaymentSuccess = (payment: any, receipt: any) => {
    setSelectedReceipt(receipt);
    fetchFees();
  };

  const handleOpenInvoice = (fee: FeeItem) => {
    const inv: InvoiceRecord = {
      id: fee.id,
      invoiceNumber: fee.invoiceNumber,
      feeId: fee.id,
      studentId: fee.studentId,
      studentName: fee.studentName,
      studentRegNo: fee.studentRegNo,
      department: fee.department || 'Engineering',
      hostel: fee.hostel,
      roomNo: fee.roomNo || '101',
      feeType: fee.feeType,
      description: fee.description || `${fee.feeType} Assessment`,
      academicTerm: fee.academicTerm || 'Autumn Semester 2026',
      issueDate: fee.issueDate,
      dueDate: fee.dueDate,
      lineItems: [
        { description: `${fee.feeType} Primary Assessment`, amount: Math.round(fee.amount * 0.7) },
        { description: 'Hostel Services & Amenities Fund', amount: Math.round(fee.amount * 0.3) },
      ],
      subtotal: fee.amount,
      taxAmount: 0,
      totalAmount: fee.amount,
      paidAmount: fee.paidAmount,
      balanceDue: fee.balanceDue,
      status: fee.status,
      payments: [],
    };
    setSelectedInvoice(inv);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fees & Outstanding Dues"
        subtitle="Manage semester hostel fees, mess advances, caution deposits, and resident balance tracking"
        actions={
          canManage ? (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Fee Demand</span>
            </button>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Billed"
          value={`₹${totalBilled.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          badge={{ text: 'Assessment Ledger', type: 'neutral' }}
        />
        <StatCard
          title="Total Collected"
          value={`₹${totalPaid.toLocaleString('en-IN')}`}
          icon={CheckCircle}
          badge={{ text: 'Reconciled', type: 'positive' }}
        />
        <StatCard
          title="Balance Due"
          value={`₹${totalBalance.toLocaleString('en-IN')}`}
          icon={Clock}
          badge={{ text: 'Pending Balance', type: 'warning' }}
        />
        <StatCard
          title="Overdue Accounts"
          value={String(overdueCount)}
          icon={AlertTriangle}
          badge={{ text: 'Notice Issued', type: 'danger' }}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by invoice no, student name or reg..."
        filters={[
          {
            key: 'feeType',
            placeholder: 'All Fee Types',
            value: feeTypeFilter,
            onChange: setFeeTypeFilter,
            options: [
              { label: 'Hostel Fee', value: 'Hostel Fee' },
              { label: 'Mess Fee', value: 'Mess Fee' },
              { label: 'Security Deposit', value: 'Security Deposit' },
              { label: 'Late Fine', value: 'Late Fine' },
              { label: 'Damage Fine', value: 'Damage Fine' },
            ],
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Paid', value: 'Paid' },
              { label: 'Partially Paid', value: 'Partially Paid' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Overdue', value: 'Overdue' },
            ],
          },
          {
            key: 'hostel',
            placeholder: 'All Hostels',
            value: hostelFilter,
            onChange: setHostelFilter,
            options: [
              { label: 'Boys Hostel A', value: 'Boys Hostel A' },
              { label: 'Girls Hostel A', value: 'Girls Hostel A' },
            ],
          },
        ]}
      />

      {/* Fees Table */}
      {loading ? (
        <LoadingState message="Fetching student fee ledgers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFees} />
      ) : filteredFees.length === 0 ? (
        <EmptyState
          title="No Fee Demands Found"
          description="No student fee assessment records match your filter criteria."
          actionText={canManage ? 'Create Fee Demand' : undefined}
          onAction={canManage ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Invoice / Ref No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-right">Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {fee.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{fee.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {fee.studentRegNo} • {fee.hostel} • Room {fee.roomNo || '101'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{fee.feeType}</p>
                      <p className="text-[10px] text-slate-400">{fee.academicTerm}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{fee.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      ₹{fee.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {fee.balanceDue > 0 ? (
                        <span className="text-amber-700">₹{fee.balanceDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{fee.dueDate}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={fee.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenInvoice(fee)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors"
                      >
                        View Invoice
                      </button>
                      {canManage && fee.balanceDue > 0 && (
                        <button
                          onClick={() => setSelectedFeeForPayment(fee)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                        >
                          Record Payment
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

      {/* Create Fee Modal */}
      <CreateFeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onFeeCreated={() => fetchFees()}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedFeeForPayment}
        onClose={() => setSelectedFeeForPayment(null)}
        fee={selectedFeeForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* View Invoice Modal */}
      <ViewInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        canRecordPayment={canManage}
        onRecordPayment={(inv) => {
          const match = fees.find((f) => f.id === inv.id);
          if (match) setSelectedFeeForPayment(match);
        }}
      />

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
