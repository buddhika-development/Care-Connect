import supabase from "../config/supabase.js";

// Create doctor profile for the logged-in doctor
export const createDoctorProfile = async (profileData) => {
  return await supabase
    .from("doctor_profiles")
    .insert([profileData])
    .select()
    .single();
};

// Get doctor profile using logged-in doctor's user_id
export const findDoctorProfileByUserId = async (userId) => {
  return await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
};

// Update doctor profile using logged-in doctor's user_id
export const updateDoctorProfileByUserId = async (userId, updatedData) => {
  return await supabase
    .from("doctor_profiles")
    .update(updatedData)
    .eq("user_id", userId)
    .select()
    .single();
};