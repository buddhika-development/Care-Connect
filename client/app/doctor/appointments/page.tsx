'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Play, AlertCircle, ArrowRight, Search } from 'lucide-react';
import {
  useDoctorAvailability,
  useMarkAvailabilityAsOngoing,
} from '@/hooks/useDoctor';
import { useAuth } from '@/context/AuthContext';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDoctorAppointmentsUIStore } from '@/store/doctorAppointmentsStore';
import { ConsultationType } from '@/types/common';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-warning-light text-warning',
  ongoing: 'bg-primary-100 text-primary',
  completed: 'bg-success-light text-success',
  cancelled: 'bg-error-light text-error',
};

const STATUS_FILTER_OPTIONS = ['all', 'scheduled', 'ongoing', 'completed', 'cancelled'] as const;
const TYPE_FILTER_OPTIONS: Array<'all' | ConsultationType> = ['all', 'physical', 'online'];

function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 skeleton rounded-2xl" />
      ))}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ConsultationType>('all');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTER_OPTIONS[number]>('all');

  const { data: availabilities = [], isLoading, isError, refetch } = useDoctorAvailability(user?.id ?? '');
  const { mutate: markOngoing, isPending: isStartingDay } = useMarkAvailabilityAsOngoing();
  const selectedDate = useDoctorAppointmentsUIStore((s) => s.selectedDate);
  const setSelectedDate = useDoctorAppointmentsUIStore((s) => s.setSelectedDate);
  const dayActionAvailabilityId = useDoctorAppointmentsUIStore((s) => s.dayActionAvailabilityId);
  const setDayActionAvailabilityId = useDoctorAppointmentsUIStore((s) => s.setDayActionAvailabilityId);

  const schedules = useMemo(() => {
    return [...availabilities]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((availability) => ({
        availabilityId: availability.id,
        date: availability.date,
        consultationType: availability.consultationType,
        totalPatients: availability.slots.filter((slot) => slot.isBooked).length,
        status: availability.status as string,
      }));
  }, [availabilities]);

  const filteredSchedules = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return schedules.filter((schedule) => {
      const matchesSearch =
        !term ||
        formatDate(schedule.date).toLowerCase().includes(term) ||
        schedule.date.toLowerCase().includes(term);

      const matchesType = typeFilter === 'all' || schedule.consultationType === typeFilter;
      const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [schedules, searchTerm, typeFilter, statusFilter]);

  const handleOpenDay = (date: string) => {
    setSelectedDate(date);
    router.push(`/doctor/appointments/${date}`);
  };

  const handleStartDay = (availabilityId: string, date: string) => {
    setDayActionAvailabilityId(availabilityId);
    markOngoing(availabilityId, {
      onSuccess: () => {
        toast.success('Day started successfully.');
        setDayActionAvailabilityId(null);
        handleOpenDay(date);
      },
      onError: (error: unknown) => {
        setDayActionAvailabilityId(null);
        const message = error instanceof Error ? error.message : 'Failed to start day.';
        toast.error(message);
      },
    });
  };

  const upcoming = filteredSchedules.filter((s) => !['completed', 'cancelled'].includes(s.status));
  const past = filteredSchedules
    .filter((s) => ['completed', 'cancelled'].includes(s.status))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">Your day-wise availability and booked sessions</p>
      </div>

      {!isLoading && schedules.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1 relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by date"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'all' | ConsultationType)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              {TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option} className="capitalize">
                  {option === 'all' ? 'All types' : option}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof STATUS_FILTER_OPTIONS[number])}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option} value={option} className="capitalize">
                  {option === 'all' ? 'All statuses' : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <ScheduleSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">Failed to load appointment days.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No availability yet"
          description="Set your availability first to receive bookings."
          action={{ label: 'Set Availability', onClick: () => router.push('/doctor/schedule') }}
        />
      ) : filteredSchedules.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching appointment days"
          description="Try a different search text or filter combination."
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((schedule) => (
                  <div
                    key={schedule.availabilityId}
                    className={cn(
                      'bg-card rounded-2xl border border-border shadow-card p-5 transition-shadow',
                      selectedDate === schedule.date ? 'ring-2 ring-primary/30' : 'hover:shadow-card-hover'
                    )}
                    onClick={() => handleOpenDay(schedule.date)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', schedule.consultationType === 'online' ? 'bg-primary-50' : 'bg-secondary')}>
                          <Calendar className={cn('w-6 h-6', schedule.consultationType === 'online' ? 'text-primary' : 'text-accent')} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text truncate">{formatDate(schedule.date)}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', schedule.consultationType === 'online' ? 'bg-primary-50 text-primary' : 'bg-secondary text-accent')}>
                              {schedule.consultationType === 'online' ? 'Online' : 'Physical'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-secondary">
                              <Users className="w-3 h-3" />
                              {schedule.totalPatients} booked patients
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', STATUS_STYLES[schedule.status])}>
                          {schedule.status}
                        </span>
                        {schedule.status === 'scheduled' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartDay(schedule.availabilityId, schedule.date);
                            }}
                            disabled={isStartingDay && dayActionAvailabilityId === schedule.availabilityId}
                            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-xl transition-all disabled:opacity-60"
                          >
                            <Play className="w-3 h-3" />
                            {isStartingDay && dayActionAvailabilityId === schedule.availabilityId ? 'Starting...' : 'Start Day'}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDay(schedule.date);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white text-xs font-medium rounded-xl transition-all"
                          >
                            Open Day
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Past</h2>
              <div className="space-y-2">
                {past.map((schedule) => (
                  <div
                    key={`${schedule.availabilityId}-past`}
                    className="flex items-center justify-between bg-card rounded-2xl border border-border shadow-card p-4 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => handleOpenDay(schedule.date)}
                  >
                    <div>
                      <p className="font-medium text-text text-sm">{formatDate(schedule.date)}</p>
                      <p className="text-xs text-text-muted">{schedule.totalPatients} booked patients · {schedule.consultationType}</p>
                    </div>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', STATUS_STYLES[schedule.status])}>
                      {schedule.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
