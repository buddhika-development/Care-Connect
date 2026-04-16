'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { X, ChevronLeft, ChevronRight, CreditCard, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DoctorCard } from '@/types/doctor';
import { ConsultationType } from '@/types/common';
import { useBookingStore } from '@/store/bookingStore';
import { useDoctorAvailability } from '@/hooks/useDoctor';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { processPayment } from '@/services/paymentService';
import { formatCurrency, formatTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BookingFlowProps {
  doctor: DoctorCard;
  onClose: () => void;
}

const STEPS = ['Date & Type', 'Time Slot', 'Summary', 'Payment'];

export default function BookingFlow({ doctor, onClose }: BookingFlowProps) {
  const router = useRouter();
  const {
    currentStep, setStep,
    selectedDate, setDate,
    consultationType, setConsultationType,
    selectedSlot, setSlot,
    paymentStatus, setPaymentStatus,
    resetBooking,
  } = useBookingStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  const { data: availabilities = [] } = useDoctorAvailability(doctor.id);
  const { mutateAsync: createAppointment } = useCreateAppointment();

  // Filter availabilities by consultation type
  const filteredAvailabilities = availabilities.filter(a => a.consultationType === consultationType);
  const availableDates = filteredAvailabilities.map(a => a.date);

  // Available slots for selected date
  const selectedAvailability = filteredAvailabilities.find(a => a.date === selectedDate);
  const slots = selectedAvailability?.slots ?? [];

  // Generate next 14 days for the calendar grid
  const today = startOfDay(new Date());
  const calendarDays = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i);
    return format(d, 'yyyy-MM-dd');
  });

  const handleClose = () => {
    resetBooking();
    onClose();
  };

  const handlePayment = async (outcome: 'success' | 'failed' | 'crashed') => {
    if (!selectedSlot || !selectedDate) return;
    setIsProcessing(true);
    try {
      const apt = await createAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        slotId: selectedSlot.id,
        consultationType,
      });
      setCreatedAppointmentId(apt.id);
      const result = await processPayment(apt.id, doctor.consultationFee, outcome);

      if (result.status === 'success') {
        setPaymentStatus('success');
        toast.success('Payment confirmed! Appointment booked.');
      } else if (result.status === 'failed') {
        setPaymentStatus('failed');
        toast.error('Payment failed. Appointment cancelled.');
      } else {
        setPaymentStatus('crashed');
        toast.warning('Something went wrong. Appointment will auto-cancel in 15 minutes.');
      }
    } catch {
      toast.error('Booking failed. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleDone = () => {
    handleClose();
    router.push('/patient/appointments');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-card rounded-2xl shadow-modal border border-border w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-text">Book Appointment</h2>
            <p className="text-xs text-text-muted mt-0.5">Dr. {doctor.firstName} {doctor.lastName} · {doctor.specialization}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary text-text-muted hover:text-text">
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
                <div className="flex gap-2">
                  {(['physical', 'online'] as ConsultationType[]).filter(t => doctor.availableConsultationTypes.includes(t)).map(type => (
                    <button
                      key={type}
                      onClick={() => setConsultationType(type)}
                      className={cn(
                        'flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all capitalize',
                        consultationType === type ? 'border-primary bg-primary-50 text-primary' : 'border-border bg-background text-text-secondary hover:bg-secondary'
                      )}
                    >
                      {type === 'online' ? '📹 Online' : '🏥 Physical'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Select Date
                  <span className="text-xs text-text-muted ml-2 font-normal">
                    (Showing available {consultationType} dates)
                  </span>
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-xs text-text-muted font-medium py-1">{d}</div>
                  ))}
                  {/* Offset for day of week */}
                  {Array.from({ length: today.getDay() }, (_, i) => <div key={`empty-${i}`} />)}
                  {calendarDays.map(date => {
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
                      >
                        {format(parseISO(date), 'd')}
                      </button>
                    );
                  })}
                </div>
                {availableDates.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-4">No {consultationType} availability in the next 14 days</p>
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
                <p className="text-xs text-text-muted mt-0.5 mb-4">Select a 30-minute slot</p>
              </div>
              {slots.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">No slots available for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
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
                  { label: 'Hospital', value: doctor.currentHospital },
                  { label: 'Fee', value: formatCurrency(doctor.consultationFee) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-medium text-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {paymentStatus === 'idle' ? (
                <>
                  {/* PayHere-style mock card UI */}
                  <div className="bg-text rounded-2xl p-5 text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-7 bg-white/20 rounded" />
                      <CreditCard className="w-6 h-6 text-white/60" />
                    </div>
                    <div>
                      <p className="font-mono text-lg tracking-widest">•••• •••• •••• 4242</p>
                    </div>
                    <div className="flex justify-between text-xs text-white/70">
                      <span>CARDHOLDER NAME</span>
                      <span>EXPIRES</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Kavindi Perera</span>
                      <span>12/28</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input placeholder="Card Number" disabled className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-muted cursor-not-allowed" />
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="MM/YY" disabled className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-muted cursor-not-allowed" />
                      <input placeholder="CVV" disabled className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text-muted cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="bg-secondary rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm text-text-secondary font-medium">Total Amount</span>
                    <span className="text-base font-bold text-text">{formatCurrency(doctor.consultationFee)}</span>
                  </div>

                  <p className="text-xs text-text-muted text-center">This is a simulation. Choose an outcome below.</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePayment('success')}
                      disabled={isProcessing}
                      className="w-full py-3 bg-success hover:bg-green-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isProcessing ? 'Processing...' : 'Simulate Payment Success'}
                    </button>
                    <button
                      onClick={() => handlePayment('failed')}
                      disabled={isProcessing}
                      className="w-full py-3 bg-error hover:bg-red-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Simulate Payment Failed
                    </button>
                    <button
                      onClick={() => handlePayment('crashed')}
                      disabled={isProcessing}
                      className="w-full py-3 bg-warning hover:bg-amber-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Simulate Gateway Crash
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  {paymentStatus === 'success' && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="text-lg font-bold text-text">Appointment Booked!</h3>
                      <p className="text-text-secondary text-sm mt-2">Your payment was confirmed and appointment is scheduled.</p>
                    </>
                  )}
                  {paymentStatus === 'failed' && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8 text-error" />
                      </div>
                      <h3 className="text-lg font-bold text-text">Payment Failed</h3>
                      <p className="text-text-secondary text-sm mt-2">Your appointment has been cancelled.</p>
                    </>
                  )}
                  {paymentStatus === 'crashed' && (
                    <>
                      <div className="w-16 h-16 rounded-full bg-warning-light flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-warning" />
                      </div>
                      <h3 className="text-lg font-bold text-text">Gateway Error</h3>
                      <p className="text-text-secondary text-sm mt-2">Appointment will auto-cancel in <span className="font-bold text-warning">15:00</span> mins if payment is not confirmed.</p>
                    </>
                  )}
                  <button
                    onClick={handleDone}
                    className="mt-6 px-8 py-3 bg-primary text-white font-semibold rounded-xl text-sm"
                  >
                    View My Appointments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {paymentStatus === 'idle' && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => currentStep > 1 ? setStep((currentStep - 1) as 1|2|3|4) : handleClose()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary hover:bg-secondary text-sm font-medium transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < 4 && (
              <button
                onClick={() => setStep((currentStep + 1) as 1|2|3|4)}
                disabled={
                  (currentStep === 1 && !selectedDate) ||
                  (currentStep === 2 && !selectedSlot) ||
                  false
                }
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {currentStep === 3 ? 'Confirm & Pay' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
