import {
  createPrescription,
  getDoctorProfilesByIds,
  getPrescriptionsByPatientId,
  findDoctorProfileByUserId,
  getPrescriptionById,
  getPrescriptionsByAppointmentId,
  getPrescriptionsByDoctorProfileId,
  getActivePrescriptionsByAppointmentId,
  updatePrescriptionStatus,
} from "../repositories/prescriptions.repository.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.utils.js";
import { getAppointmentForDoctor } from "../utils/appointmentServiceHelper.js";

const getDoctorProfileId = async (user) => {
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can manage prescriptions");
  }

  const doctorProfile = await findDoctorProfileByUserId(user.userId);

  if (!doctorProfile) {
    throw new NotFoundError("Doctor profile not found");
  }

  return doctorProfile.id;
};

const validatePrescriptionInput = (body) => {
  const { diagnosis, medications } = body;

  if (!diagnosis || !medications) {
    throw new ValidationError("diagnosis and medications are required");
  }

  if (!Array.isArray(medications) || medications.length === 0) {
    throw new ValidationError("medications must be a non-empty array");
  }
};

export const createPrescriptionService = async (user, appointmentId, body) => {
  const doctorProfileId = await getDoctorProfileId(user);

  validatePrescriptionInput(body);

  if (body.appointment_id && body.appointment_id !== appointmentId) {
    throw new ValidationError(
      "appointment_id in body must match the appointmentId path parameter",
    );
  }

  const appointment = await getAppointmentForDoctor(appointmentId, user.userId);

  const activePrescriptions = await getActivePrescriptionsByAppointmentId(
    appointmentId,
    doctorProfileId,
  );

  if (activePrescriptions && activePrescriptions.length > 0) {
    throw new ValidationError(
      "A previous prescription for this appointment must be cancelled before creating a new one.",
    );
  }

  const createdPrescription = await createPrescription({
    doctor_profile_id: doctorProfileId,
    patient_id: appointment.patient_id,
    appointment_id: appointmentId,
    diagnosis: body.diagnosis,
    medications: body.medications,
    notes: body.notes || null,
  });

  return createdPrescription;
};

export const getMyPrescriptionsService = async (user) => {
  const doctorProfileId = await getDoctorProfileId(user);

  const prescriptions =
    await getPrescriptionsByDoctorProfileId(doctorProfileId);

  return prescriptions || [];
};

export const getMyPatientPrescriptionsService = async (user) => {
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  if (user.role !== "patient") {
    throw new ForbiddenError("Only patients can access this endpoint");
  }

  const prescriptions = await getPrescriptionsByPatientId(user.userId);
  const rows = prescriptions || [];

  const doctorProfileIds = Array.from(
    new Set(rows.map((row) => row.doctor_profile_id).filter(Boolean)),
  );

  const doctorProfiles = await getDoctorProfilesByIds(doctorProfileIds);
  const doctorProfileMap = new Map(
    (doctorProfiles || []).map((profile) => [profile.id, profile]),
  );

  return rows.map((row) => {
    const doctorProfile = doctorProfileMap.get(row.doctor_profile_id);
    const doctorName = doctorProfile?.full_name?.trim();

    return {
      ...row,
      doctor_name: doctorName ? `Dr. ${doctorName}` : "Doctor",
      doctor_specialization: doctorProfile?.specialization || "",
    };
  });
};

export const getPrescriptionsByAppointmentService = async (
  user,
  appointmentId,
) => {
  if (!appointmentId) {
    throw new ValidationError("appointmentId is required");
  }

  const doctorProfileId = await getDoctorProfileId(user);

  await getAppointmentForDoctor(appointmentId, user.userId);

  const prescriptions = await getPrescriptionsByAppointmentId(
    appointmentId,
    doctorProfileId,
  );

  return prescriptions || [];
};

export const cancelPrescriptionService = async (user, prescriptionId) => {
  const doctorProfileId = await getDoctorProfileId(user);

  const prescription = await getPrescriptionById(prescriptionId);

  if (!prescription) {
    throw new NotFoundError("Prescription not found");
  }

  if (prescription.doctor_profile_id !== doctorProfileId) {
    throw new ForbiddenError("You are not allowed to cancel this prescription");
  }

  if (prescription.status === "cancelled") {
    throw new ValidationError("Prescription is already cancelled");
  }

  const updatedPrescription = await updatePrescriptionStatus(
    prescriptionId,
    "cancelled",
  );

  return updatedPrescription;
};
