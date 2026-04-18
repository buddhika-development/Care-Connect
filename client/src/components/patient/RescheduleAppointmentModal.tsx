"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { Calendar, Clock, X } from "lucide-react";
import { Appointment } from "@/types/appointment";
import { DoctorCard, transformAvailability } from "@/types/doctor";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  doctor: DoctorCard | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (newSlotId: string) => void;
}

export default function RescheduleAppointmentModal({
  isOpen,
  appointment,
  doctor,
  isSubmitting = false,
  onClose,
  onConfirm,
}: RescheduleAppointmentModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const availableScheduleDays = useMemo(() => {
    if (!doctor || !appointment) return [];

    const today = startOfDay(new Date());
    return doctor.availabilities
      .map((availability) => transformAvailability(availability, doctor.id))
      .filter((availability) => {
        if (availability.consultationType !== appointment.consultationType)
          return false;
        if (availability.status !== "scheduled") return false;
        return !isBefore(parseISO(availability.date), today);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [doctor, appointment]);

  const selectedAvailability = availableScheduleDays.find(
    (day) => day.date === selectedDate,
  );

  const selectableSlots = (selectedAvailability?.slots ?? []).filter(
    (slot) => !slot.isBooked || slot.id === appointment?.slotId,
  );

  useEffect(() => {
    if (!isOpen) return;

    const defaultDate = availableScheduleDays[0]?.date ?? "";
    setSelectedDate(defaultDate);
    setSelectedSlotId("");
  }, [isOpen, availableScheduleDays]);

  if (!isOpen || !appointment) return null;

  const selectedSlot = selectableSlots.find(
    (slot) => slot.id === selectedSlotId,
  );
  const isCurrentSlotSelected = selectedSlotId === appointment.slotId;

  const canSubmit = !!selectedSlot && !isCurrentSlotSelected && !isSubmitting;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
      />

      <div className="relative bg-card rounded-2xl shadow-modal border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-text">Reschedule Appointment</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {appointment.doctorName} ·{" "}
              {appointment.consultationType === "online"
                ? "Online"
                : "Physical"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-secondary text-text-muted hover:text-text disabled:opacity-40"
            aria-label="Close reschedule modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {!doctor && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              Doctor schedule data is unavailable right now. Please refresh and
              try again.
            </div>
          )}

          {doctor && availableScheduleDays.length === 0 && (
            <div className="rounded-xl border border-border bg-secondary px-4 py-4 text-sm text-text-secondary">
              No available scheduled days found for this doctor and consultation
              type.
            </div>
          )}

          {doctor && availableScheduleDays.length > 0 && (
            <>
              <div>
                <p className="text-sm font-semibold text-text mb-2">
                  Select Date
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableScheduleDays.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSelectedSlotId("");
                      }}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-sm transition-all text-left",
                        selectedDate === day.date
                          ? "border-primary bg-primary-50 text-primary"
                          : "border-border bg-background text-text hover:bg-secondary",
                      )}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(day.date), "EEE, dd MMM")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text mb-2">
                  Select Slot
                  {selectedDate && (
                    <span className="text-xs text-text-muted ml-2 font-normal">
                      {format(parseISO(selectedDate), "EEEE, dd MMM yyyy")}
                    </span>
                  )}
                </p>

                {selectableSlots.length === 0 ? (
                  <p className="text-sm text-text-muted py-4">
                    No slots available for the selected date.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectableSlots.map((slot) => {
                      const isCurrentSlot = slot.id === appointment.slotId;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={slot.isBooked && !isCurrentSlot}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={cn(
                            "px-3 py-2 rounded-xl border text-sm transition-all",
                            selectedSlotId === slot.id
                              ? "border-primary bg-primary text-white"
                              : isCurrentSlot
                                ? "border-warning/40 bg-warning/10 text-warning"
                                : "border-border bg-background text-text hover:bg-secondary",
                          )}
                        >
                          <span className="flex items-center justify-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4" />
                            {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </span>
                          {isCurrentSlot && (
                            <span className="block text-[11px] mt-1">
                              Current slot
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-xl border border-border text-text-secondary hover:bg-secondary transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (selectedSlotId) onConfirm(selectedSlotId);
            }}
            className="px-4 py-2 text-sm rounded-xl bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
