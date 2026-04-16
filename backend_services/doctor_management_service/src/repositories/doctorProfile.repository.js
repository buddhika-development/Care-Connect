import supabase from "../config/supabase.js";

const doctorDb = supabase.schema("doctor_service");

// Create doctor profile for the logged-in doctor
export const createDoctorProfile = async (profileData) => {
  return await doctorDb
    .from("doctor_profiles")
    .insert([profileData])
    .select()
    .single();
};

// Get doctor profile using logged-in doctor's user_id
export const findDoctorProfileByUserId = async (userId) => {
  return await doctorDb
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
};

// Update doctor profile using logged-in doctor's user_id
export const updateDoctorProfileByUserId = async (userId, updatedData) => {
  return await doctorDb
    .from("doctor_profiles")
    .update(updatedData)
    .eq("user_id", userId)
    .select()
    .single();
};

// Get all doctors with nested availabilities and slots from the view
export const getAllDoctorsWithAvailability = async ({
  specialization,
} = {}) => {
  let query = doctorDb.from("doctor_profiles_full_view").select("*");

  if (specialization) {
    query = query.eq("specialization", specialization);
  }

  return await query.order("full_name", { ascending: true });
};

// Update doctor embedding by doctor profile ID (internal service call)
export const updateDoctorEmbedding = async (doctorId, embedding) => {
  return await doctorDb
    .from("doctor_profiles")
    .update({ embedding })
    .eq("id", doctorId)
    .select()
    .single();
};
