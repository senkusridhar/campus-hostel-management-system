'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_HOSTELS } from '@/lib/demo-data';
import { Hostel } from '@/types';
import { Building, Phone, User, Plus, Edit, Layers, DoorOpen, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>(DEMO_HOSTELS);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    gender: 'Boys',
    address: '',
    capacity: 700,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchHostels = async () => {
    try {
      const res = await fetch('/api/hostels');
      if (res.ok) {
        const data = await res.json();
        if (data.hostels && data.hostels.length > 0) {
          setHostels(data.hostels);
        }
      }
    } catch (err) {
      console.warn('Failed to load hostels from API, displaying standard records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          code: formData.code,
          genderCategory: formData.gender,
          address: formData.address,
          capacity: Number(formData.capacity),
          isActive: formData.isActive,
        }),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({ name: '', code: '', gender: 'Boys', address: '', capacity: 700, isActive: true });
        setSuccessMsg('Hostel registered successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchHostels();
      }
    } catch (err) {
      console.error('Error creating hostel:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHostel) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hostels/${editingHostel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingHostel.name,
          code: editingHostel.code,
          genderCategory: editingHostel.gender,
          address: editingHostel.address,
          capacity: Number(editingHostel.capacity),
          isActive: editingHostel.isActive,
        }),
      });
      if (res.ok) {
        setEditingHostel(null);
        setSuccessMsg('Hostel updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchHostels();
      }
    } catch (err) {
      console.error('Error updating hostel:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hostels Directory"
          subtitle="Overview of institutional residential complexes, warden assignments, and capacity"
        />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Hostel
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hostels.map((hostel) => {
          const occupancyPct =
            hostel.capacity > 0
              ? Math.min(100, Math.round((hostel.occupied / hostel.capacity) * 100))
              : 0;

          return (
            <div
              key={hostel.id}
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-700" />
                    <h2 className="text-lg font-bold text-slate-900">{hostel.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                      {hostel.code}
                    </span>
                    <button
                      onClick={() => setEditingHostel(hostel)}
                      title="Edit Hostel Details"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                    <span className="font-bold text-slate-800 text-xs">{hostel.gender}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Capacity</span>
                    <span className="font-bold text-slate-800 text-xs">{hostel.capacity} Beds</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Available</span>
                    <span className="font-bold text-emerald-800 text-xs">{hostel.available} Beds</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Occupancy Rate ({hostel.occupied} Occupied)</span>
                    <span>{occupancyPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-slate-800 h-2 rounded-full" style={{ width: `${occupancyPct}%` }} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Warden: <strong>{hostel.wardenName || 'Chief Warden'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone: {hostel.wardenPhone || '+91 98000 00002'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {hostel.blocksCount || 3} Blocks
                  </span>
                  {hostel.roomsCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5" />
                      {hostel.roomsCount} Rooms
                    </span>
                  )}
                </div>
                <Link
                  href={`/rooms?hostel=${encodeURIComponent(hostel.name)}`}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Manage Rooms &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Hostel Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Hostel"
        subtitle="Add a new residential complex to campus management database"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hostel Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Boys Hostel B"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hostel Code</label>
              <input
                type="text"
                required
                placeholder="e.g. BHB"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender Category</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Boys">Boys Hostel</option>
                <option value="Girls">Girls Hostel</option>
                <option value="Co-Ed">Co-Ed Hostel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Bed Capacity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Address / Campus Location</label>
            <input
              type="text"
              placeholder="e.g. South Campus Residential Enclave"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
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
              {saving ? 'Creating...' : 'Register Hostel'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Hostel Modal */}
      <Modal
        isOpen={!!editingHostel}
        onClose={() => setEditingHostel(null)}
        title={`Edit Hostel - ${editingHostel?.name || ''}`}
        subtitle="Update residential capacity, category, and configuration"
      >
        {editingHostel && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hostel Name</label>
              <input
                type="text"
                required
                value={editingHostel.name}
                onChange={(e) => setEditingHostel({ ...editingHostel, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hostel Code</label>
                <input
                  type="text"
                  required
                  value={editingHostel.code}
                  onChange={(e) =>
                    setEditingHostel({ ...editingHostel, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender Category</label>
                <select
                  value={editingHostel.gender}
                  onChange={(e) => setEditingHostel({ ...editingHostel, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="Boys">Boys Hostel</option>
                  <option value="Girls">Girls Hostel</option>
                  <option value="Co-Ed">Co-Ed Hostel</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Bed Capacity</label>
              <input
                type="number"
                required
                min="1"
                value={editingHostel.capacity}
                onChange={(e) =>
                  setEditingHostel({ ...editingHostel, capacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address / Location</label>
              <input
                type="text"
                value={editingHostel.address || ''}
                onChange={(e) => setEditingHostel({ ...editingHostel, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingHostel(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
