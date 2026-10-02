import React from 'react';
import { Search } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSelect {
  key: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelect[];
  extraActions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  extraActions,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
      <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {onSearchChange && (
          <div className="relative flex-1 max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        )}

        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="">{filter.placeholder}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {extraActions && <div className="flex items-center gap-2">{extraActions}</div>}
    </div>
  );
};
