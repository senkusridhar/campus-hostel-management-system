'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FilterBar } from '@/components/ui/FilterBar';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { ViewInvoiceModal } from '@/components/finance/ViewInvoiceModal';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { PrintableReceiptModal } from '@/components/finance/PrintableReceiptModal';
import { InvoiceRecord, FeeItem, ReceiptRecord } from '@/types';
import { FileText, CheckCircle, Clock, AlertTriangle, Eye, Printer } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUserRole(userData.user?.role || '');
      }

      const res = await fetch('/api/finance/invoices');
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to load invoices.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message || 'Network error fetching invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'].includes(
    currentUserRole.toUpperCase()
  );

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchName = inv.studentName.toLowerCase().includes(q);
      const matchReg = inv.studentRegNo.toLowerCase().includes(q);
      if (!matchInv && !matchName && !matchReg) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalInvoiced = filteredInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const settledCount = filteredInvoices.filter((i) => i.status === 'Paid').length;
  const pendingCount = filteredInvoices.filter((i) => i.status === 'Pending' || i.status === 'Partially Paid').length;
  const overdueCount = filteredInvoices.filter((i) => i.status === 'Overdue').length;

  const handlePaymentSuccess = (payment: any, receipt: any) => {
    setSelectedReceipt(receipt);
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing Invoices & Assessment Statements"
        subtitle="Official fee assessment schedules, breakdown line items, semester invoices, and settlements"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoiced"
          value={`₹${totalInvoiced.toLocaleString('en-IN')}`}
          icon={FileText}
          badge={{ text: 'Assessment Ledger', type: 'neutral' }}
        />
        <StatCard
          title="Settled Invoices"
          value={String(settledCount)}
          icon={CheckCircle}
          badge={{ text: 'Fully Paid', type: 'positive' }}
        />
        <StatCard
          title="Active Demands"
          value={String(pendingCount)}
          icon={Clock}
          badge={{ text: 'Outstanding', type: 'warning' }}
        />
        <StatCard
          title="Overdue Accounts"
          value={String(overdueCount)}
          icon={AlertTriangle}
          badge={{ text: 'Late Surcharge', type: 'danger' }}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search invoice no, student name or reg..."
        filters={[
          {
            key: 'status',
            placeholder: 'All Invoice Statuses',
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

      {/* Invoices Table */}
      {loading ? (
        <LoadingState message="Loading invoice statements..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInvoices} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          title="No Invoices Found"
          description="There are no billing statements matching your current search parameters."
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Term & Head</th>
                  <th className="py-3 px-4">Billing Dates</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{inv.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {inv.studentRegNo} • {inv.hostel} • Room {inv.roomNo}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{inv.feeType}</p>
                      <p className="text-[10px] text-slate-400">{inv.academicTerm}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-600">Issued: {inv.issueDate}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Due: {inv.dueDate}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      ₹{inv.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-700">₹{inv.balanceDue.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Breakdown</span>
                      </button>
                      {canManage && inv.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            const feeItem: FeeItem = {
                              id: inv.id,
                              invoiceNumber: inv.invoiceNumber,
                              studentId: inv.studentId,
                              studentName: inv.studentName,
                              studentRegNo: inv.studentRegNo,
                              department: inv.department,
                              hostel: inv.hostel,
                              roomNo: inv.roomNo,
                              feeType: inv.feeType as any,
                              amount: inv.totalAmount,
                              paidAmount: inv.paidAmount,
                              balanceDue: inv.balanceDue,
                              dueDate: inv.dueDate,
                              issueDate: inv.issueDate,
                              status: inv.status,
                              createdAt: inv.issueDate,
                            };
                            setSelectedFeeForPayment(feeItem);
                          }}
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

      {/* View Invoice Modal */}
      <ViewInvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        canRecordPayment={canManage}
        onRecordPayment={(inv) => {
          const feeItem: FeeItem = {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            studentId: inv.studentId,
            studentName: inv.studentName,
            studentRegNo: inv.studentRegNo,
            department: inv.department,
            hostel: inv.hostel,
            roomNo: inv.roomNo,
            feeType: inv.feeType as any,
            amount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            balanceDue: inv.balanceDue,
            dueDate: inv.dueDate,
            issueDate: inv.issueDate,
            status: inv.status,
            createdAt: inv.issueDate,
          };
          setSelectedFeeForPayment(feeItem);
        }}
      />

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
