'use client';

import { Calendar, Users, Clock, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDoctorProfile, useDoctorDaySchedules } from '@/hooks/useDoctor';
import { useAppointments } from '@/hooks/useAppointments';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatTime, cn } from '@/lib/utils';
import Link from 'next/link';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 skeleton rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2].map(i => <div key={i} className="h-48 skeleton rounded-2xl" />)}</div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useDoctorProfile();
  const { data: schedules } = useDoctorDaySchedules();
  const { data: appointments } = useAppointments();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDate = new Date().toISOString().split('T')[0];
  const todaySchedule = schedules?.find(s => s.date === todayDate);
  const upcomingSchedules = (schedules ?? []).filter(s => s.date >= todayDate && s.status !== 'completed').slice(0, 3);
  const totalPatients = appointments?.length ?? 0;
  const todayCount = todaySchedule?.totalPatients ?? 0;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-accent rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          </div>
          <p className="text-orange-100 text-sm font-medium mb-1">{greeting()},</p>
          <h1 className="text-2xl font-bold">Dr. {user?.firstName} {user?.lastName}</h1>
          <p className="text-orange-100 text-sm mt-1">{profile?.specialization} · {profile?.currentHospital}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Today's Patients" value={todayCount} icon={Calendar} color="primary" />
          <StatsCard label="Upcoming Sessions" value={upcomingSchedules.length} icon={Clock} color="warning" />
          <StatsCard label="Total Patients Seen" value={totalPatients} icon={Users} color="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Today&apos;s Schedule</h2>
              <span className="text-xs text-text-muted">{formatDate(todayDate)}</span>
            </div>
            {!todaySchedule ? (
              <div className="text-center py-8 text-text-muted text-sm">No sessions scheduled for today</div>
            ) : (
              <div className="space-y-2">
                <div className={cn('flex items-center gap-2 text-sm px-3 py-2 rounded-xl mb-3', todaySchedule.consultationType === 'online' ? 'bg-primary-50 text-primary' : 'bg-secondary text-accent')}>
                  <span className="font-medium capitalize">{todaySchedule.consultationType}</span>
                  <span>·</span>
                  <span>{todaySchedule.totalPatients} patients</span>
                </div>
                {appointments?.filter(a => a.date === todayDate).slice(0, 4).map(apt => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-xs text-text-muted w-14">{formatTime(apt.startTime)}</span>
                    <span className="text-sm font-medium text-text flex-1">{apt.patientName}</span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h2 className="font-semibold text-text mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/doctor/schedule" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary-50 hover:border-primary border border-border transition-all group">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Add Availability</p>
                  <p className="text-xs text-text-secondary">Set your schedule for upcoming days</p>
                </div>
              </Link>
              <Link href="/doctor/appointments" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary-50 hover:border-primary border border-border transition-all group">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">View Appointments</p>
                  <p className="text-xs text-text-secondary">See all upcoming patient bookings</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
