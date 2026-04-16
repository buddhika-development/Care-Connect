import supabase from "../config/supabase.js";

// Insert a new payment record with pending status
export async function insertPayment(paymentData) {
  const { data, error } = await supabase
    .from("payment")
    .insert(paymentData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create payment: ${error.message}`);
  return data;
}

// Find payment by appointmentId
// Used to check if payment already exists before creating a new one
export async function findPaymentByAppointmentId(appointmentId) {
  const { data, error } = await supabase
    .from("payment")
    .select("*")
    .eq("appointment_id", appointmentId)
    .maybeSingle(); // returns null if not found instead of throwing

  if (error) throw new Error(`Failed to fetch payment: ${error.message}`);
  return data; // null if no payment found
}

// Update payment status after webhook is received from PayHere
export async function updatePaymentByAppointmentId(appointmentId, updateData) {
  const { data, error } = await supabase
    .from("payment")
    .update(updateData)
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update payment: ${error.message}`);
  return data;
}
