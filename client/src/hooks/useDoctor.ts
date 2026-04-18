import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDoctorProfile,
  saveDoctorProfile,
  getDoctors,
  getDoctorAvailability,
  createAvailability,
  updateAvailability,
  cancelAvailability,
  markAvailabilityAsOngoing,
  markAvailabilityAsCompleted,
  getDoctorDaySchedules,
  getAppointmentPrescriptions,
  getDoctorPrescriptions,
  createAppointmentPrescription,
  cancelPrescription,
  getAllDoctorsAdmin,
  verifyDoctor,
  createDoctorByAdmin,
  AdminDoctorItem,
  CreateDoctorByAdminRequest,
} from "@/services/doctorService";
import type {
  CreateDoctorAvailabilityRequest,
  UpdateDoctorAvailabilityRequest,
  CreateAppointmentPrescriptionRequest,
} from "@/services/doctorService";
import { useAuth } from "@/context/AuthContext";

export const doctorKeys = {
  profile: (userId: string) => ["doctor", "profile", userId] as const,
  // specialization is a backend filter; name search is done client-side
  list: (spec?: string) => ["doctor", "list", spec ?? ""] as const,
  availability: (doctorId: string) =>
    ["doctor", "availability", doctorId] as const,
  daySchedules: (doctorId: string) =>
    ["doctor", "day-schedules", doctorId] as const,
  sessionPatient: (appointmentId: string) =>
    ["doctor", "session-patient", appointmentId] as const,
  appointmentPrescriptions: (appointmentId: string) =>
    ["doctor", "appointment-prescriptions", appointmentId] as const,
  doctorPrescriptions: (doctorId: string) =>
    ["doctor", "prescriptions", doctorId] as const,
  adminList: () => ["doctor", "admin", "list"] as const,
};

export function useDoctorProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: doctorKeys.profile(userId),
    queryFn: () => getDoctorProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  const { user, updateUserProfileStatus, updateUserName } = useAuth();
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: saveDoctorProfile,
    onSuccess: (_profile, variables) => {
      qc.invalidateQueries({ queryKey: doctorKeys.profile(userId) });
      updateUserProfileStatus(true);

      const firstName = variables.payload.first_name?.trim();
      const lastName = variables.payload.last_name?.trim();
      if (firstName) {
        updateUserName(firstName, lastName ?? "");
      }
    },
  });
}

/**
 * Fetch all doctors. Specialization is backend-filtered (query param).
 * Name search is intentionally NOT a param here — do it client-side in the page.
 *
 * Only fires after auth context has finished restoring the session.
 * If access token is missing/expired, Axios refresh flow handles it.
 */
export function useDoctors(specialization?: string) {
  const { isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: doctorKeys.list(specialization),
    queryFn: () => getDoctors(specialization),
    // Wait until auth restore finishes. Axios interceptor can refresh token on-demand.
    enabled: !authLoading,
    staleTime: 5 * 60 * 1000, // cache for 5 min — used for doctor-name enrichment in appointments
    retry: 2,
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
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: (data: CreateDoctorAvailabilityRequest) =>
      createAvailability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useUpdateAvailability() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: (data: UpdateDoctorAvailabilityRequest) =>
      updateAvailability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useCancelAvailability() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: (availabilityId: string) => cancelAvailability(availabilityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useMarkAvailabilityAsOngoing() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: (availabilityId: string) =>
      markAvailabilityAsOngoing(availabilityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useMarkAvailabilityAsCompleted() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useMutation({
    mutationFn: (availabilityId: string) =>
      markAvailabilityAsCompleted(availabilityId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.availability(userId) });
      qc.invalidateQueries({ queryKey: doctorKeys.daySchedules(userId) });
    },
  });
}

export function useDoctorDaySchedules() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery({
    queryKey: doctorKeys.daySchedules(userId),
    queryFn: () => getDoctorDaySchedules(userId),
    enabled: !!userId,
  });
}

export function useAppointmentPrescriptions(
  appointmentId: string,
  doctorName: string,
  doctorSpecialization: string,
  enabled = true,
) {
  return useQuery({
    queryKey: doctorKeys.appointmentPrescriptions(appointmentId),
    queryFn: () =>
      getAppointmentPrescriptions(
        appointmentId,
        doctorName,
        doctorSpecialization,
      ),
    enabled: !!appointmentId && enabled,
  });
}

export function useDoctorPrescriptions(
  doctorId: string,
  doctorName: string,
  doctorSpecialization: string,
  enabled = true,
) {
  return useQuery({
    queryKey: doctorKeys.doctorPrescriptions(doctorId),
    queryFn: () => getDoctorPrescriptions(doctorName, doctorSpecialization),
    enabled: !!doctorId && enabled,
  });
}

export function useCreateAppointmentPrescription(
  doctorName: string,
  doctorSpecialization: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAppointmentPrescriptionRequest) =>
      createAppointmentPrescription(request, doctorName, doctorSpecialization),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: doctorKeys.appointmentPrescriptions(variables.appointmentId),
      });
      qc.invalidateQueries({ queryKey: ["doctor", "prescriptions"] });
    },
  });
}

export function useCancelPrescription(
  doctorName: string,
  doctorSpecialization: string,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      prescriptionId,
      appointmentId,
    }: {
      prescriptionId: string;
      appointmentId: string;
    }) =>
      cancelPrescription(prescriptionId, doctorName, doctorSpecialization).then(
        (result) => ({ result, appointmentId }),
      ),
    onSuccess: ({ appointmentId }) => {
      qc.invalidateQueries({
        queryKey: doctorKeys.appointmentPrescriptions(appointmentId),
      });
      qc.invalidateQueries({ queryKey: ["doctor", "prescriptions"] });
    },
  });
}

export function useAllDoctorsAdmin() {
  return useQuery<AdminDoctorItem[]>({
    queryKey: doctorKeys.adminList(),
    queryFn: getAllDoctorsAdmin,
  });
}

export function useVerifyDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isVerified,
    }: {
      userId: string;
      isVerified?: boolean;
    }) => verifyDoctor(userId, isVerified),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.adminList() });
    },
  });
}

export function useCreateDoctorByAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDoctorByAdminRequest) =>
      createDoctorByAdmin(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.adminList() });
    },
  });
}
