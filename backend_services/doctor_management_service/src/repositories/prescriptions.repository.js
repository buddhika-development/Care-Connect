import supabase from "../config/supabase.js";

const doctorDb = supabase.schema("doctor_service");

// Find doctor profile using logged-in user id
export const findDoctorProfileByUserId = async (userId) => {
  const { data, error } = await doctorDb
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Create a new prescription
export const createPrescription = async (prescriptionData) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .insert([prescriptionData])
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Get all prescriptions issued by this doctor
export const getPrescriptionsByDoctorProfileId = async (doctorProfileId) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .select("*")
    .eq("doctor_profile_id", doctorProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

// Get all prescriptions for a particular appointment by this doctor
export const getPrescriptionsByAppointmentId = async (
  appointmentId,
  doctorProfileId,
) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("doctor_profile_id", doctorProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

// Get active prescriptions for a particular appointment by this doctor
export const getActivePrescriptionsByAppointmentId = async (
  appointmentId,
  doctorProfileId,
) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .select("*")
    .eq("appointment_id", appointmentId)
    .eq("doctor_profile_id", doctorProfileId)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
};

// Get one prescription by id
export const getPrescriptionById = async (prescriptionId) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .select("*")
    .eq("id", prescriptionId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Update prescription status
export const updatePrescriptionStatus = async (prescriptionId, status) => {
  const { data, error } = await doctorDb
    .from("prescriptions")
    .update({ status })
    .eq("id", prescriptionId)
    .select()
    .single();

  if (error) throw error;

  return data;
};