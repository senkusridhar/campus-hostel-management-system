'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DEMO_FEES } from '@/lib/demo-data';
import { IndianRupee, CreditCard, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function FinancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [feeTypeFilter, setFeeTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredFees = DEMO_FEES.filter((f) => {
    if (feeTypeFilter && f.feeType !== feeTypeFilter) return false;
    if (statusFilter && f.status !== statusFilter) return false;
    if (
      searchQuery &&
      !f.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Fees"
        subtitle="Hostel fee billing, semester invoices, payment reconciliations, and penalty tracking"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Collection" value="₹1.64 Cr" icon={IndianRupee} badge={{ text: "89% Target", type: "positive" }} />
        <StatCard title="Pending Dues" value="₹11.50 L" icon={Clock} badge={{ text: "Grace Period", type: "warning" }} />
        <StatCard title="Overdue" value="₹8.42 L" icon={AlertTriangle} badge={{ text: "Fine Applied", type: "danger" }} />
        <StatCard title="Today's Collection" value="₹1.25 L" icon={CheckCircle} badge={{ text: "34 Transactions", type: "positive" }} />
      </div>

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search receipt no or student..."
        filters={[
          {
            key: 'feeType',
            placeholder: 'All Fee Types',
            value: feeTypeFilter,
            onChange: setFeeTypeFilter,
            options: [
              { label: 'Hostel Fee', value: 'Hostel Fee' },
              { label: 'Mess Fee', value: 'Mess Fee' },
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
              { label: 'Pending', value: 'Pending' },
              { label: 'Overdue', value: 'Overdue' },
            ],
          },
        ]}
      />

      {/* Financial Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Receipt / Invoice No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Fee Type</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Due / Payment Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{fee.receiptNo}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{fee.studentName}</p>
                    <p className="text-[10px] text-slate-400">
                      {fee.studentId} • {fee.hostel}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{fee.feeType}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ₹{fee.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {fee.paymentDate ? fee.paymentDate : `Due: ${fee.dueDate}`}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {fee.paymentMethod || <span className="text-slate-400 italic">Unpaid</span>}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={fee.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
