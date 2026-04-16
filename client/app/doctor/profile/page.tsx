'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';
import { useDoctorProfile, useUpdateDoctorProfile } from '@/hooks/useDoctor';
import { calculateAge } from '@/lib/utils';

const schema = z.object({
  phone: z.string().min(9, 'Valid phone number required'),
  dateOfBirth: z.string().min(1, 'Date of birth required'),
  gender: z.string().min(1, 'Gender required'),
  specialization: z.string().min(2, 'Specialization required'),
  medicalLicenseNumber: z.string().min(3, 'License number required'),
  currentHospital: z.string().min(3, 'Hospital name required'),
  yearsOfExperience: z.number().min(0).max(60),
  consultationFee: z.number().min(100, 'Minimum fee is LKR 100'),
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
  const { data: profile, isLoading, isError, refetch } = useDoctorProfile();
  const { mutate: updateProfile, isPending } = useUpdateDoctorProfile();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', dateOfBirth: '', gender: '', specialization: '', medicalLicenseNumber: '', currentHospital: '', yearsOfExperience: 0, consultationFee: 1000, bio: '' },
  });

  const dob = watch('dateOfBirth');
  const age = dob ? calculateAge(dob) : null;

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        specialization: profile.specialization,
        medicalLicenseNumber: profile.medicalLicenseNumber,
        currentHospital: profile.currentHospital,
        yearsOfExperience: profile.yearsOfExperience,
        consultationFee: profile.consultationFee,
        bio: profile.bio,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: FormData) => {
    updateProfile(data, {
      onSuccess: () => {
        // updateUserProfileStatus(true) is called inside the hook's onSuccess
        toast.success('Profile updated!');
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
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                )}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-accent rounded-full flex items-center justify-center border-2 border-card">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviewUrl(URL.createObjectURL(f)); }} />
            </div>
            <div>
              <p className="text-sm font-medium text-text">Dr. {profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-text-muted mt-0.5">{profile?.specialization}</p>
              {profile?.isVerified && <span className="inline-flex items-center gap-1 text-xs bg-success-light text-success px-2 py-0.5 rounded-full mt-1 font-medium">✓ Verified</span>}
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1.5">First Name</label><input value={profile?.firstName} disabled className={inputClass} /></div>
            <div><label className="block text-sm font-medium text-text mb-1.5">Last Name</label><input value={profile?.lastName} disabled className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Email</label><input value={profile?.email} disabled className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Phone Number</label><input {...register('phone')} placeholder="+94 77 000 0000" className={inputClass} />{errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1.5">Date of Birth</label><input {...register('dateOfBirth')} type="date" className={inputClass} />{errors.dateOfBirth && <p className="text-error text-xs mt-1">{errors.dateOfBirth.message}</p>}</div>
            <div><label className="block text-sm font-medium text-text mb-1.5">Age</label><input value={age ? `${age} years` : ''} disabled className={inputClass} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Gender</label><select {...register('gender')} className={inputClass}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender && <p className="text-error text-xs mt-1">{errors.gender.message}</p>}</div>
        </div>

        {/* Professional Info */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Professional Information</h2>
          <div><label className="block text-sm font-medium text-text mb-1.5">Specialization</label><input {...register('specialization')} placeholder="General Physician" className={inputClass} />{errors.specialization && <p className="text-error text-xs mt-1">{errors.specialization.message}</p>}</div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Medical License Number</label><input {...register('medicalLicenseNumber')} placeholder="SLMC-XXXX" className={inputClass} />{errors.medicalLicenseNumber && <p className="text-error text-xs mt-1">{errors.medicalLicenseNumber.message}</p>}</div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Current Hospital / Clinic</label><input {...register('currentHospital')} placeholder="Colombo General Hospital" className={inputClass} />{errors.currentHospital && <p className="text-error text-xs mt-1">{errors.currentHospital.message}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text mb-1.5">Years of Experience</label><input {...register('yearsOfExperience', { valueAsNumber: true })} type="number" min={0} className={inputClass} />{errors.yearsOfExperience && <p className="text-error text-xs mt-1">{errors.yearsOfExperience.message}</p>}</div>
            <div><label className="block text-sm font-medium text-text mb-1.5">Consultation Fee (LKR)</label><input {...register('consultationFee', { valueAsNumber: true })} type="number" min={100} className={inputClass} />{errors.consultationFee && <p className="text-error text-xs mt-1">{errors.consultationFee.message}</p>}</div>
          </div>
          <div><label className="block text-sm font-medium text-text mb-1.5">Short Bio</label><textarea {...register('bio')} rows={3} placeholder="Brief professional bio..." className={`${inputClass} resize-none`} />{errors.bio && <p className="text-error text-xs mt-1">{errors.bio.message}</p>}</div>
        </div>

        <button type="submit" disabled={isPending} className="w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
