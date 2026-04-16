'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Search } from 'lucide-react';

export default function PaymentCancelPage() {
  const router = useRouter();

  // Clean up sessionStorage on cancel
  useEffect(() => {
    sessionStorage.removeItem('pendingAppointmentId');
    sessionStorage.removeItem('pendingDoctorName');
    sessionStorage.removeItem('pendingAmount');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-lg overflow-hidden">

        {/* Banner */}
        <div className="bg-amber-50 flex flex-col items-center py-10 px-8 space-y-3">
          <XCircle className="w-12 h-12 text-amber-500" />
          <span className="text-xs font-semibold px-3 py-1 rounded-full text-amber-700 bg-amber-100">
            Payment Cancelled
          </span>
          <h1 className="text-xl font-bold text-text text-center">Payment was cancelled</h1>
          <p className="text-sm text-text-secondary text-center">
            You cancelled the payment on PayHere. Your appointment slot has been released and no charge was made.
          </p>
        </div>

        {/* Info box */}
        <div className="px-6 py-5 border-b border-border">
          <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm text-text-secondary">
            <p>💡 <strong className="text-text">Your slot is now available</strong> for other patients.</p>
            <p>If you still want this appointment, simply search for the doctor again and choose a new slot.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 space-y-3">
          <button
            onClick={() => router.push('/patient/find-doctor')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all"
          >
            <Search className="w-4 h-4" />
            Find a Doctor
          </button>
          <button
            onClick={() => router.push('/patient/appointments')}
            className="w-full flex items-center justify-center gap-2 py-3 border border-border text-text-secondary hover:bg-secondary font-medium rounded-xl text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            My Appointments
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 text-text-muted hover:text-text text-sm transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
