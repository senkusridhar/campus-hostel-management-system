'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { PrintableReceiptModal } from '@/components/finance/PrintableReceiptModal';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { FeeItem, ReceiptRecord, FinanceOverviewStats } from '@/types';
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  CreditCard,
  Receipt,
  Scale,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function FinanceOverviewPage() {
  const [stats, setStats] = useState<FinanceOverviewStats | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch current user
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserRole(userData.user?.role || '');
      }

      // 2. Fetch stats
      const statsRes = await fetch('/api/finance/overview');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // 3. Fetch fees
      const feesRes = await fetch('/api/finance/fees');
      if (feesRes.ok) {
        const feesData = await feesRes.json();
        setFees(feesData.fees || []);
      } else {
        const errData = await feesRes.json();
        setError(errData.error || 'Failed to load financial records.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while fetching finance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'].includes(
    currentUserRole.toUpperCase()
  );

  const filteredFees = fees.filter((f) => {
    if (feeTypeFilter && f.feeType.toLowerCase() !== feeTypeFilter.toLowerCase()) return false;
    if (statusFilter && f.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchInv = f.invoiceNumber?.toLowerCase().includes(q);
      const matchName = f.studentName.toLowerCase().includes(q);
      const matchReg = f.studentRegNo.toLowerCase().includes(q);
      if (!matchInv && !matchName && !matchReg) return false;
    }
    return true;
  });

  const handlePaymentSuccess = (payment: any, receipt: any) => {
    setSelectedReceipt(receipt);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Accounts Overview"
        subtitle="Hostel fee billing, semester invoices, payment reconciliations, and penalty tracking"
      />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link
          href="/fees"
          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Fees & Dues</p>
              <p className="text-[10px] text-slate-500">Student balances</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/invoices"
          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Invoices</p>
              <p className="text-[10px] text-slate-500">Billing statements</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/payments"
          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Payments</p>
              <p className="text-[10px] text-slate-500">Reconciled logs</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/fines"
          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-700 rounded-md">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Fines</p>
              <p className="text-[10px] text-slate-500">Penalties ledger</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/receipts"
          className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-md">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Receipts</p>
              <p className="text-[10px] text-slate-500">Printable vouchers</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collection"
          value={`₹${(stats?.totalCollections || 0).toLocaleString('en-IN')}`}
          icon={IndianRupee}
          badge={{ text: `${stats?.targetCollectionRate || 89}% Target`, type: 'positive' }}
        />
        <StatCard
          title="Pending Dues"
          value={`₹${(stats?.pendingDues || 0).toLocaleString('en-IN')}`}
          icon={Clock}
          badge={{ text: 'Outstanding Balance', type: 'warning' }}
        />
        <StatCard
          title="Overdue Accounts"
          value={`₹${(stats?.overdueAmount || 0).toLocaleString('en-IN')}`}
          icon={AlertTriangle}
          badge={{ text: 'Action Required', type: 'danger' }}
        />
        <StatCard
          title="Verified Transactions"
          value={String(stats?.totalTransactions || 0)}
          icon={CheckCircle}
          badge={{ text: 'Audited Ledger', type: 'positive' }}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search invoice no, student name or reg no..."
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
        ]}
      />

      {/* Financial Table / States */}
      {loading ? (
        <LoadingState message="Loading institutional finance records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filteredFees.length === 0 ? (
        <EmptyState
          title="No Financial Records Found"
          description="There are no billing records matching the current filter criteria."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Invoice / Demand</th>
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
                        {fee.studentRegNo} • {fee.hostel}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{fee.feeType}</span>
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
                    <td className="py-3 px-4 text-right">
                      {canManage && fee.balanceDue > 0 ? (
                        <button
                          onClick={() => setSelectedFeeForPayment(fee)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <Link
                          href="/invoices"
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors"
                        >
                          View Details
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedFeeForPayment}
        onClose={() => setSelectedFeeForPayment(null)}
        fee={selectedFeeForPayment}
        onPaymentSuccess={handlePaymentSuccess}
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
