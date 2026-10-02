'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { DEMO_ROOMS, DEMO_HOSTELS } from '@/lib/demo-data';
import { Room, Hostel, Block, Floor, RoomAssetItem } from '@/types';
import {
  BedDouble,
  Users,
  Wrench,
  Shield,
  Check,
  Info,
  Plus,
  UserPlus,
  UserMinus,
  CheckCircle,
  AlertTriangle,
  Lock,
  Tag,
  Clock,
} from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(DEMO_ROOMS);
  const [hostels, setHostels] = useState<Hostel[]>(DEMO_HOSTELS);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);

  // Filter States
  const [hostelFilter, setHostelFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Selected Room
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Form States
  const [newRoomData, setNewRoomData] = useState({
    floorId: '',
    roomNumber: '',
    roomType: 'Double Occupancy',
    capacity: 2,
    genderCategory: 'Boys',
  });

  const [allocData, setAllocData] = useState({
    studentId: 'STU2024099',
    reason: 'Regular semester room allocation',
  });

  const [assetFormData, setAssetFormData] = useState({
    assetType: 'Study Table',
    quantity: 1,
    condition: 'GOOD',
    notes: '',
  });

  const [maintenanceReason, setMaintenanceReason] = useState(
    'Plumbing & electrical fixture maintenance'
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showNotification = (text: string, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      const [rRes, hRes, bRes, fRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/hostels'),
        fetch('/api/blocks'),
        fetch('/api/floors'),
      ]);

      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.rooms && rData.rooms.length > 0) {
          setRooms(rData.rooms);
          if (selectedRoom) {
            const updatedSelected = rData.rooms.find((r: Room) => r.id === selectedRoom.id);
            if (updatedSelected) setSelectedRoom(updatedSelected);
          }
        }
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        if (hData.hostels) setHostels(hData.hostels);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.blocks) setBlocks(bData.blocks);
      }
      if (fRes.ok) {
        const fData = await fRes.json();
        if (fData.floors) {
          setFloors(fData.floors);
          if (!newRoomData.floorId && fData.floors[0]) {
            setNewRoomData((prev) => ({ ...prev, floorId: fData.floors[0].id }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load live rooms from API:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered rooms logic
  const filteredRooms = rooms.filter((room) => {
    if (hostelFilter && room.hostelName !== hostelFilter && room.hostelId !== hostelFilter)
      return false;
    if (blockFilter && room.block !== blockFilter && room.blockId !== blockFilter) return false;
    if (floorFilter && String(room.floor) !== floorFilter && room.floorId !== floorFilter)
      return false;
    if (statusFilter) {
      const normFilter = statusFilter.toUpperCase().replace(/\s+/g, '_');
      const normStatus = String(room.status).toUpperCase().replace(/\s+/g, '_');
      if (normFilter === 'OCCUPIED' || normFilter === 'FULL') {
        if (normStatus !== 'OCCUPIED' && normStatus !== 'FULL') return false;
      } else if (normFilter !== normStatus) {
        return false;
      }
    }
    if (genderFilter && room.genderCategory !== genderFilter) return false;
    if (
      searchQuery &&
      !room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !room.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !room.block.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusCardBorder = (status: string) => {
    const norm = String(status).toUpperCase().replace(/\s+/g, '_');
    switch (norm) {
      case 'OCCUPIED':
      case 'FULL':
        return 'border-slate-300 bg-white hover:border-slate-400';
      case 'PARTIALLY_OCCUPIED':
        return 'border-amber-200 bg-amber-50/40 hover:border-amber-300';
      case 'VACANT':
        return 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300';
      case 'MAINTENANCE':
        return 'border-purple-200 bg-purple-50/40 hover:border-purple-300';
      case 'RESERVED':
        return 'border-blue-200 bg-blue-50/40 hover:border-blue-300';
      case 'BLOCKED':
        return 'border-rose-200 bg-rose-50/40 hover:border-rose-300';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoomData),
      });
      if (res.ok) {
        setIsAddRoomModalOpen(false);
        setNewRoomData({
          floorId: floors[0]?.id || '',
          roomNumber: '',
          roomType: 'Double Occupancy',
          capacity: 2,
          genderCategory: 'Boys',
        });
        showNotification('Room registered successfully with standard inventory.');
        await fetchAllData();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Failed to create room.', true);
      }
    } catch (err) {
      showNotification('Network error while creating room.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAllocateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: allocData.studentId,
          roomId: selectedRoom.id,
          reason: allocData.reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsAllocateModalOpen(false);
        showNotification(data.message || 'Resident allocated successfully.');
        await fetchAllData();
      } else {
        showNotification(data.error || 'Allocation rejected.', true);
      }
    } catch (err) {
      showNotification('Network error during allocation.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeallocateStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to deallocate this resident from the room?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/allocations/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Student deallocated successfully.');
        await fetchAllData();
      } else {
        showNotification(data.error || 'Deallocation failed.', true);
      }
    } catch (err) {
      showNotification('Network error during deallocation.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedRoom) return;
    setActionLoading(true);
    const isCurrentlyMaint =
      String(selectedRoom.status).toUpperCase().replace(/\s+/g, '_') === 'MAINTENANCE';

    try {
      const res = await fetch(`/api/rooms/${selectedRoom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_MAINTENANCE',
          isMaintenance: !isCurrentlyMaint,
          reason: !isCurrentlyMaint ? maintenanceReason : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsMaintenanceModalOpen(false);
        showNotification(data.message || 'Room status updated.');
        await fetchAllData();
      } else {
        showNotification(data.error || 'Failed to update maintenance status.', true);
      }
    } catch (err) {
      showNotification('Error updating maintenance status.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${selectedRoom.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetFormData),
      });
      if (res.ok) {
        setIsAssetModalOpen(false);
        setAssetFormData({ assetType: 'Study Table', quantity: 1, condition: 'GOOD', notes: '' });
        showNotification('Room asset inventory item added.');
        await fetchAllData();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Failed to add asset.', true);
      }
    } catch (err) {
      showNotification('Error adding room asset.', true);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Room Management & Matrix"
          subtitle="Visual room allocation matrix, resident assignment, and inventory inspection"
        />
        <button
          onClick={() => setIsAddRoomModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {actionMsg && (
        <div
          className={`mb-4 p-3 rounded-md text-xs flex items-center gap-2 border ${
            actionMsg.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionMsg.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search room number, hostel, or block..."
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
          {
            key: 'floor',
            placeholder: 'All Floors',
            value: floorFilter,
            onChange: setFloorFilter,
            options: [
              { label: 'Floor 1', value: '1' },
              { label: 'Floor 2', value: '2' },
              { label: 'Floor 3', value: '3' },
              { label: 'Floor 4', value: '4' },
            ],
          },
          {
            key: 'status',
            placeholder: 'All Statuses',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Vacant', value: 'VACANT' },
              { label: 'Partially Occupied', value: 'PARTIALLY_OCCUPIED' },
              { label: 'Occupied / Full', value: 'OCCUPIED' },
              { label: 'Maintenance', value: 'MAINTENANCE' },
              { label: 'Reserved', value: 'RESERVED' },
              { label: 'Blocked', value: 'BLOCKED' },
            ],
          },
          {
            key: 'gender',
            placeholder: 'All Categories',
            value: genderFilter,
            onChange: setGenderFilter,
            options: [
              { label: 'Boys', value: 'Boys' },
              { label: 'Girls', value: 'Girls' },
              { label: 'Co-Ed', value: 'Co-Ed' },
            ],
          },
        ]}
      />

      {/* Visual Room Matrix Grid */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Room Matrix Grid</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredRooms.length} rooms • Click any room tile to inspect details, allocate
              residents, or update assets
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span>Vacant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span>Partially Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 border border-slate-400" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            No rooms match your filter criteria. Try resetting filters or adding a new room.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-4 rounded-lg border text-left transition-all shadow-2xs hover:shadow-md cursor-pointer ${getStatusCardBorder(
                  room.status
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">Room {room.roomNumber}</span>
                  <BedDouble className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {room.occupied} / {room.capacity} Beds
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {room.hostelName} • {room.block}
                </p>
                <div className="mt-3">
                  <StatusBadge status={room.status} size="sm" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Room Details Modal */}
      <Modal
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        title={`Room Details - Room ${selectedRoom?.roomNumber || ''}`}
        subtitle={`${selectedRoom?.hostelName || ''} • ${selectedRoom?.block || ''} • Floor ${selectedRoom?.floor || ''} (${selectedRoom?.genderCategory || 'General'})`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="px-3 py-1.5 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md text-xs font-semibold flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                {String(selectedRoom?.status).toUpperCase().replace(/\s+/g, '_') === 'MAINTENANCE'
                  ? 'Complete Maintenance'
                  : 'Mark Maintenance'}
              </button>
              {selectedRoom && selectedRoom.occupied < selectedRoom.capacity && (
                <button
                  onClick={() => setIsAllocateModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-md text-xs font-semibold flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Allocate Student
                </button>
              )}
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedRoom && (
          <div className="space-y-5 text-xs">
            {/* Overview Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Room Type
                </span>
                <span className="font-bold text-slate-800">{selectedRoom.roomType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Total Capacity
                </span>
                <span className="font-bold text-slate-800">{selectedRoom.capacity} Beds</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Occupancy
                </span>
                <span className="font-bold text-slate-800">
                  {selectedRoom.occupied} Beds ({selectedRoom.capacity - selectedRoom.occupied} Available)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                  Current Status
                </span>
                <StatusBadge status={selectedRoom.status} size="sm" />
              </div>
            </div>

            {selectedRoom.maintenanceReason && (
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-md flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold block">Maintenance Flagged</span>
                  <span className="text-[11px] text-purple-700">{selectedRoom.maintenanceReason}</span>
                </div>
              </div>
            )}

            {/* Assigned Residents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Assigned Residents ({selectedRoom.assignedStudents.length})
                </h4>
              </div>

              {selectedRoom.assignedStudents.length > 0 ? (
                <div className="space-y-2">
                  {selectedRoom.assignedStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between hover:bg-slate-50/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{st.name}</p>
                          <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold text-slate-700 rounded">
                            {st.bedNo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {st.studentId} • {st.department} • {st.academicYear || '3rd Year'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeallocateStudent(st.id)}
                        title="Deallocate resident"
                        className="px-2.5 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-[11px] font-semibold flex items-center gap-1"
                      >
                        <UserMinus className="w-3 h-3" />
                        Deallocate
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">
                  No students currently assigned to this room.
                </p>
              )}
            </div>

            {/* Room Assets / Inventory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                  <Info className="w-3.5 h-3.5 text-slate-500" />
                  Room Inventory & Assets
                </h4>
                <button
                  onClick={() => setIsAssetModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Asset
                </button>
              </div>

              {selectedRoom.detailedAssets && selectedRoom.detailedAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRoom.detailedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {asset.quantity}x {asset.assetType}
                        </span>
                        {asset.notes && (
                          <span className="text-[10px] text-slate-400 block">{asset.notes}</span>
                        )}
                      </div>
                      <StatusBadge status={asset.condition} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.assets.map((asset, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-700 flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{asset}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        title="Add New Room"
        subtitle="Register a new residential room under a floor"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Floor</label>
            <select
              required
              value={newRoomData.floorId}
              onChange={(e) => setNewRoomData({ ...newRoomData, floorId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  Floor {f.floorNumber} — {f.blockName} ({f.hostelName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 301"
                value={newRoomData.roomNumber}
                onChange={(e) => setNewRoomData({ ...newRoomData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room Type</label>
              <select
                value={newRoomData.roomType}
                onChange={(e) => {
                  const type = e.target.value;
                  let cap = 2;
                  if (type.includes('Single')) cap = 1;
                  else if (type.includes('Triple')) cap = 3;
                  else if (type.includes('Four')) cap = 4;
                  setNewRoomData({ ...newRoomData, roomType: type, capacity: cap });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Single Occupancy">Single Occupancy (1 Bed)</option>
                <option value="Double Occupancy">Double Occupancy (2 Beds)</option>
                <option value="Triple Occupancy">Triple Occupancy (3 Beds)</option>
                <option value="Four-bed Occupancy">Four-bed Occupancy (4 Beds)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Capacity (Beds)</label>
              <input
                type="number"
                required
                min="1"
                max="8"
                value={newRoomData.capacity}
                onChange={(e) =>
                  setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender Restriction</label>
              <select
                value={newRoomData.genderCategory}
                onChange={(e) =>
                  setNewRoomData({ ...newRoomData, genderCategory: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Boys">Boys Only</option>
                <option value="Girls">Girls Only</option>
                <option value="Co-Ed">Co-Ed</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddRoomModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
            >
              {actionLoading ? 'Creating...' : 'Register Room'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate Student Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Resident - Room ${selectedRoom?.roomNumber || ''}`}
        subtitle="Assign an eligible student to an available bed in this room"
      >
        <form onSubmit={handleAllocateStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
            <select
              required
              value={allocData.studentId}
              onChange={(e) => setAllocData({ ...allocData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="STU2024099">Karan Mehta (STU2024099 - CSE 1st Year)</option>
              <option value="stu-demo-02">Amit Verma (STU2024018 - ME 3rd Year)</option>
              <option value="stu-demo-03">Vikas Sharma (STU2024033 - CE 2nd Year)</option>
              <option value="demo-student-01">Rahul Kumar (STU2024012 - CSE 3rd Year)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Allocation Reason / Notes</label>
            <input
              type="text"
              required
              value={allocData.reason}
              onChange={(e) => setAllocData({ ...allocData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAllocateModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-semibold"
            >
              {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Maintenance Toggle Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title={`Room Maintenance - Room ${selectedRoom?.roomNumber || ''}`}
        subtitle="Manage maintenance status and inspection reason"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            {String(selectedRoom?.status).toUpperCase().replace(/\s+/g, '_') === 'MAINTENANCE'
              ? 'Marking maintenance completed will restore the room status according to its actual bed allocations.'
              : 'Marking this room under maintenance will block new resident allocations until repairs are completed.'}
          </p>

          {String(selectedRoom?.status).toUpperCase().replace(/\s+/g, '_') !== 'MAINTENANCE' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Reason</label>
              <textarea
                rows={3}
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleMaintenance}
              disabled={actionLoading}
              className="px-4 py-1.5 bg-purple-700 text-white rounded hover:bg-purple-600 font-semibold"
            >
              {actionLoading
                ? 'Updating...'
                : String(selectedRoom?.status).toUpperCase().replace(/\s+/g, '_') === 'MAINTENANCE'
                ? 'Mark Completed'
                : 'Confirm Maintenance'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Asset Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={`Add Inventory Asset - Room ${selectedRoom?.roomNumber || ''}`}
        subtitle="Add a furniture or electrical fixture item to this room"
      >
        <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Type</label>
              <input
                type="text"
                required
                placeholder="e.g. Study Table, Fan"
                value={assetFormData.assetType}
                onChange={(e) => setAssetFormData({ ...assetFormData, assetType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={assetFormData.quantity}
                onChange={(e) =>
                  setAssetFormData({ ...assetFormData, quantity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Condition</label>
            <select
              value={assetFormData.condition}
              onChange={(e) => setAssetFormData({ ...assetFormData, condition: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
              <option value="REPAIR_REQUIRED">Repair Required</option>
              <option value="MISSING">Missing</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Serial Number</label>
            <input
              type="text"
              placeholder="e.g. SN-40912 - inspected this semester"
              value={assetFormData.notes}
              onChange={(e) => setAssetFormData({ ...assetFormData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-semibold"
            >
              {actionLoading ? 'Saving...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
