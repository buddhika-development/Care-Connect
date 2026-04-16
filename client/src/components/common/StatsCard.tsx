'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

const COLOR_MAP = {
  primary: 'bg-primary-50 text-primary',
  accent: 'bg-secondary text-accent',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
};

export default function StatsCard({ label, value, icon: Icon, trend, trendUp, color = 'primary' }: StatsCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', COLOR_MAP[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', trendUp ? 'bg-success-light text-success' : 'bg-error-light text-error')}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
    </div>
  );
}
