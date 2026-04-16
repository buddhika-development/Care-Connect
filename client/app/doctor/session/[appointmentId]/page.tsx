'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Video, CheckCircle, AlertCircle, FileText, User, Pill } from 'lucide-react';
import { useAppointmentById } from '@/hooks/useAppointments';
import { useSessionPatientInfo } from '@/hooks/useDoctor';
import { useCompleteSession } from '@/hooks/useAppointments';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatDate, formatTime, formatCurrency, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface MedicineRow {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

function SessionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
      <div className="lg:col-span-2 h-[600px] skeleton rounded-2xl" />
      <div className="lg:col-span-3 h-[600px] skeleton rounded-2xl" />
    </div>
  );
}

export default function DoctorSessionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();

  const { data: appointment, isLoading: aptLoading } = useAppointmentById(appointmentId);
  const { data: patient, isLoading: patLoading } = useSessionPatientInfo('patient-001');
  const { mutate: completeSession, isPending: completing } = useCompleteSession();

  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { id: '1', name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [showEndDialog, setShowEndDialog] = useState(false);

  const isLoading = aptLoading || patLoading;

  const addMedicine = () => {
    setMedicines(prev => [...prev, { id: Date.now().toString(), name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const updateMedicine = (id: string, field: keyof MedicineRow, value: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleEndSession = () => {
    completeSession({
      appointmentId,
      prescription: { medicines, notes },
    }, {
      onSuccess: () => {
        toast.success('Session completed. Prescription saved.');
        setShowEndDialog(false);
        router.push('/doctor/appointments');
      },
      onError: () => toast.error('Failed to end session. Try again.'),
    });
  };

  if (isLoading) return <SessionSkeleton />;

  const isOnline = appointment?.channeling_mode === 'online';
  // Derive date and startTime from scheduled_at
  const appointmentDate = appointment?.scheduled_at?.slice(0, 10) ?? '';
  const appointmentTime = appointment?.scheduled_at?.slice(11, 16) ?? '';
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/doctor/appointments/${appointmentDate}`)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {isOnline && (
            <Link
              href={`/telemedicine/room/${appointmentId}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-all"
            >
              <Video className="w-4 h-4" /> Join Video Call
            </Link>
          )}
          <button
            onClick={() => setShowEndDialog(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all"
          >
            <CheckCircle className="w-4 h-4" /> End Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Patient Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {patient ? getInitials(patient.firstName, patient.lastName) : '?'}
              </div>
              <div>
                <p className="font-bold text-text">{patient?.firstName} {patient?.lastName}</p>
                <p className="text-xs text-text-secondary">{patient?.age} yrs · {patient?.gender} · {patient?.bloodType}</p>
              </div>
            </div>

            {appointment && (
              <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
                <div className="flex justify-between"><span className="text-text-muted">Date</span><span className="font-medium text-text">{formatDate(appointmentDate)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Time</span><span className="font-medium text-text">{formatTime(appointmentTime)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Type</span><span className={`font-medium ${isOnline ? 'text-primary' : 'text-accent'}`}>{isOnline ? '📹 Online' : '🏥 Physical'}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-muted">Status</span><StatusBadge status="ongoing" /></div>
              </div>
            )}

            {/* Medical info */}
            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Allergies</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map(a => <span key={a} className="text-xs px-2 py-0.5 bg-error-light text-error rounded-full">{a}</span>)}
                </div>
              </div>
            )}
            {patient?.chronicConditions && patient.chronicConditions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Chronic Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.map(c => <span key={c} className="text-xs px-2 py-0.5 bg-warning-light text-warning rounded-full">{c}</span>)}
                </div>
              </div>
            )}
            {patient?.currentMedications && patient.currentMedications.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Current Medications</p>
                <div className="flex flex-wrap gap-1">
                  {patient.currentMedications.map(m => <span key={m} className="text-xs px-2 py-0.5 bg-primary-50 text-primary rounded-full">{m}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Medical docs */}
          {patient?.medicalDocuments && patient.medicalDocuments.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-text-muted" /> Documents</p>
              <div className="space-y-2">
                {patient.medicalDocuments.map(doc => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary hover:bg-border transition-colors text-xs text-primary font-medium">
                    <FileText className="w-3.5 h-3.5" /> {doc.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Past appointments */}
          {patient?.previousAppointments && patient.previousAppointments.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <p className="text-sm font-semibold text-text mb-3">Previous Visits</p>
              <div className="space-y-2">
                {patient.previousAppointments.map(prev => (
                  <div key={prev.id} className="p-2.5 rounded-xl bg-secondary text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-text">{formatDate(prev.date)}</span>
                      <span className="text-success">{prev.status}</span>
                    </div>
                    {prev.notes && <p className="text-text-muted mt-0.5">{prev.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Session Actions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Prescription */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text flex items-center gap-2"><Pill className="w-4 h-4 text-accent" /> Prescription</h2>
              <button onClick={addMedicine} className="flex items-center gap-1 text-xs text-primary hover:bg-primary-50 px-2 py-1.5 rounded-lg transition-all font-medium border border-primary">
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={med.id} className="p-3 bg-secondary rounded-xl border border-border-light">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-secondary">Medicine {idx + 1}</span>
                    {medicines.length > 1 && (
                      <button onClick={() => removeMedicine(med.id)} className="text-error hover:bg-error-light p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Medicine name*" value={med.name} onChange={e => updateMedicine(med.id, 'name', e.target.value)} className={inputClass} />
                    <input placeholder="Dosage e.g. 500mg" value={med.dosage} onChange={e => updateMedicine(med.id, 'dosage', e.target.value)} className={inputClass} />
                    <input placeholder="Frequency e.g. Twice daily" value={med.frequency} onChange={e => updateMedicine(med.id, 'frequency', e.target.value)} className={inputClass} />
                    <input placeholder="Duration e.g. 7 days" value={med.duration} onChange={e => updateMedicine(med.id, 'duration', e.target.value)} className={inputClass} />
                    <input placeholder="Instructions (optional)" value={med.instructions} onChange={e => updateMedicine(med.id, 'instructions', e.target.value)} className={`${inputClass} col-span-2`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h2 className="font-semibold text-text mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-text-muted" /> Session Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Diagnosis, observations, follow-up instructions..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted"
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showEndDialog}
        title="End Session"
        message="End session and mark as completed? The prescription and notes will be saved."
        confirmLabel="Yes, End Session"
        onConfirm={handleEndSession}
        onCancel={() => setShowEndDialog(false)}
        variant="primary"
        isLoading={completing}
      />
    </div>
  );
}
