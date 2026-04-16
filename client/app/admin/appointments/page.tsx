'use client';

import { useState } from 'react';
import { Search, Calendar, Filter } from 'lucide-react';
import { useAdminAppointments } from '@/hooks/useAppointments';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { AppointmentStatus } from '@/types/common';
import { cn } from '@/lib/utils';

const STATUS_FILTERS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function RowSkeleton() {
  return <div className="h-16 skeleton rounded-xl" />;
}

export default function AdminAppointmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const { data: appointments, isLoading, isError, refetch } = useAdminAppointments();

  const filtered = (appointments ?? []).filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch = !search || apt.patientName.toLowerCase().includes(search.toLowerCase()) || apt.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">All Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">Monitor all platform appointments across patients and doctors</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or doctor..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === f.value ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && !isError && (
        <p className="text-sm text-text-secondary">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''} found</p>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <RowSkeleton key={i} />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">Failed to load appointments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments found" description="No appointments match your search criteria." action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setStatusFilter('all'); } }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Doctor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Date & Time</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Fee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(apt => (
                  <tr key={apt.id} className="hover:bg-secondary transition-colors">
                    <td className="px-5 py-3 font-medium text-text">{apt.patientName}</td>
                    <td className="px-5 py-3 text-text-secondary">{apt.doctorName}</td>
                    <td className="px-5 py-3 text-text-secondary">{formatDateTime(apt.date, apt.startTime)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', apt.consultationType === 'online' ? 'bg-primary-50 text-primary' : 'bg-secondary text-accent')}>
                        {apt.consultationType === 'online' ? '📹 Online' : '🏥 Physical'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text">{formatCurrency(apt.fee)}</td>
                    <td className="px-5 py-3"><StatusBadge status={apt.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
