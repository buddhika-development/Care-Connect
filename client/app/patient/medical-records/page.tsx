'use client';

import { useState } from 'react';
import { FileText, Upload, ExternalLink, Clock, Pill } from 'lucide-react';
import { usePrescriptions, useMedicalDocuments, useUploadMedicalDocument } from '@/hooks/usePatient';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [tab, setTab] = useState<'prescriptions' | 'reports'>('prescriptions');

  const { data: prescriptions, isLoading: rxLoading, isError: rxError, refetch: refetchRx } = usePrescriptions();
  const { data: documents, isLoading: docLoading, isError: docError, refetch: refetchDocs } = useMedicalDocuments();
  const { mutate: upload, isPending: uploading } = useUploadMedicalDocument();

  const handleUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }
    upload(file, {
      onSuccess: () => toast.success('Document uploaded.'),
      onError: () => toast.error('Upload failed. Try again.'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Medical Records</h1>
        <p className="text-text-secondary text-sm mt-1">Your prescriptions and uploaded medical documents</p>
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
          {rxLoading ? (
            [1,2].map(i => <PrescriptionSkeleton key={i} />)
          ) : rxError ? (
            <div className="text-center py-12">
              <p className="text-error font-medium mb-3">Failed to load prescriptions.</p>
              <button onClick={() => refetchRx()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
            </div>
          ) : (prescriptions ?? []).length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions" description="Prescriptions from your completed appointments will appear here." />
          ) : (
            (prescriptions ?? []).map(rx => (
              <div key={rx.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-text">{rx.doctorName}</p>
                    <p className="text-sm text-primary">{rx.doctorSpecialization}</p>
                    <p className="text-xs text-text-muted mt-0.5">{formatDate(rx.date)}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-accent" />
                  </div>
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">{(documents ?? []).length} document{(documents ?? []).length !== 1 ? 's' : ''}</p>
            <label className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} />
            </label>
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
                  <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-error" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{doc.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{formatDate(doc.uploadDate)}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{doc.fileSize}</span>
                      <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-warning-light text-warning rounded-full font-medium">
                        <Clock className="w-2.5 h-2.5" /> Expires in 1h
                      </span>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary border border-primary rounded-lg hover:bg-primary-50 transition-all font-medium"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
