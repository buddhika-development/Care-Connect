'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Calendar, Pencil, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useDoctorAvailability,
  useCancelAvailability,
  useCreateAvailability,
  useDoctorProfile,
  useUpdateAvailability,
} from '@/hooks/useDoctor';
import { DoctorAvailability } from '@/types/doctor';
import { ConsultationType } from '@/types/common';
import { generateTimeSlots, formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  initialScheduleFormDraft,
  useDoctorScheduleUIStore,
} from '@/store/doctorScheduleStore';

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const todayLocalDateString = (): string => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  consultationType: z.enum(['physical', 'online']),
  startTime: z.string().regex(TIME_24H_REGEX, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(TIME_24H_REGEX, 'End time must be in HH:MM format'),
  slotDuration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(120, 'Duration must be 120 minutes or less'),
  consultationFee: z.number().int().min(1, 'Consultation fee is required'),
}).superRefine((data, ctx) => {
  if (data.date < todayLocalDateString()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['date'],
      message: 'Date cannot be in the past',
    });
  }

  if (!TIME_24H_REGEX.test(data.startTime) || !TIME_24H_REGEX.test(data.endTime)) {
    return;
  }

  const startMinutes = parseTimeToMinutes(data.startTime);
  const endMinutes = parseTimeToMinutes(data.endTime);

  if (endMinutes <= startMinutes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'End time must be after start time',
    });
  }

  if (endMinutes - startMinutes < data.slotDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['slotDuration'],
      message: 'Duration is too large for this time window',
    });
  }
});

type FormData = z.infer<typeof schema>;

function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'Failed to save availability. Please try again.';
}

