'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Filter, Video, AlertCircle } from 'lucide-react';
import { useAppointments, useCancelAppointment } from '@/hooks/useAppointments';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import { Appointment } from '@/types/appointment';
import { AppointmentStatus } from '@/types/common';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { differenceInHours, parseISO } from 'date-fns';
import Link from 'next/link';

const STATUS_FILTERS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function AppointmentSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 skeleton rounded w-40" />
        <div className="h-5 skeleton rounded-full w-20" />
      </div>
      <div className="h-3 skeleton rounded w-56" />
      <div className="h-3 skeleton rounded w-32" />
      <div className="flex gap-2 pt-2">
        <div className="h-9 skeleton rounded-xl flex-1" />
        <div className="h-9 skeleton rounded-xl flex-1" />
      </div>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const { mutate: cancelAppointment, isPending: cancelling } = useCancelAppointment();

  const filtered = (appointments ?? []).filter(apt => {
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSearch = !search || apt.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const canReschedule = (apt: Appointment) => {
    if (apt.status !== 'confirmed') return false;
    const hoursUntil = differenceInHours(
      parseISO(`${apt.date}T${apt.startTime}`),
      new Date()
    );
    return hoursUntil >= 24;
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelAppointment(cancelTarget.id, {
      onSuccess: () => {
        toast.success('Appointment cancelled. Refund initiated.');
        setCancelTarget(null);
        refetch();
      },
      onError: () => toast.error('Failed to cancel. Try again.'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">My Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">View and manage all your appointments</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === f.value ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <AppointmentSkeleton key={i} />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">Failed to load appointments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={statusFilter !== 'all' ? `No ${statusFilter} appointments found.` : "You don't have any appointments yet."}
          action={{ label: 'Book an Appointment', onClick: () => router.push('/patient/find-doctor') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => {
            const canRescheduleApt = canReschedule(apt);
            const isOnline = apt.consultationType === 'online';

            return (
              <div key={apt.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-text">{apt.doctorName}</p>
                    <p className="text-sm text-text-secondary">{apt.doctorSpecialization}</p>
                  </div>
                  <StatusBadge status={apt.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm text-text-secondary">
                  <span>{formatDateTime(apt.date, apt.startTime)}</span>
                  <span className={`font-medium ${isOnline ? 'text-primary' : 'text-accent'}`}>
                    {isOnline ? '📹 Online' : '🏥 Physical'}
                  </span>
                  <span>{formatCurrency(apt.fee)}</span>
                </div>

                {/* Countdown for crashed status */}
                {apt.status === 'pending' && apt.countdownExpiry && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-warning bg-warning-light px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Auto-cancelling soon — gateway crash
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border-light">
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => setCancelTarget(apt)}
                      className="px-4 py-2 text-sm rounded-xl border border-error text-error hover:bg-error-light transition-all font-medium"
                    >
                      Cancel
                    </button>
                  )}

                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        if (!canRescheduleApt) {
                          toast.error('Cannot reschedule within 24 hours of appointment.');
                        } else {
                          router.push('/patient/find-doctor');
                        }
                      }}
                      disabled={!canRescheduleApt}
                      title={!canRescheduleApt ? 'Cannot reschedule within 24 hours of appointment.' : ''}
                      className="px-4 py-2 text-sm rounded-xl border border-border text-text-secondary hover:bg-secondary transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reschedule
                    </button>
                  )}

                  {(apt.status === 'confirmed' || apt.status === 'ongoing') && isOnline && (
                    <Link
                      href={`/telemedicine/room/${apt.id}`}
                      className="px-4 py-2 text-sm rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Session
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Appointment"
        message={`This will cancel your appointment with ${cancelTarget?.doctorName}. A refund will be initiated.`}
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        variant="danger"
        isLoading={cancelling}
      />
    </div>
  );
}
