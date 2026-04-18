"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  AlertCircle,
  Clock,
  Stethoscope,
  Activity,
} from "lucide-react";
import {
  useAppointments,
  useCancelAppointment,
  useRescheduleAppointment,
} from "@/hooks/useAppointments";
import { useDoctors } from "@/hooks/useDoctor";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import EmptyState from "@/components/common/EmptyState";
import TelemedicineJoinButton from "@/components/common/TelemedicineJoinButton";
import RescheduleAppointmentModal from "@/components/patient/RescheduleAppointmentModal";
import { Appointment } from "@/types/appointment";
import { AppointmentStatus } from "@/types/common";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { transformAvailability } from "@/types/doctor";

const STATUS_FILTERS: { label: string; value: AppointmentStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function AppointmentSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 skeleton rounded w-40" />
        <div className="h-5 skeleton rounded-full w-20" />
      </div>
      <div className="h-3 skeleton rounded w-56" />
      <div className="h-3 skeleton rounded w-32" />
      <div className="flex gap-2 pt-2">
        <div className="h-9 skeleton rounded-xl flex-1" />
        <div className="h-9 skeleton rounded-xl flex-1" />
      </div>
    </div>
  );
}

const DAY_STATUS_STYLES: Record<"scheduled" | "ongoing" | "completed", string> =
  {
    scheduled: "bg-warning-light text-warning",
    ongoing: "bg-primary-100 text-primary-dark",
    completed: "bg-success-light text-success",
  };

