import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
 * Build a doctor-id → DoctorCard map from the cached doctors list.
 * Used to enrich raw appointments with doctor name + specialization.
 */
function buildDoctorsMap(doctors: DoctorCard[] | undefined): Map<string, DoctorCard> {
  const map = new Map<string, DoctorCard>();
  if (!doctors) return map;
  for (const d of doctors) map.set(d.id, d);
  return map;
}

export function useAppointments() {
  const { user } = useAuth();
  // Load doctors list so we can enrich appointment records with doctor names
  const { data: doctors } = useDoctors();
  const doctorsMap = buildDoctorsMap(doctors);

  return useQuery({
    queryKey: appointmentKeys.list(user?.id ?? '', user?.role ?? ''),
    queryFn: () => getAppointments(user!.id, user!.role as 'patient' | 'doctor', doctorsMap),
    enabled: !!user,
  });
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
    mutationFn: ({ appointmentId, newSlotId, newDate }: { appointmentId: string; newSlotId: string; newDate: string }) =>
      rescheduleAppointment(appointmentId, newSlotId, newDate),
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
