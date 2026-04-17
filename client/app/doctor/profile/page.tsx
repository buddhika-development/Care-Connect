'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/hooks/useDoctor';
import { useAuth } from '@/context/AuthContext';
import { useProfileUIStore } from '@/store/profileStore';

const schema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  specialization: z.string().min(2, 'Specialization required'),
  licenseNumber: z.string().min(3, 'License number required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  experienceYears: z.number().min(0).max(60),
  bio: z.string().max(500, 'Max 500 characters').optional(),
});

type FormData = z.infer<typeof schema>;

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 skeleton rounded w-48" />
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="h-24 w-24 skeleton rounded-full" />
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
      </div>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, isError, refetch } = useDoctorProfile();
  const { mutate: updateProfile, isPending } = useUpdateDoctorProfile();
  const previewUrl = useProfileUIStore((s) => s.profileImagePreview);
  const setPreviewUrl = useProfileUIStore((s) => s.setProfileImagePreview);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      specialization: '',
      licenseNumber: '',
      roomNumber: '',
      experienceYears: 0,
      bio: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        specialization: profile.specialization,
        licenseNumber: profile.licenseNumber,
        roomNumber: profile.roomNumber,
        experienceYears: profile.experienceYears,
        bio: profile.bio,
      });
    } else if (user) {
      reset({
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        specialization: '',
        licenseNumber: '',
        roomNumber: '',
        experienceYears: 0,
        bio: '',
      });
    }
  }, [profile, reset, user]);

  const onSubmit = (data: FormData) => {
    updateProfile({
      mode: profile?.id ? 'update' : 'create',
      payload: {
        full_name: data.fullName,
        specialization: data.specialization,
        license_number: data.licenseNumber,
        room_number: data.roomNumber,
        experience_years: data.experienceYears,
        bio: data.bio,
      },
    }, {
      onSuccess: () => {
        // updateUserProfileStatus(true) is called inside the hook's onSuccess
        toast.success(profile?.id ? 'Profile updated!' : 'Profile created!');
      },
      onError: () => toast.error('Update failed. Try again.'),
    });
  };

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return (
    <div className="flex flex-col items-center py-20 text-center">
      <p className="text-error font-medium mb-3">Failed to load profile.</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
    </div>
  );

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Profile Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your professional and personal information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-text mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-accent">
                    {(user?.firstName?.[0] ?? '')}{(user?.lastName?.[0] ?? '')}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-accent rounded-full flex items-center justify-center border-2 border-card">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviewUrl(URL.createObjectURL(f)); }} />
            </div>
            <div>
              <p className="text-sm font-medium text-text">Dr. {user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-text-muted mt-0.5">{profile?.specialization || 'Complete your profile to start receiving appointments.'}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${user?.isVerified ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                {user?.isVerified ? '✓ Verified' : 'Verification Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Account Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1.5">First Name</label><input value={user?.firstName ?? ''} disabled className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">Last Name</label><input value={user?.lastName ?? ''} disabled className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Email</label><input value={user?.email ?? ''} disabled className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Verification</label><input value={user?.isVerified ? 'Verified' : 'Pending verification'} disabled className={inputClass} /></div>
          <p className="text-xs text-text-muted">Email and account name are managed by authentication and cannot be edited here.</p>
        </div>

        {/* Profile Fields */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Professional Profile</h2>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Display Name</label>
            <input {...register('fullName')} placeholder="Dr. John Doe" className={inputClass} />
            {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Specialization</label>
              <input {...register('specialization')} placeholder="General Physician" className={inputClass} />
              {errors.specialization && <p className="text-error text-xs mt-1">{errors.specialization.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Medical License Number</label>
              <input {...register('licenseNumber')} placeholder="SLMC-XXXX" className={inputClass} />
              {errors.licenseNumber && <p className="text-error text-xs mt-1">{errors.licenseNumber.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Room Number</label>
              <input {...register('roomNumber')} placeholder="A-102" className={inputClass} />
              {errors.roomNumber && <p className="text-error text-xs mt-1">{errors.roomNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Years of Experience</label>
              <input {...register('experienceYears', { valueAsNumber: true })} type="number" min={0} className={inputClass} />
              {errors.experienceYears && <p className="text-error text-xs mt-1">{errors.experienceYears.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Short Bio</label>
            <textarea {...register('bio')} rows={3} placeholder="Brief professional bio..." className={`${inputClass} resize-none`} />
            {errors.bio && <p className="text-error text-xs mt-1">{errors.bio.message}</p>}
          </div>
        </div>

        <button type="submit" disabled={isPending} className="w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
