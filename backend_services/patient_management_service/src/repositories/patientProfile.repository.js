import supabase from "../config/supabase.js";

export async function insertPatientProfile(patientProfileData) {
  const { data, error } = await supabase
    .from("patient_profile")
    .insert(patientProfileData)
    .select()
    .single();

  console.log("insertPatientProfile - data:", data, "error:", error);

  return { data, error };
}

export async function findPatientProfileByUserId(userId) {
  const { data, error } = await supabase
    .from("patient_profile")
    .select("id, user_id")
    .eq("user_id", userId)
    .single();

  console.log("findPatientProfileByUserId - data:", data, "error:", error);

  return { patient: data, patientError: error };
}

export async function updatePatientProfile(profileId, updatedData) {
  const { data, error } = await supabase
    .from("patient_profile")
    .update(updatedData)
    .eq("id", profileId)
    .select()
    .single();

  return { updatedProfile: data, updateError: error };
}

export async function getPatientProfileByUserId(userId) {
  const { data, error } = await supabase
    .from("patient_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("getPatientProfileByUserId - data:", data, "error:", error);

  return { patient: data, patientError: error };
}

export async function getPatientProfilesByUserIds(userIds = []) {
  const { data, error } = await supabase
    .from("patient_profile")
    .select("user_id, first_name, last_name, email, contact_no")
    .in("user_id", userIds);

  return { data, error };
}
