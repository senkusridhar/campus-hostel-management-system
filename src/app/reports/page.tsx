'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { DEMO_REPORTS } from '@/lib/demo-data';
import { Report } from '@/types';
import { BarChart3, FileSpreadsheet, Download, Clock, ShieldCheck, Check } from 'lucide-react';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Reports & Audit Logs"
        subtitle="Standardized administrative reports, occupancy statistics, and financial audit files"
      />

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEMO_REPORTS.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {report.category}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{report.format}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{report.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{report.description}</p>
            </div>

            <div className="mt-5">
              <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between">
                <span>Records: {report.recordCount.toLocaleString('en-IN')}</span>
                <span>Last Run: {report.lastGenerated}</span>
              </div>
              <button
                onClick={() => setSelectedReport(report)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                View Report Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Report Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.title || 'Report Preview'}
        subtitle={`Category: ${selectedReport?.category} | Records: ${selectedReport?.recordCount}`}
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedReport(null)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-100"
            >
              Close
            </button>
            <button
              disabled
              className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold opacity-60 cursor-not-allowed flex items-center gap-1.5"
              title="Exporting export functions will be connected in next phase"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV (Phase 2)
            </button>
          </div>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-800">{selectedReport.description}</p>
              <p className="text-slate-500 mt-1">Generated automatically on {selectedReport.lastGenerated}</p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                <span>Sample Data Rows (Top 3)</span>
                <span>Total 2,486 lines</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white p-3 font-mono text-[11px] text-slate-600">
                <p>1. STU2024012 | Rahul Kumar | Boys Hostel A | Room 101 | Active | Paid</p>
                <p>2. STU2024051 | Priya Sharma | Girls Hostel A | Room 204 | Active | Pending</p>
                <p>3. STU2024089 | Aditya Patel | Boys Hostel A | Room 101 | Active | Paid</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
