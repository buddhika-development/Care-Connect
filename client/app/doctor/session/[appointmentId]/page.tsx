'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, CheckCircle, AlertCircle, FileText, Pill, X, Eye } from 'lucide-react';
import { useAppointmentById } from '@/hooks/useAppointments';
import { useDoctors, useAppointmentPrescriptions, useDoctorPrescriptions, useCreateAppointmentPrescription, useCancelPrescription } from '@/hooks/useDoctor';
import { useCompleteSession } from '@/hooks/useAppointments';
import { usePatientProfileById } from '@/hooks/usePatient';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TelemedicineJoinButton from '@/components/common/TelemedicineJoinButton';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Prescription } from '@/types/patient';

interface MedicineRow {
  id: string;
  name: string;
  dosageMg: string;
  frequencyMorning: boolean;
  frequencyDay: boolean;
  frequencyNight: boolean;
  customFrequency: string;
  duration: string;
  instructionType: 'before_meal' | 'after_meal' | 'with_meal' | 'before_sleep' | 'custom';
  customInstruction: string;
}

const INSTRUCTION_OPTIONS: Array<{ value: MedicineRow['instructionType']; label: string }> = [
  { value: 'before_meal', label: 'Before meal' },
  { value: 'after_meal', label: 'After meal' },
  { value: 'with_meal', label: 'With meal' },
  { value: 'before_sleep', label: 'Before sleep' },
  { value: 'custom', label: 'Custom instruction' },
];

function SessionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-pulse">
      <div className="lg:col-span-2 h-150 skeleton rounded-2xl" />
      <div className="lg:col-span-3 h-150 skeleton rounded-2xl" />
    </div>
  );
}

function buildEmptyMedicine(): MedicineRow {
  return {
    id: `${Date.now()}-${Math.random()}`,
    name: '',
    dosageMg: '',
    frequencyMorning: false,
    frequencyDay: false,
    frequencyNight: false,
    customFrequency: '',
    duration: '',
    instructionType: 'after_meal',
    customInstruction: '',
  };
}

