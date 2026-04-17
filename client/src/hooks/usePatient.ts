import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPatientProfile, savePatientProfile, getPrescriptions,
  getMedicalDocuments, getRecentActivity,
} from '@/services/patientService';
import { useAuth } from '@/context/AuthContext';

export const patientKeys = {
  profile: (userId: string) => ['patient', 'profile', userId] as const,
  profileById: (userId: string) => ['patient', 'profile-by-id', userId] as const,
  prescriptions: (patientId: string) => ['patient', 'prescriptions', patientId] as const,
  documents: (patientId: string) => ['patient', 'documents', patientId] as const,
  activity: (patientId: string) => ['patient', 'activity', patientId] as const,
};

export function usePatientProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: patientKeys.profile(userId),
    queryFn: () => getPatientProfile(userId),
    enabled: !!userId,
  });
}

export function usePatientProfileById(userId: string) {
  return useQuery({
    queryKey: patientKeys.profileById(userId),
    queryFn: () => getPatientProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdatePatientProfile() {
  const qc = useQueryClient();
  const { user, updateUserProfileStatus } = useAuth();
  const userId = user?.id ?? '';
  return useMutation({
    mutationFn: savePatientProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.profile(userId) });
      updateUserProfileStatus(true);
    },
  });
}

export function usePrescriptions() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: patientKeys.prescriptions(userId),
    queryFn: () => getPrescriptions(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useMedicalDocuments() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: patientKeys.documents(userId),
    queryFn: () => getMedicalDocuments(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });
}

export function useRecentActivity() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: patientKeys.activity(userId),
    queryFn: () => getRecentActivity(userId),
    enabled: !!userId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
  });
}

