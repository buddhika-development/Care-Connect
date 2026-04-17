'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, VideoOff, RefreshCcw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { openTelemedicineMeetingInNewTab } from '@/services/telemedicineService';

export default function TelemedicineRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (hasAttemptedRef.current) return;

    const role = user?.role;
    if (!id) {
      setError('Missing telemedicine session id in URL.');
      setIsConnecting(false);
      return;
    }

    if (role !== 'doctor' && role !== 'patient') {
      setError('Only patients and doctors can join telemedicine sessions.');
      setIsConnecting(false);
      return;
    }

    hasAttemptedRef.current = true;

    const connect = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        await openTelemedicineMeetingInNewTab(id, role);
        setIsConnecting(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to connect to telemedicine session.';
        setError(message);
        setIsConnecting(false);
      }
    };

    connect();
  }, [id, isAuthLoading, user?.role]);

  const retry = async () => {
    if (!id) return;
    const role = user?.role;
    if (role !== 'doctor' && role !== 'patient') {
      setError('Only patients and doctors can join telemedicine sessions.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      await openTelemedicineMeetingInNewTab(id, role);
      setIsConnecting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to telemedicine session.';
      setError(message);
      setIsConnecting(false);
    }
  };

  const openTips = () => {
    toast.info('If nothing opened, allow popups for this site and click Retry.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-linear-to-b from-secondary to-background">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-card p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mt-5 flex items-start gap-3">
          <div className="mt-0.5 w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <VideoOff className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-text">
              {isConnecting ? 'Connecting to telemedicine room' : error ? 'Unable to join session' : 'Meeting opened in new tab'}
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              {isConnecting
                ? 'Please wait while we validate your session and open the meeting URL.'
                : error
                  ? error
                  : 'You can keep this tab open for notes and prescriptions.'}
            </p>
            <p className="text-xs text-text-muted mt-2">Session: {id}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!isConnecting && (
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary text-primary bg-primary-50 hover:bg-primary hover:text-white text-sm font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Retry
            </button>
          )}
          <button
            type="button"
            onClick={openTips}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:bg-secondary text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Popup Help
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:bg-secondary text-sm font-medium transition-colors"
          >
            Return
          </button>
        </div>
      </div>
    </div>
  );
}