export default function DoctorSessionPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();

  const { data: appointment, isLoading: aptLoading } = useAppointmentById(appointmentId);
  const { data: doctors = [] } = useDoctors();
  const { data: patient, isLoading: patLoading } = usePatientProfileById(appointment?.patient_id ?? '');

  const doctorMeta = useMemo(
    () => doctors.find((doctor) => doctor.userId === appointment?.doctor_id) ?? null,
    [doctors, appointment?.doctor_id],
  );
  const doctorDisplayName = doctorMeta ? `Dr. ${doctorMeta.firstName} ${doctorMeta.lastName}`.trim() : 'Doctor';
  const doctorSpecialization = doctorMeta?.specialization ?? '';
  const doctorMetaReady = !!doctorMeta;

  const { data: appointmentPrescriptions = [], isLoading: appointmentPrescriptionsLoading } = useAppointmentPrescriptions(
    appointmentId,
    doctorDisplayName,
    doctorSpecialization,
    doctorMetaReady,
  );

  const { data: doctorPrescriptions = [], isLoading: doctorPrescriptionsLoading } = useDoctorPrescriptions(
    appointment?.doctor_id ?? '',
    doctorDisplayName,
    doctorSpecialization,
    doctorMetaReady,
  );

  const { mutate: completeSession, isPending: completing } = useCompleteSession();
  const { mutate: createPrescription, isPending: creatingPrescription } = useCreateAppointmentPrescription(
    doctorDisplayName,
    doctorSpecialization,
  );
  const { mutate: cancelPrescription, isPending: cancellingPrescription } = useCancelPrescription(
    doctorDisplayName,
    doctorSpecialization,
  );

  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showPrescriptionPanel, setShowPrescriptionPanel] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionToCancel, setPrescriptionToCancel] = useState<Prescription | null>(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<MedicineRow[]>([buildEmptyMedicine()]);

  const isLoading = aptLoading || patLoading;
  const currentAppointmentPrescriptions = appointmentPrescriptions.filter((record) => record.appointmentId === appointmentId);
  const previousPatientPrescriptions = useMemo(
    () => doctorPrescriptions.filter((record) => record.patientId === patient?.userId && record.appointmentId !== appointmentId),
    [doctorPrescriptions, patient?.userId, appointmentId],
  );

  const appointmentStatus = appointment?.appointment_status ?? 'pending';
  const canEditSession = appointmentStatus === 'ongoing';
  const canManagePrescriptions = appointmentStatus === 'ongoing' || appointmentStatus === 'completed';
  const isReadOnlyView = !canEditSession;
  const hasActivePrescription = currentAppointmentPrescriptions.some((item) => item.status !== 'cancelled');
  const canAddPrescription = canManagePrescriptions && !hasActivePrescription;

  const readOnlyMessage = `This appointment is currently ${appointmentStatus}. You can review patient details and prescriptions.`;

  if (isLoading) return <SessionSkeleton />;

  const isOnline = appointment?.channeling_mode === 'online';
  const appointmentDate = appointment?.scheduled_at?.slice(0, 10) ?? '';
  const appointmentTime = appointment?.scheduled_at?.slice(11, 16) ?? '';
  const inputClass = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed';

  const resetPrescriptionForm = () => {
    setDiagnosis('');
    setNotes('');
    setMedicines([buildEmptyMedicine()]);
  };

  const addMedicine = () => {
    setMedicines((prev) => [...prev, buildEmptyMedicine()]);
  };

  const removeMedicine = (id: string) => {
    setMedicines((prev) => {
      const next = prev.filter((m) => m.id !== id);
      return next.length > 0 ? next : [buildEmptyMedicine()];
    });
  };

  const updateMedicine = (id: string, field: keyof MedicineRow, value: string | boolean) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleEndSession = () => {
    completeSession(
      {
        appointmentId,
        prescription: { medicines: [], notes: '' },
      },
      {
        onSuccess: () => {
          toast.success('Session completed.');
          setShowEndDialog(false);
          router.push('/doctor/appointments');
        },
        onError: () => toast.error('Failed to end session. Try again.'),
      },
    );
  };

  const handleCreatePrescription = () => {
    if (!canManagePrescriptions) {
      toast.error('Prescription updates are disabled for this appointment status.');
      return;
    }

    const trimmedDiagnosis = diagnosis.trim();
    if (!trimmedDiagnosis) {
      toast.error('Diagnosis is required.');
      return;
    }

    const sanitizedMedicines = medicines
      .map((medicine) => ({
        name: medicine.name.trim(),
        dosageMg: medicine.dosageMg.trim(),
        frequencyMorning: medicine.frequencyMorning,
        frequencyDay: medicine.frequencyDay,
        frequencyNight: medicine.frequencyNight,
        customFrequency: medicine.customFrequency.trim(),
        duration: medicine.duration.trim(),
        instructionType: medicine.instructionType,
        customInstruction: medicine.customInstruction.trim(),
      }))
      .filter((medicine) =>
        medicine.name ||
        medicine.dosageMg ||
        medicine.duration ||
        medicine.frequencyMorning ||
        medicine.frequencyDay ||
        medicine.frequencyNight ||
        medicine.customFrequency ||
        medicine.customInstruction,
      );

    if (sanitizedMedicines.length === 0) {
      toast.error('At least one medicine is required.');
      return;
    }

    const hasInvalidMedicine = sanitizedMedicines.some((medicine) => {
      const dosageValue = Number(medicine.dosageMg);
      const hasFrequency =
        medicine.frequencyMorning ||
        medicine.frequencyDay ||
        medicine.frequencyNight ||
        !!medicine.customFrequency;

      if (!medicine.name || !medicine.duration) return true;
      if (!medicine.dosageMg || Number.isNaN(dosageValue) || dosageValue <= 0) return true;
      if (!hasFrequency) return true;
      if (medicine.instructionType === 'custom' && !medicine.customInstruction) return true;
      return false;
    });

    if (hasInvalidMedicine) {
      toast.error('Each medicine needs name, dosage in mg/day, duration, at least one frequency, and a valid instruction.');
      return;
    }

    createPrescription(
      {
        appointmentId,
        diagnosis: trimmedDiagnosis,
        medications: sanitizedMedicines.map((medicine) => ({
          name: medicine.name,
          dosageMg: Number(medicine.dosageMg),
          frequency: {
            morning: medicine.frequencyMorning,
            day: medicine.frequencyDay,
            night: medicine.frequencyNight,
            custom: medicine.customFrequency || undefined,
          },
          duration: medicine.duration,
          instructionType: medicine.instructionType,
          customInstruction: medicine.instructionType === 'custom' ? medicine.customInstruction : undefined,
        })),
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Prescription added successfully.');
          setShowPrescriptionPanel(false);
          resetPrescriptionForm();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Failed to add prescription.';
          toast.error(message);
        },
      },
    );
  };

  const handleCancelPrescription = () => {
    if (!prescriptionToCancel) return;

    cancelPrescription(
      { prescriptionId: prescriptionToCancel.id, appointmentId },
      {
        onSuccess: () => {
          toast.success('Prescription cancelled successfully.');
          setPrescriptionToCancel(null);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : 'Failed to cancel prescription.';
          toast.error(message);
        },
      },
    );
  };

  const renderPrescriptionCard = (prescription: Prescription, canCancel: boolean) => {
    const summaryMedicine = prescription.medicines[0];
    const isCancelled = prescription.status === 'cancelled';

    return (
      <div key={prescription.id} className="p-3 rounded-xl border border-border bg-secondary space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-text text-sm">{prescription.diagnosis || 'Prescription'}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatDate(prescription.date)} {prescription.createdAt ? `· ${formatTime(prescription.createdAt.slice(11, 16))}` : ''}
            </p>
          </div>
          {prescription.status && (
            <span
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full font-medium capitalize',
                isCancelled ? 'bg-error-light text-error' : 'bg-success-light text-success',
              )}
            >
              {prescription.status}
            </span>
          )}
        </div>

        <div className="space-y-1 text-xs text-text-secondary">
          {summaryMedicine && (
            <div className="space-y-0.5">
              <p>{summaryMedicine.name}</p>
              <p className="text-text-muted">
                {summaryMedicine.dosage ? `Dosage: ${summaryMedicine.dosage}` : ''}
                {summaryMedicine.frequency ? ` · Frequency: ${summaryMedicine.frequency}` : ''}
              </p>
            </div>
          )}
          {prescription.notes && <p className="text-text-muted">{prescription.notes}</p>}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedPrescription(prescription)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View
          </button>

          {canCancel && (
            <button
              type="button"
              onClick={() => setPrescriptionToCancel(prescription)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error-light text-error text-xs font-medium hover:bg-error hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/doctor/appointments/${appointmentDate}`)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {isOnline && canEditSession && (
            <TelemedicineJoinButton
              sessionId={appointment?.telemedicine_session_id}
              role="doctor"
              label="Join Video Call"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-all"
            />
          )}
          {canEditSession && (
            <button
              onClick={() => setShowEndDialog(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all"
            >
              <CheckCircle className="w-4 h-4" /> End Session
            </button>
          )}
        </div>
      </div>

      {isReadOnlyView && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm text-warning">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{readOnlyMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {patient ? getInitials(patient.firstName, patient.lastName) : '?'}
              </div>
              <div>
                <p className="font-bold text-text">{patient?.firstName} {patient?.lastName}</p>
                <p className="text-xs text-text-secondary">{patient?.age} yrs · {patient?.gender} · {patient?.bloodType || 'Unknown'}</p>
              </div>
            </div>

            {patient && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-secondary">
                  <span className="block text-text-muted mb-0.5">Email</span>
                  <span className="font-medium text-text break-all">{patient.email}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary">
                  <span className="block text-text-muted mb-0.5">Phone</span>
                  <span className="font-medium text-text">{patient.phone}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary sm:col-span-2">
                  <span className="block text-text-muted mb-0.5">Address</span>
                  <span className="font-medium text-text">{patient.address || 'Not provided'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary">
                  <span className="block text-text-muted mb-0.5">Date of Birth</span>
                  <span className="font-medium text-text">{formatDate(patient.dateOfBirth)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary">
                  <span className="block text-text-muted mb-0.5">Blood Type</span>
                  <span className="font-medium text-text">{patient.bloodType || 'Unknown'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary sm:col-span-2">
                  <span className="block text-text-muted mb-0.5">Emergency Contact</span>
                  <span className="font-medium text-text">
                    {patient.emergencyContactName || 'Not provided'}
                    {patient.emergencyContactNumber ? ` · ${patient.emergencyContactNumber}` : ''}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary">{doctorDisplayName}</span>
              {doctorSpecialization && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-text-secondary">{doctorSpecialization}</span>
              )}
              {appointment && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-light text-warning capitalize">
                  {appointment.appointment_status}
                </span>
              )}
            </div>

            {appointment && (
              <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
                <div className="flex justify-between"><span className="text-text-muted">Date</span><span className="font-medium text-text">{formatDate(appointmentDate)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Time</span><span className="font-medium text-text">{formatTime(appointmentTime)}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Type</span><span className={`font-medium ${isOnline ? 'text-primary' : 'text-accent'}`}>{isOnline ? 'Online' : 'Physical'}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-muted">Status</span><StatusBadge status={appointment.appointment_status} /></div>
              </div>
            )}

            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Allergies</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy) => <span key={allergy} className="text-xs px-2 py-0.5 bg-error-light text-error rounded-full">{allergy}</span>)}
                </div>
              </div>
            )}

            {patient?.chronicConditions && patient.chronicConditions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Chronic Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {patient.chronicConditions.map((condition) => <span key={condition} className="text-xs px-2 py-0.5 bg-warning-light text-warning rounded-full">{condition}</span>)}
                </div>
              </div>
            )}

            {patient?.currentMedications && patient.currentMedications.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Current Medications</p>
                <div className="flex flex-wrap gap-1">
                  {patient.currentMedications.map((medication) => <span key={medication} className="text-xs px-2 py-0.5 bg-primary-50 text-primary rounded-full">{medication}</span>)}
                </div>
              </div>
            )}
          </div>

          {patient?.medicalDocuments && patient.medicalDocuments.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-text-muted" /> Documents</p>
              <div className="space-y-2">
                {patient.medicalDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary hover:bg-border transition-colors text-xs text-primary font-medium"
                  >
                    <FileText className="w-3.5 h-3.5" /> {doc.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold text-text flex items-center gap-2"><Pill className="w-4 h-4 text-accent" /> Prescription Management</h2>
                <p className="text-xs text-text-muted mt-1">
                  Add a new prescription, review history, and cancel active prescriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPrescriptionForm();
                  setShowPrescriptionPanel(true);
                }}
                disabled={!canAddPrescription || creatingPrescription}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white transition-colors text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Prescription
              </button>
            </div>

            {!canManagePrescriptions && (
              <p className="text-xs text-warning mb-3">
                Prescription updates are disabled while this appointment is {appointmentStatus}.
              </p>
            )}
            {canManagePrescriptions && hasActivePrescription && (
              <p className="text-xs text-warning mb-3">
                Cancel the active prescription before adding a new one for this appointment.
              </p>
            )}

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">This Appointment</p>
                {appointmentPrescriptionsLoading ? (
                  <p className="text-xs text-text-muted">Loading prescription history...</p>
                ) : currentAppointmentPrescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {currentAppointmentPrescriptions.map((prescription) =>
                      renderPrescriptionCard(
                        prescription,
                        canManagePrescriptions && prescription.status !== 'cancelled',
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No prescriptions for this appointment yet.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2">Previous Prescriptions For This Patient</p>
                {doctorPrescriptionsLoading ? (
                  <p className="text-xs text-text-muted">Loading previous prescriptions...</p>
                ) : previousPatientPrescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {previousPatientPrescriptions.map((prescription) => renderPrescriptionCard(prescription, false))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No previous prescription history for this patient.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPrescriptionPanel && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close panel"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPrescriptionPanel(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border shadow-modal overflow-y-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text">Add Prescription</h3>
                <p className="text-xs text-text-muted mt-1">Diagnosis, medication details, instructions, and notes.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrescriptionPanel(false)}
                className="p-2 rounded-lg hover:bg-secondary text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Diagnosis</label>
                <textarea
                  rows={3}
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                  placeholder="Enter diagnosis"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-text-secondary">Medications</label>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-primary text-primary text-xs font-medium"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {medicines.map((medicine, index) => (
                    <div key={medicine.id} className="p-3 rounded-xl border border-border bg-secondary">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-text-secondary">Medicine {index + 1}</span>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(medicine.id)}
                            className="p-1 rounded text-error hover:bg-error-light"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Medicine name"
                          value={medicine.name}
                          onChange={(event) => updateMedicine(medicine.id, 'name', event.target.value)}
                          className={inputClass}
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Dosage mg/day"
                          value={medicine.dosageMg}
                          onChange={(event) => updateMedicine(medicine.id, 'dosageMg', event.target.value)}
                          className={inputClass}
                        />
                        <input
                          placeholder="Duration"
                          value={medicine.duration}
                          onChange={(event) => updateMedicine(medicine.id, 'duration', event.target.value)}
                          className={inputClass}
                        />
                        <select
                          value={medicine.instructionType}
                          onChange={(event) => updateMedicine(medicine.id, 'instructionType', event.target.value)}
                          className={inputClass}
                        >
                          {INSTRUCTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>

                        <div className="col-span-2 rounded-lg border border-border bg-background p-2.5 space-y-2">
                          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Frequency</p>
                          <div className="flex flex-wrap gap-3 text-xs text-text">
                            <label className="inline-flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={medicine.frequencyMorning}
                                onChange={(event) => updateMedicine(medicine.id, 'frequencyMorning', event.target.checked)}
                              />
                              Morning
                            </label>
                            <label className="inline-flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={medicine.frequencyDay}
                                onChange={(event) => updateMedicine(medicine.id, 'frequencyDay', event.target.checked)}
                              />
                              Day
                            </label>
                            <label className="inline-flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={medicine.frequencyNight}
                                onChange={(event) => updateMedicine(medicine.id, 'frequencyNight', event.target.checked)}
                              />
                              Night
                            </label>
                          </div>
                          <input
                            placeholder="Custom frequency (optional)"
                            value={medicine.customFrequency}
                            onChange={(event) => updateMedicine(medicine.id, 'customFrequency', event.target.value)}
                            className={inputClass}
                          />
                        </div>

                        {medicine.instructionType === 'custom' && (
                          <input
                            placeholder="Custom instruction"
                            value={medicine.customInstruction}
                            onChange={(event) => updateMedicine(medicine.id, 'customInstruction', event.target.value)}
                            className={`${inputClass} col-span-2`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Additional notes"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionPanel(false)}
                  className="px-3 py-2 rounded-xl border border-border text-text-secondary text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCreatePrescription}
                  disabled={creatingPrescription}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-60"
                >
                  {creatingPrescription ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close details"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedPrescription(null)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-modal p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-text">Prescription Details</h3>
                <p className="text-xs text-text-muted mt-1">{formatDate(selectedPrescription.date)} · {selectedPrescription.doctorName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrescription(null)}
                className="p-2 rounded-lg hover:bg-secondary text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Status</p>
                <p className="text-sm font-medium text-text capitalize">{selectedPrescription.status ?? 'active'}</p>
              </div>

              <div>
                <p className="text-xs text-text-muted">Diagnosis</p>
                <p className="text-sm font-medium text-text">{selectedPrescription.diagnosis || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-text-muted mb-1">Medications</p>
                <div className="space-y-2">
                  {selectedPrescription.medicines.map((medicine, index) => (
                    <div key={`${medicine.name}-${index}`} className="p-2.5 rounded-xl bg-secondary border border-border">
                      <p className="text-sm font-medium text-text">{medicine.name}</p>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-text-secondary">Dosage: {medicine.dosage || 'N/A'}</p>
                        <p className="text-xs text-text-secondary">Frequency: {medicine.frequency || 'N/A'}</p>
                        <p className="text-xs text-text-secondary">Duration: {medicine.duration || 'N/A'}</p>
                        <p className="text-xs text-text-muted">Instruction: {medicine.instructions || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.notes && (
                <div>
                  <p className="text-xs text-text-muted">Notes</p>
                  <p className="text-sm text-text">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {canEditSession && (
        <ConfirmDialog
          isOpen={showEndDialog}
          title="End Session"
          message="End session and mark as completed?"
          confirmLabel="Yes, End Session"
          onConfirm={handleEndSession}
          onCancel={() => setShowEndDialog(false)}
          variant="primary"
          isLoading={completing}
        />
      )}

      <ConfirmDialog
        isOpen={!!prescriptionToCancel}
        title="Cancel Prescription"
        message="Cancel this prescription? After cancelling, you can add a new prescription for this appointment."
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancelPrescription}
        onCancel={() => setPrescriptionToCancel(null)}
        variant="danger"
        isLoading={cancellingPrescription}
      />
    </div>
  );
}
