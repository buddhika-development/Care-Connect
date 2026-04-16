import supabase from "../config/supabase.js";
import { DatabaseError, NotFoundError } from "../utils/errors.utils.js";

const AppointmentRepository = {
  async create(appointmentData) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  },

  async findById(appointmentId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (error && error.code !== "PGRST116")
      throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async findBySlotId(slotId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("slot_id", slotId)
      .maybeSingle();

    if (error && error.code !== "PGRST116")
      throw new DatabaseError(error.message);
    return data || null;
  },

  async findByPatientId(patientId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data || [];
  },

  async findByDoctorId(doctorId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data || [];
  },

  async findByDoctorIdAndDate(doctorId, date) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .gte("scheduled_at", `${date}T00:00:00`)
      .lt("scheduled_at", `${date}T23:59:59`)
      .order("scheduled_at", { ascending: true });

    if (error) throw new DatabaseError(error.message);
    return data || [];
  },

  async findByPatientIdAndDate(patientId, date) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .gte("scheduled_at", `${date}T00:00:00`)
      .lt("scheduled_at", `${date}T23:59:59`);

    if (error) throw new DatabaseError(error.message);
    return data || [];
  },

  async findPendingExpired(cutoffTime) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .select("*")
      .eq("appointment_status", "pending")
      .lt("created_at", cutoffTime);

    if (error) throw new DatabaseError(error.message);
    return data || [];
  },

  async updateStatus(appointmentId, status) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({ appointment_status: status })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async updatePaymentStatus(appointmentId, paymentStatus, paymentId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({
        payment_status: paymentStatus,
        ...(paymentId && { payment_id: paymentId }),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async updateStatusAndPayment(appointmentId, status, paymentStatus, paymentId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({
        appointment_status: status,
        payment_status: paymentStatus,
        ...(paymentId && { payment_id: paymentId }),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async updateSlot(appointmentId, newSlotId, scheduledAt, channellingMode) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({
        slot_id: newSlotId,
        scheduled_at: scheduledAt,
        channelling_mode: channellingMode,
        appointment_status: "rescheduled",
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async cancelAppointment(appointmentId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({ appointment_status: "cancelled" })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async updateTelemedicineSession(appointmentId, sessionId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({ telemedicine_session_id: sessionId })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },

  async updatePrescriptionId(appointmentId, prescriptionId) {
    const { data, error } = await supabase
      .schema("appointments")
      .from("appointments")
      .update({ prescription_id: prescriptionId })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Appointment");
    return data;
  },
};

export default AppointmentRepository;