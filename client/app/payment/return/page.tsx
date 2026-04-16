'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';
import { getPaymentStatus, PaymentStatusValue } from '@/services/paymentService';

export default function PaymentReturnPage() {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatusValue | 'loading'>('loading');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 10; // 30 seconds max (3s interval)

  const poll = useCallback(async (aptId: string) => {
    try {
      const data = await getPaymentStatus(aptId);
      if (data.status === 'pending' && pollCount < MAX_POLLS) {
        // Still pending — try again in 3s
        return false;
      }
      setStatus(data.status);
      return true;
    } catch {
      setStatus('unknown');
      return true;
    }
  }, [pollCount]);

  useEffect(() => {
    const aptId = sessionStorage.getItem('pendingAppointmentId');
    const doctor = sessionStorage.getItem('pendingDoctorName') ?? '';
    const amt = sessionStorage.getItem('pendingAmount') ?? '';

    setAppointmentId(aptId);
    setDoctorName(doctor);
    setAmount(amt);

    if (!aptId) {
      setStatus('unknown');
      return;
    }

    // Poll for status every 3 seconds
    let interval: NodeJS.Timeout;
    let count = 0;

    const doPoll = async () => {
      count++;
      setPollCount(count);
      try {
        const data = await getPaymentStatus(aptId);
        if (data.status !== 'pending' || count >= MAX_POLLS) {
          setStatus(data.status);
          clearInterval(interval);
          // Clean up sessionStorage on final result
          if (data.status !== 'pending') {
            sessionStorage.removeItem('pendingAppointmentId');
            sessionStorage.removeItem('pendingDoctorName');
            sessionStorage.removeItem('pendingAmount');
          }
        }
        // else keep polling
      } catch {
        setStatus('unknown');
        clearInterval(interval);
      }
    };

    // Run immediately then poll
    doPoll();
    interval = setInterval(doPoll, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = {
    completed: {
      icon: <CheckCircle className="w-12 h-12 text-emerald-500" />,
      bg: 'bg-emerald-50',
      title: 'Payment Successful!',
      subtitle: 'Your appointment has been confirmed.',
      badge: 'text-emerald-700 bg-emerald-100',
      badgeText: 'Confirmed',
    },
    failed: {
      icon: <XCircle className="w-12 h-12 text-red-500" />,
      bg: 'bg-red-50',
      title: 'Payment Failed',
      subtitle: 'Your card was declined or an error occurred. Your slot has been released.',
      badge: 'text-red-700 bg-red-100',
      badgeText: 'Payment Failed',
    },
    cancelled: {
      icon: <XCircle className="w-12 h-12 text-amber-500" />,
      bg: 'bg-amber-50',
      title: 'Payment Cancelled',
      subtitle: 'You cancelled the payment. Your appointment slot has been released.',
      badge: 'text-amber-700 bg-amber-100',
      badgeText: 'Cancelled',
    },
    chargedback: {
      icon: <XCircle className="w-12 h-12 text-red-500" />,
      bg: 'bg-red-50',
      title: 'Chargeback Received',
      subtitle: 'A chargeback was initiated. Please contact support.',
      badge: 'text-red-700 bg-red-100',
      badgeText: 'Chargedback',
    },
    pending: {
      icon: <Clock className="w-12 h-12 text-blue-500" />,
      bg: 'bg-blue-50',
      title: 'Payment Pending',
      subtitle: 'Your bank is still processing the payment. Check back in a few minutes.',
      badge: 'text-blue-700 bg-blue-100',
      badgeText: 'Pending',
    },
    unknown: {
      icon: <Clock className="w-12 h-12 text-text-muted" />,
      bg: 'bg-secondary',
      title: 'Status Unknown',
      subtitle: 'We could not determine your payment status. Check your appointments page.',
      badge: 'text-text-muted bg-border-light',
      badgeText: 'Unknown',
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden">

        {status === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-text">Checking payment status...</h2>
            <p className="text-sm text-text-muted text-center">
              Waiting for PayHere to confirm your payment. This takes a few seconds.
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: MAX_POLLS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i < pollCount ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Coloured status banner */}
            <div className={`${config[status].bg} flex flex-col items-center py-10 px-8 space-y-3`}>
              {config[status].icon}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config[status].badge}`}>
                {config[status].badgeText}
              </span>
              <h1 className="text-xl font-bold text-text text-center">{config[status].title}</h1>
              <p className="text-sm text-text-secondary text-center">{config[status].subtitle}</p>
            </div>

            {/* Details */}
            {(doctorName || amount) && (
              <div className="px-6 py-4 border-b border-border space-y-2">
                {doctorName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Doctor</span>
                    <span className="font-medium text-text">{doctorName}</span>
                  </div>
                )}
                {amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Amount</span>
                    <span className="font-medium text-text">LKR {Number(amount).toLocaleString()}</span>
                  </div>
                )}
                {appointmentId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Ref.</span>
                    <span className="font-mono text-xs text-text-muted">{appointmentId.slice(0, 8)}…</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-5 space-y-3">
              <button
                onClick={() => router.push('/patient/appointments')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all"
              >
                View My Appointments
                <ArrowRight className="w-4 h-4" />
              </button>
              {(status === 'failed' || status === 'cancelled') && (
                <button
                  onClick={() => router.push('/patient/find-doctor')}
                  className="w-full py-3 border border-border text-text-secondary hover:bg-secondary font-medium rounded-xl text-sm transition-all"
                >
                  Book Another Appointment
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 text-text-muted hover:text-text text-sm transition-all"
              >
                Go to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
