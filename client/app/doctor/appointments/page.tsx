'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Users, Play, AlertCircle } from 'lucide-react';
import { useDoctorDaySchedules } from '@/hooks/useDoctor';
import { DoctorDaySchedule } from '@/types/doctor';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_STYLES: Record<DoctorDaySchedule['status'], string> = {
  scheduled: 'bg-warning-light text-warning',
  ongoing: 'bg-primary-100 text-primary',
  completed: 'bg-success-light text-success',
};

function ScheduleSkeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { data: schedules, isLoading, isError, refetch } = useDoctorDaySchedules();

  const handleStartDay = (schedule: DoctorDaySchedule) => {
    toast.success('Session started.');
    router.push(`/doctor/appointments/${schedule.date}`);
  };

  const upcoming = (schedules ?? []).filter(s => s.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date));
  const past = (schedules ?? []).filter(s => s.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">Your day-wise appointment schedule</p>
      </div>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">Failed to load appointments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : (schedules ?? []).length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments yet" description="No bookings have been made for your schedule." action={{ label: 'Set Availability', onClick: () => router.push('/doctor/schedule') }} />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((schedule) => (
                  <div
                    key={`${schedule.date}-${schedule.availabilityId}`}
                    className="bg-card rounded-2xl border border-border shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-shadow"
                    onClick={() => router.push(`/doctor/appointments/${schedule.date}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', schedule.consultationType === 'online' ? 'bg-primary-50' : 'bg-secondary')}>
                          <Calendar className={cn('w-6 h-6', schedule.consultationType === 'online' ? 'text-primary' : 'text-accent')} />
                        </div>
                        <div>
                          <p className="font-semibold text-text">{formatDate(schedule.date)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', schedule.consultationType === 'online' ? 'bg-primary-50 text-primary' : 'bg-secondary text-accent')}>
                              {schedule.consultationType === 'online' ? '📹 Online' : '🏥 Physical'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-secondary">
                              <Users className="w-3 h-3" />
                              {schedule.totalPatients} patients
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full capitalize', STATUS_STYLES[schedule.status])}>
                          {schedule.status}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartDay(schedule); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-xl transition-all"
                        >
                          <Play className="w-3 h-3" />
                          Start Day
                        </button>
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
                    key={`${schedule.date}-${schedule.availabilityId}-past`}
                    className="flex items-center justify-between bg-card rounded-2xl border border-border shadow-card p-4 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => router.push(`/doctor/appointments/${schedule.date}`)}
                  >
                    <div>
                      <p className="font-medium text-text text-sm">{formatDate(schedule.date)}</p>
                      <p className="text-xs text-text-muted">{schedule.totalPatients} patients · {schedule.consultationType}</p>
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
