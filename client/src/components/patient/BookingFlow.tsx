'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { X, ChevronLeft, ChevronRight, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DoctorCard, transformAvailability } from '@/types/doctor';
import { ConsultationType } from '@/types/common';
import { useBookingStore } from '@/store/bookingStore';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useAuth } from '@/context/AuthContext';
import { initiatePayment, submitPayhereForm } from '@/services/paymentService';
import { formatCurrency, formatTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BookingFlowProps {
  doctor: DoctorCard;
  onClose: () => void;
}

const STEPS = ['Date & Type', 'Time Slot', 'Summary', 'Payment'];

export default function BookingFlow({ doctor, onClose }: BookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();

  const {
    currentStep, setStep,
    selectedDate, setDate,
    consultationType, setConsultationType,
    selectedSlot, setSlot,
    resetBooking,
  } = useBookingStore();

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'booking' | 'payment' | 'redirecting' | null>(null);

  const { mutateAsync: createAppointment } = useCreateAppointment();

  // ── Transform embedded availabilities into UI-friendly shape ─────────────────
  const availabilities = useMemo(
    () => doctor.availabilities.map((a) => transformAvailability(a, doctor.id)),
    [doctor.availabilities, doctor.id]
  );

  // Filter by selected consultation type
  const filteredAvailabilities = availabilities.filter(
    (a) => a.consultationType === consultationType
  );
  const availableDates = filteredAvailabilities.map((a) => a.date);

  // Slots for the selected date
  const selectedAvailability = filteredAvailabilities.find((a) => a.date === selectedDate);
  const slots = selectedAvailability?.slots ?? [];

  // Consultation fee — per-availability, falls back to doctor's base fee
  const currentFee = selectedAvailability?.consultationFee ?? doctor.consultationFee;

  // Generate next 60 days for the calendar (covers most availability windows)
  const today = startOfDay(new Date());
  const calendarDays = Array.from({ length: 60 }, (_, i) => {
    const d = addDays(today, i);
    return format(d, 'yyyy-MM-dd');
  });

  // Day-of-week offset for the first cell in the calendar grid
  const calendarStartDayOfWeek = today.getDay();

  // Only show consultation types that have at least one availability
  const availableTypes = [
    ...new Set(doctor.availabilities.map((a) => a.channeling_mode)),
  ] as ConsultationType[];

  const handleClose = () => {
    resetBooking();
    onClose();
  };

  /**
   * Real payment flow:
   * 1. Create appointment → get appointmentId
   * 2. Initiate payment → get PayHere checkoutData + paymentUrl
   * 3. Store appointmentId in sessionStorage (return page reads it)
   * 4. Submit hidden form → browser navigates to PayHere sandbox
   */
  const handleConfirmAndPay = async () => {
    if (!selectedSlot || !selectedDate || !user) return;
    setIsProcessing(true);

    try {
      // Step 1: create the appointment record
      // Build scheduledAt ISO string: combine date + slot start time
      setProcessingStep('booking');
      const scheduledAt = `${selectedDate}T${selectedSlot.startTime}:00`;
      const apt = await createAppointment({
        doctorId: doctor.userId,
        slotId: selectedSlot.id,
        scheduledAt,
        channelingMode: consultationType,
        consultationFee: currentFee,
      });

      // Step 2: initiate PayHere payment
      setProcessingStep('payment');
      const patientName = `${user.firstName} ${user.lastName}`.trim();
      const paymentResponse = await initiatePayment({
        appointmentId: apt.id,
        amount: currentFee,
        patientName,
        patientEmail: user.email,
      });

      // Step 3: persist appointmentId so /payment/return can pick it up
      sessionStorage.setItem('pendingAppointmentId', apt.id);
      sessionStorage.setItem('pendingDoctorName', `Dr. ${doctor.firstName} ${doctor.lastName}`);
      sessionStorage.setItem('pendingAmount', String(currentFee));

      // Step 4: navigate away to PayHere
      setProcessingStep('redirecting');
      submitPayhereForm(paymentResponse.checkoutData, paymentResponse.paymentUrl);

      // The browser navigates away here — code below won't run during normal flow
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed. Please try again.';
      toast.error(message);
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const processingMessages = {
    booking: 'Creating your appointment...',
    payment: 'Preparing payment...',
    redirecting: 'Redirecting to PayHere...',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isProcessing ? handleClose : undefined} />

      <div className="relative bg-card rounded-2xl shadow-modal border border-border w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-text">Book Appointment</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Dr. {doctor.firstName} {doctor.lastName} · {doctor.specialization}
            </p>
          </div>
          <button onClick={handleClose} disabled={isProcessing} className="p-1.5 rounded-lg hover:bg-secondary text-text-muted hover:text-text disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 flex items-center gap-2 border-b border-border flex-shrink-0">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                'w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center',
                i + 1 < currentStep ? 'bg-primary text-white' :
                i + 1 === currentStep ? 'bg-primary text-white ring-2 ring-primary/30' :
                'bg-border-light text-text-muted'
              )}>
                {i + 1 < currentStep ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i + 1 === currentStep ? 'text-primary' : 'text-text-muted')}>
                {step}
              </span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1: Type + Date */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text mb-2">Consultation Type</label>
                {availableTypes.length === 0 ? (
                  <p className="text-sm text-text-muted">This doctor has no available consultation slots.</p>
                ) : (
                  <div className="flex gap-2">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setConsultationType(type)}
                        className={cn(
                          'flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all capitalize',
                          consultationType === type
                            ? 'border-primary bg-primary-50 text-primary'
                            : 'border-border bg-background text-text-secondary hover:bg-secondary'
                        )}
                      >
                        {type === 'online' ? '📹 Online' : '🏥 Physical'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Select Date
                  <span className="text-xs text-text-muted ml-2 font-normal">
                    (Showing available {consultationType} dates)
                  </span>
                </label>
                <div className="grid grid-cols-7 gap-1 max-h-52 overflow-y-auto pr-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-xs text-text-muted font-medium py-1 sticky top-0 bg-card z-10">{d}</div>
                  ))}
                  {Array.from({ length: calendarStartDayOfWeek }, (_, i) => <div key={`empty-${i}`} />)}
                  {calendarDays.map((date) => {
                    const isAvailable = availableDates.includes(date);
                    const isSelected = selectedDate === date;
                    const isPast = isBefore(parseISO(date), today);
                    return (
                      <button
                        key={date}
                        disabled={!isAvailable || isPast}
                        onClick={() => setDate(date)}
                        className={cn(
                          'w-full aspect-square rounded-lg text-xs font-medium transition-all',
                          isSelected ? 'bg-primary text-white' :
                          isAvailable && !isPast ? 'bg-primary-50 text-primary hover:bg-primary hover:text-white' :
                          'bg-background text-text-muted cursor-not-allowed opacity-40'
                        )}
                        title={isAvailable ? format(parseISO(date), 'dd MMM') : ''}
                      >
                        {format(parseISO(date), 'd')}
                      </button>
                    );
                  })}
                </div>
                {availableDates.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">
                    No {consultationType} availability in the next 60 days
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Time Slot */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-text">
                  Available Slots — {selectedDate ? format(parseISO(selectedDate), 'EEEE, dd MMM yyyy') : ''}
                </p>
                <p className="text-xs text-text-muted mt-0.5 mb-4">
                  {selectedAvailability?.slotDuration ?? 30}-minute slots · {formatCurrency(currentFee)} per slot
                </p>
              </div>
              {slots.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">No slots available for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      disabled={slot.isBooked}
                      onClick={() => setSlot(slot)}
                      className={cn(
                        'py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition-all',
                        selectedSlot?.id === slot.id ? 'border-primary bg-primary text-white' :
                        slot.isBooked ? 'border-border bg-border-light text-text-muted cursor-not-allowed' :
                        'border-border bg-background text-text hover:border-primary hover:bg-primary-50'
                      )}
                    >
                      {formatTime(slot.startTime)}
                      {slot.isBooked && <span className="block text-[10px] text-text-muted">Booked</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Summary */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-text">Booking Summary</h3>
              <div className="bg-secondary rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-lg font-bold text-primary">
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </div>
                  <div>
                    <p className="font-semibold text-text">Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p className="text-sm text-primary">{doctor.specialization}</p>
                  </div>
                </div>
                {[
                  { label: 'Date', value: selectedDate ? format(parseISO(selectedDate), 'EEEE, dd MMM yyyy') : '' },
                  { label: 'Time', value: selectedSlot ? `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}` : '' },
                  { label: 'Type', value: consultationType === 'online' ? '📹 Online Consultation' : '🏥 Physical Visit' },
                  { label: 'Room', value: doctor.roomNumber ? `Room ${doctor.roomNumber}` : '—' },
                  { label: 'Fee', value: formatCurrency(currentFee) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-medium text-text">{value}</span>
                  </div>
                ))}
              </div>

              {/* PayHere branding notice */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">
                  You will be redirected to <strong>PayHere</strong> to complete secure payment.
                  Your appointment will be confirmed after payment.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Redirecting / Processing */}
          {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-text">
                {processingStep ? processingMessages[processingStep] : 'Processing...'}
              </h3>
              <p className="text-sm text-text-muted text-center max-w-xs">
                Please do not close this window. You will be redirected to PayHere to complete your payment.
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => currentStep > 1 ? setStep((currentStep - 1) as 1 | 2 | 3 | 4) : handleClose()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-secondary text-sm font-medium transition-all disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {/* Steps 1 & 2: simple Next */}
          {currentStep < 3 && (
            <button
              onClick={() => setStep((currentStep + 1) as 2 | 3)}
              disabled={
                (currentStep === 1 && !selectedDate) ||
                (currentStep === 2 && !selectedSlot)
              }
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Step 3: Confirm & Pay — triggers real PayHere flow */}
          {currentStep === 3 && (
            <button
              onClick={async () => {
                setStep(4);
                await handleConfirmAndPay();
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-all disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Confirm & Pay {formatCurrency(currentFee)}
                </>
              )}
            </button>
          )}

          {/* Step 4: no action button — we're redirecting */}
        </div>
      </div>
    </div>
  );
}