function getSessionStateLabel(
  appointment: Appointment,
  dayStatus: "scheduled" | "ongoing" | "completed",
) {
  if (appointment.status === "ongoing") return "Session ongoing";
  if (dayStatus === "ongoing" && appointment.status === "confirmed")
    return "Waiting for doctor";
  if (dayStatus === "completed") return "Day completed";
  return appointment.status;
}

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  );

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const { data: doctors = [] } = useDoctors();
  const { mutate: cancelAppointment, isPending: cancelling } =
    useCancelAppointment();
  const { mutate: rescheduleAppointment, isPending: rescheduling } =
    useRescheduleAppointment();

  const doctorMap = useMemo(() => {
    const map = new Map<string, (typeof doctors)[number]>();
    for (const doctor of doctors) {
      map.set(doctor.userId, doctor);
      map.set(doctor.id, doctor);
    }
    return map;
  }, [doctors]);

  const filtered = (appointments ?? []).filter((apt) => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    const matchesSearch =
      !search || apt.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const enrichedAppointments = useMemo(() => {
    return filtered.map((apt) => {
      const doctor = doctorMap.get(apt.doctorId);
      const selectedAvailability = doctor
        ? doctor.availabilities
            .map((availability) =>
              transformAvailability(availability, doctor.id),
            )
            .find((availability) =>
              availability.slots.some((slot) => slot.id === apt.slotId),
            )
        : null;

      const selectedSlot =
        selectedAvailability?.slots.find((slot) => slot.id === apt.slotId) ??
        null;

      return {
        appointment: apt,
        doctorAvailabilityStatus: selectedAvailability?.status ?? "scheduled",
        selectedSlot,
        isCurrentSlot: apt.status === "ongoing",
      };
    });
  }, [doctorMap, filtered]);

  const canReschedule = (
    apt: Appointment,
    dayStatus: "scheduled" | "ongoing" | "completed",
  ) => {
    if (!(apt.status === "confirmed" || apt.status === "rescheduled"))
      return false;
    return dayStatus === "scheduled";
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    cancelAppointment(cancelTarget.id, {
      onSuccess: () => {
        toast.success("Appointment cancelled. Refund initiated.");
        setCancelTarget(null);
        refetch();
      },
      onError: () => toast.error("Failed to cancel. Try again."),
    });
  };

  const handleReschedule = (newSlotId: string) => {
    if (!rescheduleTarget) return;

    rescheduleAppointment(
      {
        appointmentId: rescheduleTarget.id,
        newSlotId,
      },
      {
        onSuccess: () => {
          toast.success("Appointment rescheduled successfully.");
          setRescheduleTarget(null);
          refetch();
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to reschedule. Please try again.";
          toast.error(message);
        },
      },
    );
  };

  const rescheduleDoctor = rescheduleTarget
    ? (doctorMap.get(rescheduleTarget.doctorId) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">My Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">
          View and manage all your appointments
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === f.value ? "bg-primary text-white" : "bg-secondary text-text-secondary hover:bg-border"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <AppointmentSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-error mb-3" />
          <p className="text-error font-medium mb-3">
            Failed to load appointments.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      ) : enrichedAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={
            statusFilter !== "all"
              ? `No ${statusFilter} appointments found.`
              : "You don't have any appointments yet."
          }
          action={{
            label: "Book an Appointment",
            onClick: () => router.push("/patient/find-doctor"),
          }}
        />
      ) : (
        <div className="space-y-3">
          {enrichedAppointments.map(
            ({
              appointment: apt,
              doctorAvailabilityStatus,
              selectedSlot,
              isCurrentSlot,
            }) => {
              const canRescheduleApt = canReschedule(
                apt,
                doctorAvailabilityStatus as
                  | "scheduled"
                  | "ongoing"
                  | "completed",
              );
              const isOnline = apt.consultationType === "online";
              const dayStatus = doctorAvailabilityStatus;

              return (
                <div
                  key={apt.id}
                  className={cn(
                    "bg-card rounded-2xl border border-border shadow-card p-5",
                    isCurrentSlot && "ring-2 ring-primary/20",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                        <p className="font-semibold text-text">
                          {apt.doctorName || "Doctor"}
                        </p>
                      </div>
                      {apt.doctorSpecialization && (
                        <p className="text-sm text-text-secondary ml-6">
                          {apt.doctorSpecialization}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm text-text-secondary ml-6">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDateTime(apt.date, apt.startTime)}
                    </span>
                    <span
                      className={`font-medium ${isOnline ? "text-primary" : "text-accent"}`}
                    >
                      {isOnline ? "📹 Online" : "🏥 Physical"}
                    </span>
                    <span className="font-medium text-text">
                      {formatCurrency(apt.fee)}
                    </span>
                  </div>

                  <div className="ml-6 mb-3 flex flex-wrap gap-2 text-xs">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full font-medium",
                        DAY_STATUS_STYLES[
                          dayStatus as "scheduled" | "ongoing" | "completed"
                        ],
                      )}
                    >
                      Day {dayStatus}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full font-medium",
                        apt.status === "ongoing"
                          ? "bg-primary-100 text-primary-dark"
                          : "bg-secondary text-text-secondary",
                      )}
                    >
                      Session{" "}
                      {getSessionStateLabel(
                        apt,
                        dayStatus as "scheduled" | "ongoing" | "completed",
                      )}
                    </span>
                    {isOnline && !apt.telemedicineSessionId && (
                      <span className="px-2.5 py-1 rounded-full font-medium bg-warning-light text-warning">
                        Video link pending
                      </span>
                    )}
                    {selectedSlot && (
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full font-medium",
                          isCurrentSlot
                            ? "bg-success-light text-success"
                            : "bg-secondary text-text-secondary",
                        )}
                      >
                        Slot {selectedSlot.startTime} - {selectedSlot.endTime}
                      </span>
                    )}
                  </div>

                  {isCurrentSlot && (
                    <div className="flex items-center gap-2 mb-3 ml-6 text-xs text-primary bg-primary-50 px-3 py-1.5 rounded-lg w-fit">
                      <Activity className="w-3.5 h-3.5" />
                      This is the current ongoing slot for the day.
                    </div>
                  )}

                  {dayStatus === "ongoing" && apt.status === "confirmed" && (
                    <div className="flex items-center gap-2 mb-3 ml-6 text-xs text-warning bg-warning-light px-3 py-1.5 rounded-lg w-fit">
                      <Activity className="w-3.5 h-3.5" />
                      Doctor has started the day. Your session is waiting to be
                      called.
                    </div>
                  )}

                  {/* Countdown for pending status */}
                  {apt.status === "pending" && apt.countdownExpiry && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-warning bg-warning-light px-3 py-1.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Auto-cancelling soon — gateway crash
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border-light">
                    {(apt.status === "confirmed" ||
                      apt.status === "rescheduled") && (
                      <button
                        onClick={() => setCancelTarget(apt)}
                        className="px-4 py-2 text-sm rounded-xl border border-error text-error hover:bg-error-light transition-all font-medium"
                      >
                        Cancel
                      </button>
                    )}

                    {(apt.status === "confirmed" ||
                      apt.status === "rescheduled") && (
                      <button
                        onClick={() => {
                          if (!canRescheduleApt) {
                            toast.error(
                              "Cannot reschedule because this doctor day has already started or completed.",
                            );
                          } else {
                            setRescheduleTarget(apt);
                          }
                        }}
                        disabled={!canRescheduleApt}
                        title={
                          !canRescheduleApt
                            ? "Cannot reschedule because this doctor day has already started or completed."
                            : ""
                        }
                        className="px-4 py-2 text-sm rounded-xl border border-border text-text-secondary hover:bg-secondary transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reschedule
                      </button>
                    )}

                    {(apt.status === "confirmed" ||
                      apt.status === "ongoing" ||
                      apt.status === "rescheduled") &&
                      isOnline && (
                        <TelemedicineJoinButton
                          sessionId={apt.telemedicineSessionId}
                          role="patient"
                          label="Join Session"
                          className="px-4 py-2 text-sm rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-all flex items-center gap-1.5"
                        />
                      )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Appointment"
        message={`This will cancel your appointment with ${cancelTarget?.doctorName}. A refund will be initiated.`}
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        variant="danger"
        isLoading={cancelling}
      />

      <RescheduleAppointmentModal
        isOpen={!!rescheduleTarget}
        appointment={rescheduleTarget}
        doctor={rescheduleDoctor}
        isSubmitting={rescheduling}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={handleReschedule}
      />
    </div>
  );
}
