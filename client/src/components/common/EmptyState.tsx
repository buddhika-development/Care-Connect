'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl text-sm transition-all shadow-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
