'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Play, Users, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  useDoctorAvailability,
  useMarkAvailabilityAsCompleted,
  useMarkAvailabilityAsOngoing,
  doctorKeys,
} from '@/hooks/useDoctor';
import { useDoctorDayAppointments, useStartSession } from '@/hooks/useAppointments';
import { getSessionPatientInfo } from '@/services/doctorService';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TelemedicineJoinButton from '@/components/common/TelemedicineJoinButton';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useDoctorAppointmentsUIStore } from '@/store/doctorAppointmentsStore';

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 skeleton rounded-2xl" />
      ))}
    </div>
  );
}

const STARTABLE_APPOINTMENT_STATUSES = new Set(['confirmed', 'rescheduled']);
const RESUMABLE_APPOINTMENT_STATUSES = new Set(['ongoing']);
const VIEWABLE_APPOINTMENT_STATUSES = new Set(['completed']);

export default function DoctorDayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [showCompleteDayDialog, setShowCompleteDayDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

  const { data: availabilities = [], isLoading: isAvailabilityLoading } = useDoctorAvailability(user?.id ?? '');
  const {
    data: appointments = [],
    isLoading: isAppointmentsLoading,
    isError,
    refetch,
  } = useDoctorDayAppointments(user?.id ?? '', date);
  const { mutate: startSession, isPending: isStartingSession } = useStartSession();
  const { mutate: markOngoing, isPending: isStartingDay } = useMarkAvailabilityAsOngoing();
  const { mutate: markCompleted, isPending: isCompletingDay } = useMarkAvailabilityAsCompleted();

  const setSelectedDate = useDoctorAppointmentsUIStore((s) => s.setSelectedDate);
  const dayActionAvailabilityId = useDoctorAppointmentsUIStore((s) => s.dayActionAvailabilityId);
  const setDayActionAvailabilityId = useDoctorAppointmentsUIStore((s) => s.setDayActionAvailabilityId);

  const selectedAvailability = useMemo(
    () => availabilities.find((availability) => availability.date === date) ?? null,
    [availabilities, date],
  );

  const appointmentsForDate = useMemo(() => {
    if (!selectedAvailability) return [];

    const slotIds = new Set(selectedAvailability.slots.map((slot) => slot.id));
    return appointments.filter((appointment) => slotIds.has(appointment.slotId));
  }, [appointments, selectedAvailability]);

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, (typeof appointmentsForDate)[number]>();
    for (const appointment of appointmentsForDate) {
      map.set(appointment.slotId, appointment);
    }
    return map;
  }, [appointmentsForDate]);

  const orderedBookedEntries = useMemo(() => {
    if (!selectedAvailability) return [];

    return selectedAvailability.slots
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((slot) => ({ slot, appointment: appointmentsBySlot.get(slot.id) ?? null }))
      .filter((entry) => !!entry.appointment);
  }, [selectedAvailability, appointmentsBySlot]);

  const patientQueries = useQueries({
    queries: orderedBookedEntries.map((entry) => ({
      queryKey: doctorKeys.sessionPatient(entry.appointment!.id),
      queryFn: () => getSessionPatientInfo(entry.appointment!.id),
      enabled: !!entry.appointment?.id,
      staleTime: 30_000,
    })),
  });

  const patientByAppointmentId = useMemo(() => {
    const map = new Map<string, { firstName: string; lastName: string }>();
    for (let i = 0; i < orderedBookedEntries.length; i += 1) {
      const appointment = orderedBookedEntries[i].appointment;
      const patient = patientQueries[i]?.data;
      if (!appointment) continue;
      map.set(appointment.id, {
        firstName: patient?.firstName ?? 'Patient',
        lastName: patient?.lastName ?? appointment.patientId.slice(0, 6),
      });
    }
    return map;
  }, [orderedBookedEntries, patientQueries]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set<string>();
    for (const entry of orderedBookedEntries) {
      if (entry.appointment?.status) uniqueStatuses.add(entry.appointment.status);
    }
    return ['all', ...Array.from(uniqueStatuses).sort()];
  }, [orderedBookedEntries]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orderedBookedEntries.filter((entry) => {
      const appointment = entry.appointment!;
      const patient = patientByAppointmentId.get(appointment.id);
      const fullName = patient
        ? `${patient.firstName} ${patient.lastName}`.trim().toLowerCase()
        : `patient ${appointment.patientId.slice(0, 6)}`.toLowerCase();

      const matchesSearch = !term || fullName.includes(term);
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orderedBookedEntries, patientByAppointmentId, searchTerm, statusFilter]);

  const handleStartSession = (appointmentId: string) => {
    if (selectedAvailability?.status !== 'ongoing') {
      toast.error('Start the day before starting individual patient sessions.');
      return;
    }

    startSession(appointmentId, {
      onSuccess: () => {
        toast.success('Session started.');
        router.push(`/doctor/session/${appointmentId}`);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Failed to start session.';
        toast.error(message);
      },
    });
  };

  const handleOpenSession = (appointmentId: string) => {
    router.push(`/doctor/session/${appointmentId}`);
  };

  const handleStartDay = () => {
    if (!selectedAvailability) return;

    setDayActionAvailabilityId(selectedAvailability.id);
    markOngoing(selectedAvailability.id, {
      onSuccess: () => {
        setDayActionAvailabilityId(null);
        toast.success('Day started successfully.');
      },
      onError: (error) => {
        setDayActionAvailabilityId(null);
        const message = error instanceof Error ? error.message : 'Failed to start day.';
        toast.error(message);
      },
    });
  };

  const handleCompleteDay = () => {
    if (!selectedAvailability) return;

    setDayActionAvailabilityId(selectedAvailability.id);
    markCompleted(selectedAvailability.id, {
      onSuccess: () => {
        setDayActionAvailabilityId(null);
        setShowCompleteDayDialog(false);
        toast.success('Availability marked as completed.');
        router.push('/doctor/appointments');
      },
      onError: (error) => {
        setDayActionAvailabilityId(null);
        const message = error instanceof Error ? error.message : 'Failed to mark day as completed.';
        toast.error(message);
      },
    });
  };

  const displayDate = (() => {
    try {
      return format(parseISO(date), 'EEEE, dd MMMM yyyy');
    } catch {
      return date;
    }
  })();

  const isLoading = isAvailabilityLoading || isAppointmentsLoading;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button
          onClick={() => {
            setSelectedDate(date);
            router.push('/doctor/appointments');
          }}
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

          {selectedAvailability && (
            <>
              {selectedAvailability.status === 'scheduled' && (
                <button
                  onClick={handleStartDay}
                  disabled={isStartingDay && dayActionAvailabilityId === selectedAvailability.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-medium disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  {isStartingDay && dayActionAvailabilityId === selectedAvailability.id ? 'Starting...' : 'Start Day'}
                </button>
              )}
              {selectedAvailability.status === 'ongoing' && (
                <button
                  onClick={() => setShowCompleteDayDialog(true)}
                  disabled={isCompletingDay && dayActionAvailabilityId === selectedAvailability.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-white hover:bg-green-700 text-sm font-medium disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompletingDay && dayActionAvailabilityId === selectedAvailability.id ? 'Completing...' : 'Complete Day'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {selectedAvailability && (
        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-card">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-text">{orderedBookedEntries.length} patients booked</p>
            <p className="text-sm text-text-secondary capitalize">
              {selectedAvailability.consultationType} consultation · {selectedAvailability.status}
            </p>
            {selectedAvailability.status !== 'ongoing' && (
              <p className="text-xs text-warning mt-1">
                You can view patients now, but start each session only after starting the day.
              </p>
            )}
          </div>
        </div>
      )}

      {orderedBookedEntries.length > 0 && (
        <div className="bg-card border border-border rounded-2xl shadow-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient by name"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary capitalize"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status === 'all' ? 'All statuses' : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">Failed to load appointments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : !selectedAvailability ? (
        <EmptyState
          icon={Calendar}
          title="Availability not found"
          description="No availability exists for this date."
          action={{ label: 'Back to Appointments', onClick: () => router.push('/doctor/appointments') }}
        />
      ) : orderedBookedEntries.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No booked patients"
          description="No patient has booked a slot for this availability date yet."
          action={{ label: 'Back to Appointments', onClick: () => router.push('/doctor/appointments') }}
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching patients"
          description="Try changing the search text or status filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry, idx) => {
            const appointment = entry.appointment!;
            const patient = patientByAppointmentId.get(appointment.id);
            const canStartSession =
              selectedAvailability.status === 'ongoing' &&
              STARTABLE_APPOINTMENT_STATUSES.has(appointment.status);
            const canResumeSession =
              selectedAvailability.status === 'ongoing' &&
              RESUMABLE_APPOINTMENT_STATUSES.has(appointment.status);
            const canViewSession = VIEWABLE_APPOINTMENT_STATUSES.has(appointment.status);
            const canOpenSession = canStartSession || canResumeSession || canViewSession;
            const canJoinVideo = selectedAvailability.consultationType === 'online' && appointment.status === 'ongoing';

            const actionLabel = canResumeSession
              ? 'Resume Session'
              : canStartSession
                ? 'Start Session'
                : canViewSession
                  ? 'View Details'
                  : 'Session Locked';

            const actionHandler = canResumeSession || canViewSession
              ? () => handleOpenSession(appointment.id)
              : () => handleStartSession(appointment.id);

            return (
              <div key={appointment.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-text-muted">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text">
                      {patient ? `${patient.firstName} ${patient.lastName}` : `Patient ${appointment.patientId.slice(0, 6)}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-text-muted">
                        {formatTime(entry.slot.startTime)} – {formatTime(entry.slot.endTime)}
                      </span>
                      <StatusBadge status={appointment.status} size="sm" />
                      {selectedAvailability.consultationType === 'online' && !appointment.telemedicineSessionId && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-warning-light text-warning font-medium">
                          Session link missing
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canJoinVideo && (
                      <TelemedicineJoinButton
                        sessionId={appointment.telemedicineSessionId}
                        role="doctor"
                        label="Join Video"
                        className="flex items-center gap-1.5 px-3 py-2 border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white text-xs font-medium rounded-xl transition-all"
                      />
                    )}
                    <button
                      onClick={actionHandler}
                      disabled={!canOpenSession || isStartingSession}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-xl transition-all disabled:opacity-60 disabled:hover:bg-primary"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {actionLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={showCompleteDayDialog}
        title="Complete Day"
        message="Mark this availability day as completed?"
        confirmLabel="Yes, Complete"
        cancelLabel="Keep Ongoing"
        variant="primary"
        isLoading={isCompletingDay}
        onConfirm={handleCompleteDay}
        onCancel={() => setShowCompleteDayDialog(false)}
      />
    </div>
  );
}
