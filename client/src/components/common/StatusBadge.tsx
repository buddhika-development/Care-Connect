'use client';

import { AppointmentStatus } from '@/types/common';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string; dotClass?: string }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-success-light text-success',
  },
  pending: {
    label: 'Pending',
    className: 'bg-warning-light text-warning',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-error-light text-error',
  },
  completed: {
    label: 'Completed',
    className: 'bg-primary-50 text-primary',
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-primary-100 text-primary-dark',
    dotClass: 'bg-primary pulse-dot',
  },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        config.className,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.dotClass && (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      )}
      {config.label}
    </span>
  );
}
