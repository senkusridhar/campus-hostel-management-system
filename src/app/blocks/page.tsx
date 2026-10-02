'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { DEMO_BLOCKS, DEMO_HOSTELS } from '@/lib/demo-data';
import { Block, Hostel } from '@/types';
import { Layers, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>(DEMO_BLOCKS);
  const [hostels, setHostels] = useState<Hostel[]>(DEMO_HOSTELS);
  const [hostelFilter, setHostelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    hostelId: '',
    name: '',
    code: '',
    numberOfFloors: 4,
    genderCategory: 'Boys',
  });

  const fetchData = async () => {
    try {
      const [bRes, hRes] = await Promise.all([
        fetch('/api/blocks'),
        fetch('/api/hostels'),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.blocks && bData.blocks.length > 0) setBlocks(bData.blocks);
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        if (hData.hostels && hData.hostels.length > 0) {
          setHostels(hData.hostels);
          if (!formData.hostelId && hData.hostels[0]) {
            setFormData((prev) => ({ ...prev, hostelId: hData.hostels[0].id }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load blocks from API:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({
          hostelId: hostels[0]?.id || '',
          name: '',
          code: '',
          numberOfFloors: 4,
          genderCategory: 'Boys',
        });
        setSuccessMsg('Block registered successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating block:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredBlocks = blocks.filter((b) => {
    if (hostelFilter && b.hostelName !== hostelFilter && b.hostelId !== hostelFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!b.name.toLowerCase().includes(query) && !b.hostelName.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hostel Blocks"
          subtitle="Block-wise room breakdown, floor layout statistics, and bed occupancy"
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Block
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search block or hostel..."
        filters={[
          {
            key: 'hostel',
            placeholder: 'All Hostels',
            value: hostelFilter,
            onChange: setHostelFilter,
            options: hostels.map((h) => ({ label: h.name, value: h.name })),
          },
        ]}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Block Name</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Floors</th>
                <th className="py-3 px-4">Total Rooms</th>
                <th className="py-3 px-4">Total Capacity</th>
                <th className="py-3 px-4">Occupied Beds</th>
                <th className="py-3 px-4">Available Beds</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBlocks.map((block) => {
                const available =
                  block.availableBeds !== undefined
                    ? block.availableBeds
                    : Math.max(0, block.totalBeds - block.occupiedBeds);

                return (
                  <tr key={block.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{block.name}</p>
                      {block.code && <span className="font-mono text-[10px] text-slate-400">{block.code}</span>}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{block.hostelName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {block.genderCategory || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{block.floorsCount} Floors</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{block.totalRooms} Rooms</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{block.totalBeds} Beds</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{block.occupiedBeds} Beds</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{available} Beds</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/rooms?block=${encodeURIComponent(block.name)}&hostel=${encodeURIComponent(block.hostelName)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        <span>Matrix</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Block Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Block"
        subtitle="Create a new residential block under an existing hostel"
      >
        <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Hostel</label>
            <select
              required
              value={formData.hostelId}
              onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Block Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Block D"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Block Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BLK-D"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Floors</label>
              <input
                type="number"
                required
                min="1"
                max="20"
                value={formData.numberOfFloors}
                onChange={(e) =>
                  setFormData({ ...formData, numberOfFloors: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender Category</label>
              <select
                value={formData.genderCategory}
                onChange={(e) => setFormData({ ...formData, genderCategory: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Boys">Boys Block</option>
                <option value="Girls">Girls Block</option>
                <option value="Co-Ed">Co-Ed Block</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
            >
              {saving ? 'Creating...' : 'Create Block'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
