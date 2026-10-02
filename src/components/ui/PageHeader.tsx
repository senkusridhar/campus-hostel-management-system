import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200 sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="mt-4 sm:mt-0 flex items-center gap-3">{actions}</div>}
    </div>
  );
};
