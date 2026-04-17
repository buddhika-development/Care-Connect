'use client';

import { Users, Calendar, CreditCard, Stethoscope, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAdminAppointments } from '@/hooks/useAppointments';
import { useAllDoctorsAdmin } from '@/hooks/useDoctor';
import { usePaymentSummary } from '@/hooks/usePayments';
import UserSummaryCard from '@/components/common/UserSummaryCard';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

function DashSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 skeleton rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: appointments, isLoading: aptLoading } = useAdminAppointments();
  const { data: doctors, isLoading: docLoading } = useAllDoctorsAdmin();
  const { data: paymentSummary, isLoading: payLoading } = usePaymentSummary();

  if (aptLoading || docLoading || payLoading) return <DashSkeleton />;

  const confirmedCount = appointments?.filter(a => a.status === 'confirmed').length ?? 0;
  const completedCount = appointments?.filter(a => a.status === 'completed').length ?? 0;
  const verifiedDoctors = doctors?.filter(d => d.isVerified).length ?? 0;
  const pendingDoctors = doctors?.filter(d => !d.isVerified).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-text rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-300 text-sm mt-0.5">CareConnect Platform Overview</p>
          </div>
        </div>
      </div>

      <UserSummaryCard />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Active Appointments" value={confirmedCount} icon={Calendar} color="primary" />
        <StatsCard label="Total Revenue" value={formatCurrency(paymentSummary?.totalRevenue ?? 0)} icon={CreditCard} color="success" />
        <StatsCard label="Verified Doctors" value={verifiedDoctors} icon={Stethoscope} color="accent" />
        <StatsCard label="Pending Verifications" value={pendingDoctors} icon={ShieldCheck} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2.5">
            {(appointments ?? []).slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div>
                  <p className="text-sm font-medium text-text">{apt.patientName}</p>
                  <p className="text-xs text-text-secondary">{apt.doctorName} · {formatDate(apt.date)}</p>
                </div>
                <StatusBadge status={apt.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Doctor Verifications */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text">Pending Verifications</h2>
            <Link href="/admin/doctors" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {pendingDoctors === 0 ? (
            <div className="text-center py-6 text-text-muted text-sm">All doctors verified ✓</div>
          ) : (
            <div className="space-y-2.5">
              {(doctors ?? []).filter(d => !d.isVerified).map(doc => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-text-secondary">{doc.specialization} · {doc.currentHospital}</p>
                  </div>
                  <Link href="/admin/doctors" className="text-xs text-white bg-primary px-2.5 py-1 rounded-lg hover:bg-primary-dark transition-all font-medium">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
