'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { Modal } from '@/components/ui/Modal';
import { DEMO_FLOORS, DEMO_BLOCKS, DEMO_HOSTELS } from '@/lib/demo-data';
import { Floor, Block, Hostel } from '@/types';
import { Plus, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>(DEMO_FLOORS);
  const [blocks, setBlocks] = useState<Block[]>(DEMO_BLOCKS);
  const [hostels, setHostels] = useState<Hostel[]>(DEMO_HOSTELS);
  const [blockFilter, setBlockFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    blockId: '',
    floorNumber: 1,
    name: 'Floor 1',
  });

  const fetchData = async () => {
    try {
      const [fRes, bRes, hRes] = await Promise.all([
        fetch('/api/floors'),
        fetch('/api/blocks'),
        fetch('/api/hostels'),
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        if (fData.floors && fData.floors.length > 0) setFloors(fData.floors);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.blocks && bData.blocks.length > 0) {
          setBlocks(bData.blocks);
          if (!formData.blockId && bData.blocks[0]) {
            setFormData((prev) => ({ ...prev, blockId: bData.blocks[0].id }));
          }
        }
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        if (hData.hostels && hData.hostels.length > 0) setHostels(hData.hostels);
      }
    } catch (err) {
      console.warn('Failed to load floors data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({
          blockId: blocks[0]?.id || '',
          floorNumber: 1,
          name: 'Floor 1',
        });
        setSuccessMsg('Floor registered successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Error creating floor:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredFloors = floors.filter((f) => {
    if (hostelFilter && f.hostelName !== hostelFilter && f.hostelId !== hostelFilter) return false;
    if (blockFilter && f.blockName !== blockFilter && f.blockId !== blockFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !f.blockName.toLowerCase().includes(query) &&
        !f.hostelName.toLowerCase().includes(query) &&
        !String(f.floorNumber).includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hostel Floors"
          subtitle="Floor level capacity, room counts, and facilities mapping"
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Floor
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
        searchPlaceholder="Search floor, block, or hostel..."
        filters={[
          {
            key: 'hostel',
            placeholder: 'All Hostels',
            value: hostelFilter,
            onChange: setHostelFilter,
            options: hostels.map((h) => ({ label: h.name, value: h.name })),
          },
          {
            key: 'block',
            placeholder: 'All Blocks',
            value: blockFilter,
            onChange: setBlockFilter,
            options: blocks.map((b) => ({ label: `${b.name} (${b.hostelName})`, value: b.name })),
          },
        ]}
      />

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Block</th>
                <th className="py-3 px-4">Hostel</th>
                <th className="py-3 px-4">Rooms on Floor</th>
                <th className="py-3 px-4">Total Beds</th>
                <th className="py-3 px-4">Occupied Beds</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFloors.map((floor) => {
                const available =
                  floor.availableBeds !== undefined
                    ? floor.availableBeds
                    : Math.max(0, floor.totalBeds - floor.occupiedBeds);

                return (
                  <tr key={floor.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">Floor {floor.floorNumber}</p>
                      {floor.name && floor.name !== `Floor ${floor.floorNumber}` && (
                        <span className="text-[10px] text-slate-400">{floor.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{floor.blockName}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{floor.hostelName}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{floor.roomCount} Rooms</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{floor.totalBeds} Beds</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{floor.occupiedBeds} Beds</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{available} Beds</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/rooms?floor=${floor.floorNumber}&block=${encodeURIComponent(floor.blockName)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        <span>Inspect</span>
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

      {/* Add Floor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Floor"
        subtitle="Register a floor level layout within a hostel residential block"
      >
        <form onSubmit={handleCreateFloor} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Block</label>
            <select
              required
              value={formData.blockId}
              onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.hostelName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor Number</label>
              <input
                type="number"
                required
                min="0"
                max="25"
                value={formData.floorNumber}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  setFormData({
                    ...formData,
                    floorNumber: num,
                    name: num === 0 ? 'Ground Floor' : `Floor ${num}`,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Floor Display Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
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
              {saving ? 'Creating...' : 'Create Floor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