function draftFromAvailability(availability: DoctorAvailability) {
  return {
    date: availability.date,
    consultationType: availability.consultationType,
    startTime: availability.startTime,
    endTime: availability.endTime,
    slotDuration: availability.slotDuration,
    consultationFee: availability.consultationFee,
  };
}

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const {
    data: doctorProfile,
    isLoading: isProfileLoading,
  } = useDoctorProfile();
  const {
    data: availabilities = [],
    isLoading,
    isError,
    error,
  } = useDoctorAvailability(user?.id ?? '');
  const { mutate: createAvailability, isPending: isCreatePending } = useCreateAvailability();
  const { mutate: updateAvailability, isPending: isUpdatePending } = useUpdateAvailability();
  const { mutate: cancelAvailability, isPending: isCancelPending } = useCancelAvailability();
  const formDraft = useDoctorScheduleUIStore((s) => s.formDraft);
  const setFormDraft = useDoctorScheduleUIStore((s) => s.setFormDraft);
  const previewSlots = useDoctorScheduleUIStore((s) => s.previewSlots);
  const setPreviewSlots = useDoctorScheduleUIStore((s) => s.setPreviewSlots);
  const clearPreviewSlots = useDoctorScheduleUIStore((s) => s.clearPreviewSlots);
  const resetFormDraft = useDoctorScheduleUIStore((s) => s.resetFormDraft);
  const editingAvailabilityId = useDoctorScheduleUIStore((s) => s.editingAvailabilityId);
  const pendingCancelAvailabilityId = useDoctorScheduleUIStore((s) => s.pendingCancelAvailabilityId);
  const startEditingAvailability = useDoctorScheduleUIStore((s) => s.startEditingAvailability);
  const stopEditingAvailability = useDoctorScheduleUIStore((s) => s.stopEditingAvailability);
  const openCancelAvailability = useDoctorScheduleUIStore((s) => s.openCancelAvailability);
  const closeCancelAvailability = useDoctorScheduleUIStore((s) => s.closeCancelAvailability);
  const canManageAvailability = !!doctorProfile?.id;
  const isMutationPending = isCreatePending || isUpdatePending || isCancelPending;

  const {
    register,
    handleSubmit,
    control,
    getValues,
    trigger,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: formDraft,
  });

  const watchedDate = useWatch({ control, name: 'date' });
  const watchedConsultationType = useWatch({ control, name: 'consultationType' });
  const watchedStartTime = useWatch({ control, name: 'startTime' });
  const watchedEndTime = useWatch({ control, name: 'endTime' });
  const watchedSlotDuration = useWatch({ control, name: 'slotDuration' });
  const watchedConsultationFee = useWatch({ control, name: 'consultationFee' });

  const editingAvailability = editingAvailabilityId
    ? availabilities.find((availability) => availability.id === editingAvailabilityId) ?? null
    : null;

  const pendingCancelAvailability = pendingCancelAvailabilityId
    ? availabilities.find((availability) => availability.id === pendingCancelAvailabilityId) ?? null
    : null;

  useEffect(() => {
    setFormDraft({
      date: watchedDate ?? '',
      consultationType: watchedConsultationType ?? 'physical',
      startTime: watchedStartTime ?? '09:00',
      endTime: watchedEndTime ?? '12:00',
      slotDuration: watchedSlotDuration ?? 30,
      consultationFee: watchedConsultationFee ?? 1000,
    });
    clearPreviewSlots();
  }, [
    watchedDate,
    watchedConsultationType,
    watchedStartTime,
    watchedEndTime,
    watchedSlotDuration,
    watchedConsultationFee,
    setFormDraft,
    clearPreviewSlots,
  ]);

  const isDateAlreadyUsed = (date: string) =>
    availabilities.some((availability) => availability.date === date);

  const isDateAlreadyUsedByOtherAvailability = (date: string, excludeId?: string | null) =>
    availabilities.some((availability) => availability.date === date && availability.id !== excludeId);

  const handlePreview = async () => {
    if (!canManageAvailability) {
      toast.error('Complete your doctor profile before adding availability.');
      return;
    }

    const isValid = await trigger([
      'date',
      'consultationType',
      'startTime',
      'endTime',
      'slotDuration',
      'consultationFee',
    ]);

    if (!isValid) return;

    const values = getValues();

    if (isDateAlreadyUsedByOtherAvailability(values.date, editingAvailabilityId)) {
      setError('date', {
        type: 'manual',
        message: 'Availability already exists for this date',
      });
      return;
    }

    clearErrors('date');

    const slots = generateTimeSlots(
      values.startTime,
      values.endTime,
      values.slotDuration,
    );

    setPreviewSlots(slots);
  };

  const onSubmit = (data: FormData) => {
    if (!canManageAvailability) {
      toast.error('Complete your doctor profile before adding availability.');
      return;
    }

    if (isDateAlreadyUsedByOtherAvailability(data.date, editingAvailabilityId)) {
      setError('date', {
        type: 'manual',
        message: 'Availability already exists for this date',
      });
      toast.error('Availability already exists for this date.');
      return;
    }

    clearErrors('date');

    if (editingAvailabilityId) {
      updateAvailability({
        availabilityId: editingAvailabilityId,
        date: data.date,
        consultationType: data.consultationType,
        startTime: data.startTime,
        endTime: data.endTime,
        slotDuration: data.slotDuration,
        consultationFee: data.consultationFee,
        status: 'scheduled',
      }, {
        onSuccess: () => {
          toast.success('Availability updated successfully!');
          clearPreviewSlots();
          stopEditingAvailability();
          reset(initialScheduleFormDraft);
        },
        onError: (submitError) => toast.error(getApiErrorMessage(submitError)),
      });
      return;
    }

    createAvailability({
      date: data.date,
      consultationType: data.consultationType,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      consultationFee: data.consultationFee,
      status: 'scheduled',
    }, {
      onSuccess: () => {
        toast.success('Availability saved successfully!');
        clearPreviewSlots();
        resetFormDraft();
        reset(initialScheduleFormDraft);
      },
      onError: (submitError) => toast.error(getApiErrorMessage(submitError)),
    });
  };

  const handleStartEdit = (availability: DoctorAvailability) => {
    if (isMutationPending) return;

    const draft = draftFromAvailability(availability);
    startEditingAvailability(availability.id, draft);
    clearErrors();
    reset(draft);
    clearPreviewSlots();
    toast.info('Editing selected availability. Update and save when ready.');
  };

  const handleStopEdit = () => {
    stopEditingAvailability();
    clearErrors();
    reset(initialScheduleFormDraft);
    clearPreviewSlots();
  };

  const handleConfirmCancelAvailability = () => {
    if (!pendingCancelAvailabilityId) return;

    cancelAvailability(pendingCancelAvailabilityId, {
      onSuccess: () => {
        toast.success('Availability cancelled successfully.');
        if (editingAvailabilityId === pendingCancelAvailabilityId) {
          handleStopEdit();
        }
        closeCancelAvailability();
      },
      onError: (cancelError) => {
        toast.error(getApiErrorMessage(cancelError));
      },
    });
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text">My Schedule</h1>
        <p className="text-text-secondary text-sm mt-1">Create and manage your availability slots</p>
      </div>

      {!isProfileLoading && !canManageAvailability && (
        <div className="rounded-xl border border-warning/40 bg-warning-light/40 px-4 py-3">
          <p className="text-sm text-warning font-medium">Complete your doctor profile first</p>
          <p className="text-xs text-text-muted mt-1">
            The backend only allows availability creation after your doctor profile is created.
          </p>
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-text">
            {editingAvailabilityId ? 'Edit Availability' : 'Add Availability'}
          </h2>
          {editingAvailabilityId && (
            <button
              type="button"
              onClick={handleStopEdit}
              disabled={isMutationPending}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:bg-secondary disabled:opacity-60"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Date</label>
            <input {...register('date')} type="date" className={inputClass} min={new Date().toISOString().split('T')[0]} />
            {errors.date && <p className="text-error text-xs mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Consultation Type</label>
            <div className="flex gap-2">
              {(['physical', 'online'] as ConsultationType[]).map(type => (
                <label key={type} className="flex-1 cursor-pointer">
                  <input {...register('consultationType')} type="radio" value={type} className="sr-only" />
                  <div className={cn(
                    'py-2.5 px-3 rounded-xl border-2 text-sm font-medium text-center transition-all capitalize cursor-pointer',
                    watchedConsultationType === type ? 'border-primary bg-primary-50 text-primary' : 'border-border bg-background text-text-secondary hover:bg-secondary'
                  )}>
                    {type === 'online' ? '📹 Online' : '🏥 Physical'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Start Time</label>
            <input {...register('startTime')} type="time" className={inputClass} />
            {errors.startTime && <p className="text-error text-xs mt-1">{errors.startTime.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">End Time</label>
            <input {...register('endTime')} type="time" className={inputClass} />
            {errors.endTime && <p className="text-error text-xs mt-1">{errors.endTime.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Duration per Patient</label>
            <select {...register('slotDuration', { valueAsNumber: true })} className={inputClass}>
              {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Consultation Fee (LKR)</label>
            <input
              {...register('consultationFee', { valueAsNumber: true })}
              type="number"
              min={1}
              step="1"
              className={inputClass}
              placeholder="1000"
            />
            {errors.consultationFee && <p className="text-error text-xs mt-1">{errors.consultationFee.message}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isMutationPending || !canManageAvailability}
            className="px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary-50 text-sm font-medium transition-all disabled:opacity-60"
          >
            Preview Slots
          </button>
          <button
            type="submit"
            disabled={isMutationPending || !canManageAvailability}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isCreatePending || isUpdatePending
              ? (editingAvailabilityId ? 'Updating...' : 'Saving...')
              : (editingAvailabilityId ? 'Update Slots' : 'Save Slots')}
          </button>
        </div>

        {editingAvailability && (
          <p className="text-xs text-text-muted">
            You are editing {formatDate(editingAvailability.date)}. Updating will regenerate slots for this date.
          </p>
        )}

        {/* Preview table */}
        {previewSlots.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text mb-2">{previewSlots.length} slots will be created:</p>
            <p className="text-xs text-text-muted mb-3">Consultation fee: LKR {watchedConsultationFee ?? 1000}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {previewSlots.map((slot, i) => (
                <div key={i} className="px-2 py-1.5 bg-primary-50 border border-primary-100 rounded-lg text-xs text-primary font-medium text-center">
                  {formatTime(slot.start)} - {formatTime(slot.end)}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Existing Availability Calendar */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h2 className="font-semibold text-text mb-4">Your Availability</h2>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
        ) : isError ? (
          <p className="text-sm text-error">{getApiErrorMessage(error)}</p>
        ) : availabilities.length === 0 ? (
          <EmptyState icon={Calendar} title="No availability set" description="Add your first availability slot above." />
        ) : (
          <div className="space-y-3">
            {availabilities.map(avail => (
              <div key={avail.id} className={cn(
                'flex items-center justify-between p-4 rounded-xl border-l-4',
                avail.consultationType === 'online' ? 'bg-primary-50/50 border-primary' : 'bg-secondary border-accent'
              )}>
                <div>
                  <p className="font-medium text-text">{formatDate(avail.date)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', avail.consultationType === 'online' ? 'bg-primary-100 text-primary' : 'bg-orange-100 text-accent')}>
                      {avail.consultationType === 'online' ? '📹 Online' : '🏥 Physical'}
                    </span>
                    <span className="text-xs text-text-muted">{formatTime(avail.startTime)} – {formatTime(avail.endTime)}</span>
                    <span className="text-xs text-text-muted">{avail.slots.length} slots</span>
                    <span className="text-xs text-text-muted">{avail.slotDuration} min each</span>
                    <span className="text-xs text-text-muted">LKR {avail.consultationFee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-text-muted text-right">
                    {avail.slots.filter(s => s.isBooked).length}/{avail.slots.length} booked
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(avail)}
                      disabled={isMutationPending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-secondary disabled:opacity-60"
                      title="Edit availability"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openCancelAvailability(avail.id)}
                      disabled={isMutationPending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-error/30 text-xs text-error hover:bg-error-light disabled:opacity-60"
                      title="Cancel availability"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingCancelAvailabilityId}
        title="Cancel Availability"
        message={pendingCancelAvailability
          ? `Cancel availability on ${formatDate(pendingCancelAvailability.date)}? This cannot be undone.`
          : 'Cancel this availability? This cannot be undone.'}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep"
        variant="danger"
        isLoading={isCancelPending}
        onConfirm={handleConfirmCancelAvailability}
        onCancel={closeCancelAvailability}
      />
    </div>
  );
}
