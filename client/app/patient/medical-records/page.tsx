'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ExternalLink, Clock, Pill, UserRound, CalendarDays, Download, X, ArrowRight, Search } from 'lucide-react';
import { useMedicalDocuments, usePrescriptions } from '@/hooks/usePatient';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useMedicalRecordsStore } from '@/store/medicalRecordsStore';
import { Prescription } from '@/types/patient';

type PrescriptionFilter = 'all' | 'active' | 'cancelled';

function PrescriptionSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
      <div className="h-4 skeleton rounded w-40" />
      <div className="h-3 skeleton rounded w-56" />
      {[1,2].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)}
    </div>
  );
}

function DocSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border animate-pulse">
      <div className="w-9 h-9 skeleton rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 skeleton rounded w-32" />
        <div className="h-2 skeleton rounded w-20" />
      </div>
    </div>
  );
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const tab = useMedicalRecordsStore((s) => s.activeTab);
  const setTab = useMedicalRecordsStore((s) => s.setActiveTab);
  const previewDocumentUrl = useMedicalRecordsStore((s) => s.previewDocumentUrl);
  const previewDocumentName = useMedicalRecordsStore((s) => s.previewDocumentName);
  const openPreview = useMedicalRecordsStore((s) => s.openPreview);
  const closePreview = useMedicalRecordsStore((s) => s.closePreview);
  const [prescriptionFilter, setPrescriptionFilter] = useState<PrescriptionFilter>('all');
  const [prescriptionSearch, setPrescriptionSearch] = useState('');

  const { data: prescriptions, isLoading: rxLoading, isError: rxError, refetch: refetchRx } = usePrescriptions();
  const { data: documents, isLoading: docLoading, isError: docError, refetch: refetchDocs } = useMedicalDocuments();

  const activePrescriptions = useMemo(
    () => (prescriptions ?? []).filter((rx) => (rx.status || '').toLowerCase() !== 'cancelled'),
    [prescriptions],
  );

  const filteredPrescriptions = useMemo(() => {
    const rows = prescriptions ?? [];
    const term = prescriptionSearch.trim().toLowerCase();

    return rows.filter((rx) => {
      const isCancelled = (rx.status || '').toLowerCase() === 'cancelled';
      const isActive = !isCancelled;

      const statusMatches =
        prescriptionFilter === 'all' ||
        (prescriptionFilter === 'active' && isActive) ||
        (prescriptionFilter === 'cancelled' && isCancelled);

      const medicationBlob = rx.medicines
        .map((med) => [med.name, med.dosage, med.frequency, med.duration, med.instructions].join(' '))
        .join(' ')
        .toLowerCase();

      const textMatches =
        !term ||
        rx.doctorName.toLowerCase().includes(term) ||
        (rx.doctorSpecialization || '').toLowerCase().includes(term) ||
        (rx.diagnosis || '').toLowerCase().includes(term) ||
        medicationBlob.includes(term);

      return statusMatches && textMatches;
    });
  }, [prescriptions, prescriptionFilter, prescriptionSearch]);

  const handleDownloadPrescriptionPdf = async (rx: Prescription) => {
    if ((rx.status || '').toLowerCase() === 'cancelled') {
      toast.error('Cancelled prescriptions cannot be downloaded.');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      let y = 48;
      const left = 48;
      const lineHeight = 18;

      const writeLine = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, left, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value || '-', left + 150, y);
        y += lineHeight;
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('CareConnect', left, y);
      y += 24;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Patient Prescription', left, y);
      y += 28;

      writeLine('Prescription ID', rx.id);
      writeLine('Doctor', rx.doctorName);
      writeLine('Specialization', rx.doctorSpecialization || 'N/A');
      writeLine('Status', rx.status || 'active');
      writeLine('Created Date', formatDate(rx.date));
      writeLine('Appointment ID', rx.appointmentId);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnosis', left, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      const diagnosisLines = doc.splitTextToSize(rx.diagnosis || 'N/A', 500);
      doc.text(diagnosisLines, left, y);
      y += diagnosisLines.length * 14 + 14;

      doc.setFont('helvetica', 'bold');
      doc.text('Medications', left, y);
      y += lineHeight;

      rx.medicines.forEach((medicine, index) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${medicine.name}`, left, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        const detailLines = [
          `Dosage: ${medicine.dosage || 'N/A'}`,
          `Frequency: ${medicine.frequency || 'N/A'}`,
          `Duration: ${medicine.duration || 'N/A'}`,
          `Instructions: ${medicine.instructions || 'N/A'}`,
        ];
        detailLines.forEach((line) => {
          doc.text(line, left + 16, y);
          y += 14;
        });
        y += 6;

        if (y > 760) {
          doc.addPage();
          y = 48;
        }
      });

      if (rx.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Notes', left, y);
        y += lineHeight;
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(rx.notes, 500);
        doc.text(noteLines, left, y);
      }

      const safeId = rx.id.replace(/[^a-zA-Z0-9-_]/g, '_');
      doc.save(`careconnect-prescription-${safeId}.pdf`);
    } catch (error) {
      toast.error('Failed to generate prescription PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Medical Records</h1>
        <p className="text-text-secondary text-sm mt-1">Your prescriptions and medical reports from CareConnect.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
        {(['prescriptions', 'reports'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-card shadow-sm text-text' : 'text-text-secondary hover:text-text'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Prescriptions tab */}
      {tab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                value={prescriptionSearch}
                onChange={(event) => setPrescriptionSearch(event.target.value)}
                placeholder="Search by doctor, medicine, or diagnosis"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {([
                { label: 'All', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Cancelled', value: 'cancelled' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPrescriptionFilter(option.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${prescriptionFilter === option.value ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {rxLoading ? (
            [1,2].map(i => <PrescriptionSkeleton key={i} />)
          ) : rxError ? (
            <div className="text-center py-12">
              <p className="text-error font-medium mb-3">Failed to load prescriptions.</p>
              <button onClick={() => refetchRx()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
            </div>
          ) : (prescriptions ?? []).length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions" description="Prescriptions from your completed appointments will appear here." />
          ) : filteredPrescriptions.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching prescriptions"
              description="Try changing the status filter or search keywords."
            />
          ) : (
            filteredPrescriptions.map((rx) => {
              const isCancelled = (rx.status || '').toLowerCase() === 'cancelled';

              return (
              <div key={rx.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text flex items-center gap-1.5"><UserRound className="w-4 h-4 text-text-muted" /> {rx.doctorName}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${isCancelled ? 'bg-error-light text-error' : 'bg-success-light text-success'}`}>
                        {rx.status || 'active'}
                      </span>
                    </div>
                    <p className="text-sm text-primary">{rx.doctorSpecialization || 'General'}</p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Issued on {formatDate(rx.date)}</p>
                    {rx.createdAt && (
                      <p className="text-xs text-text-muted mt-0.5">Created at {new Date(rx.createdAt).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-accent" />
                  </div>
                </div>

                <div className="mb-3 p-3 rounded-xl border border-border bg-secondary">
                  <p className="text-xs text-text-muted mb-1">Diagnosis</p>
                  <p className="text-sm text-text">{rx.diagnosis || 'N/A'}</p>
                </div>

                <div className="space-y-2 mb-4">
                  {rx.medicines.map((med, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-secondary rounded-xl text-sm">
                      <div><span className="text-text-muted text-xs block">Medicine</span><span className="font-semibold text-text">{med.name}</span></div>
                      <div><span className="text-text-muted text-xs block">Dosage</span><span className="text-text">{med.dosage}</span></div>
                      <div><span className="text-text-muted text-xs block">Frequency</span><span className="text-text">{med.frequency}</span></div>
                      <div><span className="text-text-muted text-xs block">Duration</span><span className="text-text">{med.duration}</span></div>
                      {med.instructions && (
                        <div className="col-span-2 sm:col-span-4">
                          <span className="text-text-muted text-xs">Instructions: </span>
                          <span className="text-text text-xs">{med.instructions}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {rx.notes && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Doctor&apos;s Notes</p>
                    <p className="text-sm text-text">{rx.notes}</p>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownloadPrescriptionPdf(rx)}
                    disabled={isCancelled}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
              );
            })
          )}

          {(prescriptions ?? []).length > 0 && (
            <p className="text-xs text-text-muted">
              Only active prescriptions are downloadable as PDF.
            </p>
          )}
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-text-secondary">{(documents ?? []).length} document{(documents ?? []).length !== 1 ? 's' : ''}</p>
            <button
              type="button"
              onClick={() => router.push('/patient/profile')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-all"
            >
              Update In Profile Settings <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {docLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <DocSkeleton key={i} />)}</div>
          ) : docError ? (
            <div className="text-center py-12">
              <p className="text-error font-medium mb-3">Failed to load documents.</p>
              <button onClick={() => refetchDocs()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
            </div>
          ) : (documents ?? []).length === 0 ? (
            <EmptyState icon={FileText} title="No documents" description="Upload your medical reports and documents. PDF only." />
          ) : (
            <div className="space-y-2">
              {(documents ?? []).map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{formatDate(doc.uploadDate)}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{doc.fileSize}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-warning-light text-warning rounded-full font-medium">
                        <Clock className="w-2.5 h-2.5" /> Signed URL
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!doc.fileUrl || doc.fileUrl === '#') {
                        toast.error('Preview link unavailable. Please refresh the page.');
                        return;
                      }
                      openPreview(doc.fileUrl, doc.fileName);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary border border-primary rounded-lg hover:bg-primary-50 transition-all font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> Preview
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {previewDocumentUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closePreview}
            aria-label="Close preview"
          />
          <div className="relative w-full max-w-4xl h-[85vh] bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-secondary">
              <p className="text-sm font-medium text-text truncate pr-4">{previewDocumentName || 'Document Preview'}</p>
              <button type="button" onClick={closePreview} className="p-1.5 rounded-lg hover:bg-border text-text-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              src={previewDocumentUrl}
              title="Medical report preview"
              className="w-full h-[calc(85vh-3rem)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
