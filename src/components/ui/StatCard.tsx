import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    type: 'positive' | 'neutral' | 'warning' | 'danger';
  };
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (badge?.type) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="p-2 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle()}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
          {trend && <span className="font-medium text-slate-700">{trend}</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
