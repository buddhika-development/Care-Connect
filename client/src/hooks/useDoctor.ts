import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDoctorProfile, updateDoctorProfile, getDoctors, getDoctorAvailability,
  createAvailability, getDoctorDaySchedules, getSessionPatientInfo,
  getAllDoctorsAdmin, verifyDoctor,
} from '@/services/doctorService';
import { useAuth } from '@/context/AuthContext';
import { DoctorAvailability } from '@/types/doctor';

export const doctorKeys = {
  profile: (userId: string) => ['doctor', 'profile', userId] as const,
  list: (query?: string, spec?: string) => ['doctor', 'list', query, spec] as const,
  availability: (doctorId: string) => ['doctor', 'availability', doctorId] as const,
  daySchedules: (doctorId: string) => ['doctor', 'day-schedules', doctorId] as const,
  sessionPatient: (patientId: string) => ['doctor', 'session-patient', patientId] as const,
  adminList: () => ['doctor', 'admin', 'list'] as const,
};

export function useDoctorProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: doctorKeys.profile(userId),
    queryFn: () => getDoctorProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  const { user, updateUserProfileStatus } = useAuth();
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: updateDoctorProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.profile(userId) });
      updateUserProfileStatus(true);
    },
  });
}

export function useDoctors(query?: string, specialization?: string) {
  return useQuery({
    queryKey: doctorKeys.list(query, specialization),
    queryFn: () => getDoctors(query, specialization),
  });
}

export function useDoctorAvailability(doctorId: string) {
  return useQuery({
    queryKey: doctorKeys.availability(doctorId),
    queryFn: () => getDoctorAvailability(doctorId),
    enabled: !!doctorId,
  });
}

export function useCreateAvailability() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: (data: Omit<DoctorAvailability, 'id' | 'slots'>) => createAvailability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useDoctorDaySchedules() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: doctorKeys.daySchedules(userId),
    queryFn: () => getDoctorDaySchedules(userId),
    enabled: !!userId,
  });
}

export function useSessionPatientInfo(patientId: string) {
  return useQuery({
    queryKey: doctorKeys.sessionPatient(patientId),
    queryFn: () => getSessionPatientInfo(patientId),
    enabled: !!patientId,
  });
}

export function useAllDoctorsAdmin() {
  return useQuery({
    queryKey: doctorKeys.adminList(),
    queryFn: getAllDoctorsAdmin,
  });
}

export function useVerifyDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doctorId: string) => verifyDoctor(doctorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.adminList() });
    },
  });
}
