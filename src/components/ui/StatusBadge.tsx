import React from 'react';

export type StatusVariant =
  | 'active'
  | 'approved'
  | 'verified'
  | 'paid'
  | 'resolved'
  | 'vacant'
  | 'good'
  | 'pending'
  | 'partially_occupied'
  | 'assigned'
  | 'in_progress'
  | 'applied'
  | 'fair'
  | 'absent'
  | 'flagged'
  | 'rejected'
  | 'overdue'
  | 'expired'
  | 'suspended'
  | 'damaged'
  | 'missing'
  | 'repair_required'
  | 'maintenance'
  | 'on_leave'
  | 'outside'
  | 'important'
  | 'occupied'
  | 'full'
  | 'reserved'
  | 'blocked'
  | 'transferred'
  | 'cancelled'
  | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
}) => {
  // Infer variant if not provided
  const normalized = (variant || status.toLowerCase().replace(/\s+/g, '_')) as StatusVariant;

  const getStyle = (): string => {
    switch (normalized) {
      case 'active':
      case 'approved':
      case 'verified':
      case 'paid':
      case 'resolved':
      case 'vacant':
      case 'good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'pending':
      case 'partially_occupied':
      case 'assigned':
      case 'in_progress':
      case 'applied':
      case 'fair':
      case 'reserved':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'absent':
      case 'flagged':
      case 'rejected':
      case 'overdue':
      case 'expired':
      case 'suspended':
      case 'damaged':
      case 'missing':
      case 'repair_required':
      case 'blocked':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'maintenance':
      case 'on_leave':
      case 'outside':
      case 'important':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      case 'occupied':
      case 'full':
        return 'bg-slate-100 text-slate-800 border-slate-300 font-semibold';

      case 'transferred':
      case 'cancelled':
        return 'bg-slate-50 text-slate-500 border-slate-200';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${padding} ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {status}
    </span>
  );
};
