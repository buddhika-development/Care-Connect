import AppointmentRepository from "../repositories/appointment.repository.js";
import httpClient from "../utils/httpClient.js";
import { InvalidInputError, NotFoundError, AppError } from "../utils/errors.utils.js";
import { serviceNames } from "../constant/serviceNames.constant.js";
import { updateSlotBookingStatus } from "../utils/doctorServiceHelper.js";

const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL;

const InternalService = {
  async getAppointmentById(appointmentId) {
    return await AppointmentRepository.findById(appointmentId);
  },

  async getAppointmentsByDoctorAndDate(doctorId, date) {
    return await AppointmentRepository.findByDoctorIdAndDate(doctorId, date);
  },

  async getAppointmentsByPatient(patientId) {
    return await AppointmentRepository.findByPatientId(patientId);
  },

  async getAppointmentBySlotId(slotId) {
    return await AppointmentRepository.findBySlotId(slotId);
  },

  async handlePaymentUpdate(appointmentId, paymentStatus, paymentId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) throw new NotFoundError("Appointment");

    // Prevent duplicate payment updates
    if (
      paymentStatus === "paid" &&
      appointment.appointment_status === "confirmed"
    ) {
      return appointment;
    }

    // Payment succeeded
    if (paymentStatus === "paid") {
      // Step 1 — Update appointment status to confirmed and payment to paid
      await AppointmentRepository.updateStatusAndPayment(
        appointmentId,
        "confirmed",
        "paid",
        paymentId
      );

      // Step 2 — Mark slot as booked in Doctor Service (must succeed)
      try {
        await updateSlotBookingStatus(appointment.slot_id, true);
      } catch (error) {
        throw new AppError("Failed to mark slot as booked. Please try again.", 503);
      }

      // Step 3 — Create telemedicine session if online (must succeed)
      if (appointment.channelling_mode === "online") {
        try {
          const response = await httpClient.post(
            TELEMEDICINE_SERVICE_URL,
            `/api/internal/telemedicine/sessions`,
            serviceNames.APPOINTMENT_SERVICE,
            {
              appointmentId: appointment.id,
              patientId: appointment.patient_id,
              doctorId: appointment.doctor_id,
              scheduledAt: appointment.scheduled_at,
            }
          );

          // Step 4 — Store telemedicine session ID
          if (response.data?.id) {
            await AppointmentRepository.updateTelemedicineSession(
              appointmentId,
              response.data.id
            );
          }
        } catch (error) {
          throw new AppError("Failed to create telemedicine session. Please try again.", 503);
        }
      }

      // Step 5 — Return final state after all updates
      return await AppointmentRepository.findById(appointmentId);
    }

    // Payment failed
    if (paymentStatus === "unpaid") {
      return await AppointmentRepository.updateStatusAndPayment(
        appointmentId,
        "cancelled",
        "unpaid",
        paymentId
      );
    }

    throw new InvalidInputError(`Invalid payment status: ${paymentStatus}`);
  },

  async updatePrescriptionId(appointmentId, prescriptionId) {
    const appointment = await AppointmentRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundError("Appointment");

    return await AppointmentRepository.updatePrescriptionId(
      appointmentId,
      prescriptionId
    );
  },

  async autoCancelExpiredAppointments() {
    const cutoffTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const expiredAppointments =
      await AppointmentRepository.findPendingExpired(cutoffTime);

    console.log(
      `Auto-cancel job: found ${expiredAppointments.length} expired appointments`
    );

    for (const appointment of expiredAppointments) {
      try {
        await AppointmentRepository.updateStatusAndPayment(
          appointment.id,
          "cancelled",
          "unpaid",
          null
        );

        // Release slot — graceful for auto-cancel job
        try {
          await updateSlotBookingStatus(appointment.slot_id, false);
        } catch (error) {
          console.error(
            `Failed to release slot for appointment ${appointment.id}:`,
            error.message
          );
        }

        console.log(`Auto-cancelled appointment: ${appointment.id}`);
      } catch (error) {
        console.error(
          `Failed to auto-cancel appointment ${appointment.id}:`,
          error.message
        );
      }
    }

    return expiredAppointments.length;
  },
};

export default InternalService;