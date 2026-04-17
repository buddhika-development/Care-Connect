import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRawAppointments, transformAppointment,
  getAppointments, createAppointment, cancelAppointment, rescheduleAppointment,
  startSession, completeSession, getDoctorDayAppointments, getAdminAppointments, getAppointmentById,
} from '@/services/appointmentService';
import { useAuth } from '@/context/AuthContext';
import { BookingRequest, AppointmentRaw } from '@/types/appointment';
import { useDoctors } from '@/hooks/useDoctor';
import { DoctorCard } from '@/types/doctor';

export const appointmentKeys = {
  list: (userId: string, role: string) => ['appointments', userId, role] as const,
  detail: (id: string) => ['appointments', 'detail', id] as const,
  doctorDay: (doctorId: string, date: string) => ['appointments', 'doctor', doctorId, date] as const,
  adminAll: () => ['appointments', 'admin', 'all'] as const,
};

/**
 * Build a doctor lookup map from the cached doctors list.
 *
 * We support both keys because some historical appointments were saved with
 * doctor_profile_id while newer records use auth user_id.
 */
function buildDoctorsMap(doctors: DoctorCard[] | undefined): Map<string, DoctorCard> {
  const map = new Map<string, DoctorCard>();
  if (!doctors) return map;
  for (const d of doctors) {
    if (d.userId) map.set(d.userId, d);
    if (d.id) map.set(d.id, d);
  }
  return map;
}

export function useAppointments() {
  const { user } = useAuth();

  // 1. Fetch doctors — needed to resolve doctor names
  const { data: doctors } = useDoctors();

  // 2. Fetch raw appointments — no map dependency, so this caches cleanly
  const rawQuery = useQuery({
    queryKey: appointmentKeys.list(user?.id ?? '', user?.role ?? ''),
    queryFn: getRawAppointments,
    enabled: !!user,
    staleTime: 30_000,
  });

  // 3. Build the userId→DoctorCard map (re-memos when doctors change)
  const doctorsMap = useMemo(() => buildDoctorsMap(doctors), [doctors]);

  // 4. Enrich raw appointments with doctor names reactively
  //    This re-runs whenever rawQuery.data OR doctors change —
  //    so even if doctors load after appointments, names resolve instantly.
  const data = useMemo(() => {
    if (!rawQuery.data) return undefined;
    return rawQuery.data.map((r) => transformAppointment(r, doctorsMap));
  }, [rawQuery.data, doctorsMap]);

  return { ...rawQuery, data };
}


export function useAppointmentById(appointmentId: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointmentById(appointmentId),
    enabled: !!appointmentId,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: BookingRequest) => createAppointment(data),
    onSuccess: () => {
      if (user) {
        qc.invalidateQueries({ queryKey: appointmentKeys.list(user.id, user.role) });
      }
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => cancelAppointment(appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId, newSlotId, newScheduledAt, newChannelingMode,
    }: {
      appointmentId: string;
      newSlotId: string;
      newScheduledAt: string;
      newChannelingMode: string;
    }) =>
      rescheduleAppointment(appointmentId, newSlotId, newScheduledAt, newChannelingMode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}


export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => startSession(appointmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, prescription }: { appointmentId: string; prescription: { medicines: unknown[]; notes: string } }) =>
      completeSession(appointmentId, prescription),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDoctorDayAppointments(doctorId: string, date: string) {
  return useQuery({
    queryKey: appointmentKeys.doctorDay(doctorId, date),
    queryFn: () => getDoctorDayAppointments(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

export function useAdminAppointments() {
  return useQuery({
    queryKey: appointmentKeys.adminAll(),
    queryFn: getAdminAppointments,
  });
}
