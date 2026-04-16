'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDoctorAvailability, useCreateAvailability } from '@/hooks/useDoctor';
import { ConsultationType } from '@/types/common';
import { generateTimeSlots, formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  consultationType: z.enum(['physical', 'online']),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
  slotDuration: z.number().min(15).max(60),
}).refine(d => d.startTime < d.endTime, { message: 'End time must be after start time', path: ['endTime'] });

type FormData = z.infer<typeof schema>;

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const { data: availabilities = [], isLoading } = useDoctorAvailability(user?.id ?? '');
  const { mutate: createAvailability, isPending } = useCreateAvailability();
  const [previewSlots, setPreviewSlots] = useState<{ start: string; end: string }[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: '', consultationType: 'physical', startTime: '09:00', endTime: '12:00', slotDuration: 30 },
  });

  const [startTime, endTime, slotDuration] = watch(['startTime', 'endTime', 'slotDuration']);

  const handlePreview = () => {
    const slots = generateTimeSlots(startTime, endTime, slotDuration);
    setPreviewSlots(slots);
  };

  const onSubmit = (data: FormData) => {
    createAvailability({
      doctorId: user?.id ?? '',
      date: data.date,
      consultationType: data.consultationType,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
    }, {
      onSuccess: () => {
        toast.success('Availability saved successfully!');
        setPreviewSlots([]);
      },
      onError: () => toast.error('Failed to save availability.'),
    });
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text">My Schedule</h1>
        <p className="text-text-secondary text-sm mt-1">Create and manage your availability slots</p>
      </div>

      {/* Create Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
        <h2 className="font-semibold text-text">Add Availability</h2>

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
                    watch('consultationType') === type ? 'border-primary bg-primary-50 text-primary' : 'border-border bg-background text-text-secondary hover:bg-secondary'
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
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary-50 text-sm font-medium transition-all"
          >
            Preview Slots
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Save Slots'}
          </button>
        </div>

        {/* Preview table */}
        {previewSlots.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text mb-2">{previewSlots.length} slots will be created:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {previewSlots.map((slot, i) => (
                <div key={i} className="px-2 py-1.5 bg-primary-50 border border-primary-100 rounded-lg text-xs text-primary font-medium text-center">
                  {formatTime(slot.start)}
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
                  </div>
                </div>
                <div className="text-xs text-text-muted">
                  {avail.slots.filter(s => s.isBooked).length}/{avail.slots.length} booked
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
