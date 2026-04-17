import supabase from "../config/supabase.js";

const doctorDb = supabase.schema("doctor_service");

export const findDoctorProfileByUserId = async (userId) => {
  return await doctorDb
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
};

export const findAvailabilityByDate = async (doctorProfileId, availableDate) => {
  return await doctorDb
    .from("doctor_availability")
    .select("*")
    .eq("doctor_profile_id", doctorProfileId)
    .eq("available_date", availableDate)
    .maybeSingle();
};

export const createAvailability = async (data) => {
  return await doctorDb
    .from("doctor_availability")
    .insert([data])
    .select()
    .single();
};

export const createAvailabilitySlots = async (slots) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .insert(slots)
    .select();
};

export const getMyAvailabilities = async (doctorProfileId) => {
  return await doctorDb
    .from("doctor_availability")
    .select(`
      *,
      doctor_availability_slots (
        id,
        slot_date,
        slot_start_time,
        slot_end_time,
        is_booked
      )
    `)
    .eq("doctor_profile_id", doctorProfileId)
    .order("available_date", { ascending: true });
};

export const getAvailabilityById = async (availabilityId, doctorProfileId) => {
  return await doctorDb
    .from("doctor_availability")
    .select("*")
    .eq("id", availabilityId)
    .eq("doctor_profile_id", doctorProfileId)
    .maybeSingle();
};

export const countBookedSlots = async (availabilityId) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .select("id", { count: "exact", head: true })
    .eq("availability_id", availabilityId)
    .eq("is_booked", true);
};

export const updateAvailability = async (availabilityId, data) => {
  return await doctorDb
    .from("doctor_availability")
    .update(data)
    .eq("id", availabilityId)
    .select()
    .single();
};

export const updateAvailabilityStatus = async (
  availabilityId,
  doctorProfileId,
  status,
) => {
  return await doctorDb
    .from("doctor_availability")
    .update({ status })
    .eq("id", availabilityId)
    .eq("doctor_profile_id", doctorProfileId)
    .select()
    .single();
};

export const deleteSlotsByAvailabilityId = async (availabilityId) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .delete()
    .eq("availability_id", availabilityId);
};

export const deleteAvailability = async (availabilityId) => {
  return await doctorDb
    .from("doctor_availability")
    .delete()
    .eq("id", availabilityId)
    .select()
    .single();
};

export const getAvailabilitySlotById = async (slotId) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .select("*")
    .eq("id", slotId)
    .maybeSingle();
};

export const updateAvailabilitySlotBookStatus = async (slotId, isBooked) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .update({ is_booked: isBooked })
    .eq("id", slotId)
    .select()
    .single();
};

export const getAvailabilitySlotDetailsById = async (slotId) => {
  return await doctorDb
    .from("doctor_availability_slots")
    .select(`
      id,
      availability_id,
      slot_date,
      slot_start_time,
      slot_end_time,
      is_booked,
      created_at,
      updated_at,
      doctor_availability (
        id,
        doctor_profile_id,
        available_date,
        start_time,
        end_time,
        slot_duration_minutes,
        channeling_mode,
        consultation_fee,
        status,
        created_at,
        updated_at,
        doctor_profiles (
          id,
          user_id,
          full_name,
          specialization,
          license_number,
          experience_years,
          bio,
          created_at,
          updated_at,
          room_number
        )
      )
    `)
    .eq("id", slotId)
    .maybeSingle();
};