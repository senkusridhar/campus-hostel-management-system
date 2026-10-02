'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Inbox, Loader2, ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading records from database...',
  className = '',
}) => {
  return (
    <div
      className={`p-8 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center text-slate-600 ${className}`}
    >
      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-3" />
      <p className="text-xs font-semibold text-slate-800">{message}</p>
      <p className="text-[11px] text-slate-400 mt-1">Connecting to institutional ledger</p>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active records matching your current filter criteria.',
  icon: Icon = Inbox,
  actionText,
  actionHref,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs"
        >
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-2xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Database Connection Issue',
  message = 'Unable to synchronize records from the server. Please verify network connectivity or retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-6 bg-rose-50/70 rounded-lg border border-rose-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 rounded-md text-rose-700 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">{title}</h4>
          <p className="text-xs text-rose-700 mt-0.5 max-w-lg">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};

interface PermissionDeniedStateProps {
  role?: string;
  attemptedResource?: string;
  className?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  role = 'USER',
  attemptedResource = 'this administrative resource',
  className = '',
}) => {
  return (
    <div
      className={`p-8 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">Institutional Access Restricted</h3>
      <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 leading-relaxed">
        Your assigned role (<span className="font-mono font-bold text-slate-700">{role}</span>) does not possess institutional authorization to view or manage {attemptedResource}.
      </p>
      <Link
        href="/dashboard"
        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Portal Dashboard
      </Link>
    </div>
  );
};
