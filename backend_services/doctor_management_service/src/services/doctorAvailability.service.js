import {
  findDoctorProfileByUserId,
  findAvailabilityByDate,
  createAvailability,
  createAvailabilitySlots,
  getMyAvailabilities,
  getAvailabilityById,
  countBookedSlots,
  updateAvailability,
  deleteSlotsByAvailabilityId,
  deleteAvailability,
  getAvailabilitySlotById,
  updateAvailabilitySlotBookStatus,
  getAvailabilitySlotDetailsById,
} from "../repositories/doctorAvailability.repository.js";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
} from "../utils/errors.utils.js";

const parseTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
};

const generateSlots = (availabilityId, availableDate, startTime, endTime, slotDuration) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  const slots = [];
  let current = start;

  while (current + slotDuration <= end) {
    slots.push({
      availability_id: availabilityId,
      slot_date: availableDate,
      slot_start_time: formatMinutesToTime(current),
      slot_end_time: formatMinutesToTime(current + slotDuration),
      is_booked: false,
    });

    current += slotDuration;
  }

  return slots;
};

const getDoctorProfileId = async (user) => {
  if (!user || !user.userId) {
    throw new ValidationError("Logged-in user information is missing");
  }

  if (user.role !== "doctor") {
    throw new ForbiddenError("Only doctors can manage availability");
  }

  const { data, error } = await findDoctorProfileByUserId(user.userId);

  if (error) throw new DatabaseError(error.message);
  if (!data) throw new NotFoundError("Doctor profile not found");

  return data.id;
};

const validateInput = (body) => {
  const {
    available_date,
    start_time,
    end_time,
    slot_duration_minutes,
    channeling_mode,
    consultation_fee,
    status,
  } = body;

  if (
    !available_date ||
    !start_time ||
    !end_time ||
    !slot_duration_minutes ||
    !channeling_mode ||
    consultation_fee === undefined ||
    !status
  ) {
    throw new ValidationError("All fields are required");
  }

  if (!["physical", "online"].includes(channeling_mode)) {
    throw new ValidationError("channeling_mode must be physical or online");
  }

  if (parseTimeToMinutes(end_time) <= parseTimeToMinutes(start_time)) {
    throw new ValidationError("end_time must be greater than start_time");
  }

  if (Number(slot_duration_minutes) <= 0) {
    throw new ValidationError("slot_duration_minutes must be greater than 0");
  }

  if (!["scheduled", "ongoing", "completed"].includes(status)) {
    throw new ValidationError("status must be scheduled, ongoing or completed");
  }
};

export const createDoctorAvailabilityService = async (user, body) => {
  validateInput(body);

  const doctorProfileId = await getDoctorProfileId(user);

  const existing = await findAvailabilityByDate(doctorProfileId, body.available_date);
  if (existing.error) throw new DatabaseError(existing.error.message);
  if (existing.data) {
    throw new ValidationError("Availability already exists for this date");
  }

  const { data: availability, error: availabilityError } = await createAvailability({
    doctor_profile_id: doctorProfileId,
    available_date: body.available_date,
    start_time: body.start_time,
    end_time: body.end_time,
    slot_duration_minutes: Number(body.slot_duration_minutes),
    channeling_mode: body.channeling_mode,
    consultation_fee: Number(body.consultation_fee),
    status: body.status || "scheduled",
  });

  if (availabilityError) throw new DatabaseError(availabilityError.message);

  const slots = generateSlots(
    availability.id,
    body.available_date,
    body.start_time,
    body.end_time,
    Number(body.slot_duration_minutes),
  );

  const { data: createdSlots, error: slotError } = await createAvailabilitySlots(slots);
  if (slotError) throw new DatabaseError(slotError.message);

  return {
    availability,
    slots: createdSlots,
  };
};

export const getMyDoctorAvailabilitiesService = async (user) => {
  const doctorProfileId = await getDoctorProfileId(user);

  const { data, error } = await getMyAvailabilities(doctorProfileId);
  if (error) throw new DatabaseError(error.message);

  return data;
};

