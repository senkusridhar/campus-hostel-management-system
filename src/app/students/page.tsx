'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { DEMO_STUDENTS, DEMO_HOSTELS } from '@/lib/demo-data';
import { Student } from '@/types';
import { User, Phone, Mail, ShieldAlert, GraduationCap, MapPin } from 'lucide-react';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = DEMO_STUDENTS.filter((s) => {
    if (deptFilter && !s.department.includes(deptFilter)) return false;
    if (yearFilter && s.year !== yearFilter) return false;
    if (hostelFilter && s.hostel !== hostelFilter) return false;
    if (statusFilter && s.status !== statusFilter) return false;
    if (
      searchQuery &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.roomNo.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Directory of active hostel residents, academic profiles, and bed mappings"
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student name, ID or room..."
        filters={[
          {
            key: 'department',
            placeholder: 'All Departments',
            value: deptFilter,
            onChange: setDeptFilter,
            options: [
              { label: 'Computer Science & Engg', value: 'Computer Science' },
              { label: 'Electronics & Comm Engg', value: 'Electronics' },
              { label: 'Mechanical Engineering', value: 'Mechanical' },
              { label: 'Civil Engineering', value: 'Civil' },
              { label: 'Information Technology', value: 'Information' },
            ],
          },
          {
            key: 'year',
            placeholder: 'All Years',
            value: yearFilter,
            onChange: setYearFilter,
            options: [
              { label: '1st Year', value: '1st Year' },
              { label: '2nd Year', value: '2nd Year' },
              { label: '3rd Year', value: '3rd Year' },
              { label: '4th Year', value: '4th Year' },
            ],
          },
          {
            key: 'hostel',
            placeholder: 'All Hostels',
            value: hostelFilter,
            onChange: setHostelFilter,
            options: DEMO_HOSTELS.map((h) => ({ label: h.name, value: h.name })),
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Active', value: 'Active' },
              { label: 'On Leave', value: 'On Leave' },
              { label: 'Suspended', value: 'Suspended' },
            ],
          },
        ]}
      />

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Room / Bed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{student.studentId}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{student.department}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{student.year}</td>
                  <td className="py-3 px-4 font-medium text-slate-600">{student.hostel}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    Room {student.roomNo} ({student.bedNo})
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={student.status} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                    >
                      View Student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Profile & Hostel Mapping"
        subtitle={selectedStudent?.studentId}
        footer={
          <button
            onClick={() => setSelectedStudent(null)}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        }
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-lg">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-slate-500 font-medium">{selectedStudent.department} • {selectedStudent.year}</p>
                <div className="mt-1">
                  <StatusBadge status={selectedStudent.status} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-slate-400 font-semibold uppercase block">Hostel Name</span>
                <span className="font-bold text-slate-800 mt-1 block">{selectedStudent.hostel}</span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-md">
                <span className="text-slate-400 font-semibold uppercase block">Room & Bed No</span>
                <span className="font-bold text-slate-800 mt-1 block">
                  Room {selectedStudent.roomNo} ({selectedStudent.bedNo})
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Student Phone:</span> {selectedStudent.phone}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Institute Email:</span> {selectedStudent.email}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Guardian:</span> {selectedStudent.guardianName} ({selectedStudent.guardianPhone})
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
