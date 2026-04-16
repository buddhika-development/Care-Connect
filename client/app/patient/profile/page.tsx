'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';
import { usePatientProfile, useUpdatePatientProfile } from '@/hooks/usePatient';
import TagInput from '@/components/common/TagInput';
import FileUpload from '@/components/common/FileUpload';
import { MedicalDocument } from '@/types/patient';
import { calculateAge } from '@/lib/utils';

const schema = z.object({
  phone: z.string().min(9, 'Enter a valid phone number'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  bloodType: z.string().min(1, 'Blood type is required'),
  address: z.string().min(5, 'Enter a valid address'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactNumber: z.string().min(9, 'Enter a valid number'),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
  currentMedications: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 skeleton rounded w-48" />
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="h-24 w-24 skeleton rounded-full" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
      </div>
    </div>
  );
}

export default function PatientProfilePage() {
  const { data: profile, isLoading, isError, refetch } = usePatientProfile();
  const { mutate: updateProfile, isPending } = useUpdatePatientProfile();
  const [age, setAge] = useState<number | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: '', dateOfBirth: '', gender: '', bloodType: '',
      address: '', emergencyContactName: '', emergencyContactNumber: '',
      allergies: [], chronicConditions: [], currentMedications: [],
    },
  });

  const dob = watch('dateOfBirth');

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodType: profile.bloodType,
        address: profile.address,
        emergencyContactName: profile.emergencyContactName,
        emergencyContactNumber: profile.emergencyContactNumber,
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
        currentMedications: profile.currentMedications,
      });
      setDocuments(profile.medicalDocuments);
    }
  }, [profile, reset]);

  useEffect(() => {
    if (dob) setAge(calculateAge(dob));
  }, [dob]);

  const onSubmit = (data: FormData) => {
    updateProfile({ ...data, isCompleted: true }, {
      onSuccess: () => {
        // updateUserProfileStatus(true) called inside hook's onSuccess
        toast.success('Profile updated successfully!');
      },
      onError: () => toast.error('Failed to update profile. Try again.'),
    });
  };

  if (isLoading) return <ProfileSkeleton />;
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-error font-medium mb-3">Failed to load profile.</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
    </div>
  );

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-secondary disabled:text-text-secondary disabled:cursor-not-allowed';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Profile Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your personal and medical information</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Photo */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-text mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary-50 border-2 border-primary flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-card"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreviewUrl(URL.createObjectURL(f));
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-xs text-text-muted mt-0.5">JPG, PNG or GIF. Max 5 MB.</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">First Name</label>
              <input value={profile?.firstName} disabled className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Last Name</label>
              <input value={profile?.lastName} disabled className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
            <input value={profile?.email} disabled className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Phone Number</label>
            <input {...register('phone')} placeholder="+94 77 000 0000" className={inputClass} />
            {errors.phone && <p className="text-error text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date of Birth</label>
              <input {...register('dateOfBirth')} type="date" className={inputClass} />
              {errors.dateOfBirth && <p className="text-error text-xs mt-1">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Age (Auto-calculated)</label>
              <input value={age !== null ? `${age} years` : ''} disabled className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Gender</label>
              <select {...register('gender')} className={inputClass}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
              {errors.gender && <p className="text-error text-xs mt-1">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Blood Type</label>
              <select {...register('bloodType')} className={inputClass}>
                <option value="">Select blood type</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(t => <option key={t}>{t}</option>)}
              </select>
              {errors.bloodType && <p className="text-error text-xs mt-1">{errors.bloodType.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Address</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="42 Galle Road, Colombo 03"
              className={`${inputClass} resize-none`}
            />
            {errors.address && <p className="text-error text-xs mt-1">{errors.address.message}</p>}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Contact Name</label>
              <input {...register('emergencyContactName')} placeholder="Roshan Perera" className={inputClass} />
              {errors.emergencyContactName && <p className="text-error text-xs mt-1">{errors.emergencyContactName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Contact Number</label>
              <input {...register('emergencyContactNumber')} placeholder="+94 71 000 0000" className={inputClass} />
              {errors.emergencyContactNumber && <p className="text-error text-xs mt-1">{errors.emergencyContactNumber.message}</p>}
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <h2 className="font-semibold text-text">Medical Information</h2>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Allergies</label>
            <Controller
              name="allergies"
              control={control}
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. Penicillin (press Enter)" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Chronic Conditions</label>
            <Controller
              name="chronicConditions"
              control={control}
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. Diabetes (press Enter)" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Current Medications</label>
            <Controller
              name="currentMedications"
              control={control}
              render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. Metformin (press Enter)" />}
            />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6">
          <h2 className="font-semibold text-text mb-4">Medical Documents</h2>
          <FileUpload
            documents={documents}
            onUpload={(file) => {
              const newDoc: MedicalDocument = {
                id: `doc-${Date.now()}`,
                fileName: file.name,
                uploadDate: new Date().toISOString().split('T')[0],
                fileUrl: '#',
                fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              };
              setDocuments(prev => [...prev, newDoc]);
              toast.success('Document uploaded.');
            }}
            onDelete={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-6 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
