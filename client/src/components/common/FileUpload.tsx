'use client';

import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MedicalDocument } from '@/types/patient';

interface FileUploadProps {
  documents: MedicalDocument[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  maxFiles?: number;
  isUploading?: boolean;
}

export default function FileUpload({ documents, onUpload, onDelete, maxFiles = 10, isUploading }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') return;
    if (documents.length >= maxFiles) return;
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          dragOver ? 'border-primary bg-primary-50' : 'border-border hover:border-primary/50 hover:bg-secondary/50',
          documents.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          disabled={documents.length >= maxFiles}
        />
        <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm font-medium text-text">
          {isUploading ? 'Uploading...' : 'Drop PDF here or click to browse'}
        </p>
        <p className="text-xs text-text-muted mt-1">PDF only • Max {maxFiles} files ({documents.length}/{maxFiles} used)</p>
      </div>

      {/* Document list */}
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border-light">
              <div className="w-8 h-8 rounded-lg bg-error-light flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{doc.fileName}</p>
                <p className="text-xs text-text-muted">{doc.uploadDate} • {doc.fileSize}</p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                className="p-1.5 rounded-lg hover:bg-error-light text-text-muted hover:text-error transition-colors"
                aria-label="Delete document"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
