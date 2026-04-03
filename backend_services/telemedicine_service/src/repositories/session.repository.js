import supabase from "../config/supabase.js";
import { DatabaseError, NotFoundError } from "../utils/errors.utils.js";

const SessionRepository = {
  async create(sessionData) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  },

  async findById(sessionId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Session");
    return data;
  },

  async findByPatientId(patientId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data;
  },

  async findByDoctorId(doctorId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data;
  },

  async findByAppointmentId(appointmentId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .select("*")
      .eq("appointment_id", appointmentId)
      .single();

    if (error && error.code !== "PGRST116") throw new DatabaseError(error.message);
    return data || null;
  },

  async updateStatus(sessionId, status) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .update({ status })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Session");
    return data;
  },

  async startSession(sessionId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .update({
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Session");
    return data;
  },

  async completeSession(sessionId, notes) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
        ...(notes && { notes }),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Session");
    return data;
  },

  async cancelSession(sessionId) {
    const { data, error } = await supabase
      .schema("telemedicine")
      .from("sessions")
      .update({ status: "cancelled" })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    if (!data) throw new NotFoundError("Session");
    return data;
  },
};

export default SessionRepository;