'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Play, Users, AlertCircle, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDoctorDayAppointments, useStartSession } from '@/hooks/useAppointments';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );
}

export default function DoctorDayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: appointments, isLoading, isError, refetch } = useDoctorDayAppointments(user?.id ?? '', date);
  const { mutate: startSession, isPending } = useStartSession();

  const handleStartSession = (appointmentId: string) => {
    startSession(appointmentId, {
      onSuccess: () => {
        toast.success('Session started.');
        router.push(`/doctor/session/${appointmentId}`);
      },
      onError: () => toast.error('Failed to start session.'),
    });
  };

  const displayDate = (() => {
    try {
      return format(parseISO(date), 'EEEE, dd MMMM yyyy');
    } catch {
      return date;
    }
  })();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header with back + breadcrumb */}
      <div>
        <button
          onClick={() => router.push('/doctor/appointments')}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </button>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <nav className="text-xs text-text-muted mb-1">
              Appointments / <span className="text-text">{formatDate(date)}</span>
            </nav>
            <h1 className="text-2xl font-bold text-text">{displayDate}</h1>
          </div>
        </div>
      </div>

      {/* Summary */}
      {appointments && appointments.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-card">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text">{appointments.length} patients scheduled</p>
            <p className="text-sm text-text-secondary capitalize">{appointments[0].consultationType} consultation</p>
          </div>
        </div>
      )}

      {/* Appointment list */}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">Failed to load appointments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : (appointments ?? []).length === 0 ? (
        <EmptyState icon={Users} title="No patients booked" description="No patients have booked for this day yet." action={{ label: 'Back to Schedule', onClick: () => router.push('/doctor/appointments') }} />
      ) : (
        <div className="space-y-3">
          {(appointments ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((apt, idx) => (
            <div key={apt.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-sm font-bold text-text-muted">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">{apt.patientName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{formatTime(apt.startTime)} – {formatTime(apt.endTime)}</span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {apt.consultationType === 'online' && (
                    <button
                      onClick={() => router.push(`/telemedicine/room/${apt.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white text-xs font-medium rounded-xl transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Video
                    </button>
                  )}
                  <button
                    onClick={() => handleStartSession(apt.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-xl transition-all disabled:opacity-60"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