export const updateDoctorAvailabilityService = async (user, availabilityId, body) => {
  validateInput(body);

  const doctorProfileId = await getDoctorProfileId(user);

  const { data: existingAvailability, error: existingError } = await getAvailabilityById(
    availabilityId,
    doctorProfileId,
  );

  if (existingError) throw new DatabaseError(existingError.message);
  if (!existingAvailability) throw new NotFoundError("Availability not found");

  const { count, error: bookedError } = await countBookedSlots(availabilityId);
  if (bookedError) throw new DatabaseError(bookedError.message);

  if (count > 0) {
    throw new ValidationError("Cannot update because at least one slot is booked");
  }

  if (body.available_date !== existingAvailability.available_date) {
    const { data: sameDateRecord, error: sameDateError } = await findAvailabilityByDate(
      doctorProfileId,
      body.available_date,
    );

    if (sameDateError) throw new DatabaseError(sameDateError.message);
    if (sameDateRecord) {
      throw new ValidationError("Availability already exists for this date");
    }
  }

  const { data: updatedAvailability, error: updateError } = await updateAvailability(
    availabilityId,
    {
      available_date: body.available_date,
      start_time: body.start_time,
      end_time: body.end_time,
      slot_duration_minutes: Number(body.slot_duration_minutes),
      channeling_mode: body.channeling_mode,
      consultation_fee: Number(body.consultation_fee),
      status: body.status,
    },
  );

  if (updateError) throw new DatabaseError(updateError.message);

  const { error: deleteSlotsError } = await deleteSlotsByAvailabilityId(availabilityId);
  if (deleteSlotsError) throw new DatabaseError(deleteSlotsError.message);

  const newSlots = generateSlots(
    availabilityId,
    body.available_date,
    body.start_time,
    body.end_time,
    Number(body.slot_duration_minutes),
  );

  const { data: createdSlots, error: slotError } = await createAvailabilitySlots(newSlots);
  if (slotError) throw new DatabaseError(slotError.message);

  return {
    availability: updatedAvailability,
    slots: createdSlots,
  };
};

export const cancelDoctorAvailabilityService = async (user, availabilityId) => {
  const doctorProfileId = await getDoctorProfileId(user);

  const { data: availability, error } = await getAvailabilityById(availabilityId, doctorProfileId);

  if (error) throw new DatabaseError(error.message);
  if (!availability) throw new NotFoundError("Availability not found");

  const availabilityStart = new Date(`${availability.available_date}T${availability.start_time}`);
  const now = new Date();
  const diff = availabilityStart.getTime() - now.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    throw new ValidationError("Can cancel only before 24 hours from the start time");
  }

  const { data, error: deleteError } = await deleteAvailability(availabilityId);
  if (deleteError) throw new DatabaseError(deleteError.message);

  return data;
};

export const updateAvailabilitySlotBookStatusService = async (slotId, body) => {
  const { is_booked } = body;

  if (typeof is_booked !== "boolean") {
    throw new ValidationError("is_booked must be true or false");
  }

  const { data: existingSlot, error: existingError } = await getAvailabilitySlotById(slotId);

  if (existingError) throw new DatabaseError(existingError.message);
  if (!existingSlot) throw new NotFoundError("Availability slot not found");

  const { data, error } = await updateAvailabilitySlotBookStatus(slotId, is_booked);

  if (error) throw new DatabaseError(error.message);

  return data;
};

export const getAvailabilitySlotDetailsByIdService = async (slotId) => {
  if (!slotId) {
    throw new ValidationError("slotId is required");
  }

  const { data, error } = await getAvailabilitySlotDetailsById(slotId);

  if (error) {
    throw new DatabaseError(error.message);
  }

  if (!data) {
    throw new NotFoundError("Availability slot not found");
  }

  return data;
};