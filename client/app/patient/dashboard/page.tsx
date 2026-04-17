'use client';

import { Calendar, FileText, Bot, Search, Clock, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppointments } from '@/hooks/useAppointments';
import { useRecentActivity } from '@/hooks/usePatient';
import UserSummaryCard from '@/components/common/UserSummaryCard';
import StatsCard from '@/components/common/StatsCard';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 skeleton rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  appointment: <Calendar className="w-4 h-4 text-primary" />,
  prescription: <FileText className="w-4 h-4 text-accent" />,
  payment: <Clock className="w-4 h-4 text-success" />,
  document: <FileText className="w-4 h-4 text-text-secondary" />,
};

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: appointments, isLoading, isError, refetch } = useAppointments();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const upcoming = appointments?.find(a => a.status === 'confirmed' || a.status === 'ongoing');
  const confirmedCount = appointments?.filter(a => a.status === 'confirmed').length ?? 0;
  const completedCount = appointments?.filter(a => a.status === 'completed').length ?? 0;

  if (isLoading) return <DashboardSkeleton />;

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-error font-medium mb-3">Failed to load dashboard data.</p>
      <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
        {/* Welcome card */}
        <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white" />
          </div>
          <p className="text-primary-light text-sm font-medium mb-1">{greeting()},</p>
          <h1 className="text-2xl font-bold mb-1">{user?.firstName} {user?.lastName}</h1>
          <p className="text-primary-light text-sm">Here&apos;s your health summary for today.</p>
        </div>

        <UserSummaryCard />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Upcoming Appointments" value={confirmedCount} icon={Calendar} color="primary" />
          <StatsCard label="Completed Sessions" value={completedCount} icon={Clock} color="success" />
          <StatsCard label="Medical Records" value={2} icon={FileText} color="accent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming appointment */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Next Appointment</h2>
              <Link href="/patient/appointments" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {upcoming ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text">{upcoming.doctorName}</p>
                  <p className="text-sm text-text-secondary">{upcoming.doctorSpecialization}</p>
                  <p className="text-sm text-text-muted mt-1">{formatDateTime(upcoming.date, upcoming.startTime)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={upcoming.status} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${upcoming.consultationType === 'online' ? 'bg-primary-50 text-primary' : 'bg-secondary text-accent'}`}>
                      {upcoming.consultationType === 'online' ? 'Online' : 'Physical'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted text-sm">No upcoming appointments</div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Recent Activity</h2>
              <Activity className="w-4 h-4 text-text-muted" />
            </div>
            {activityLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)}</div>
            ) : (
              <ul className="space-y-3">
                {(activity ?? []).slice(0, 4).map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      {ACTIVITY_ICONS[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{item.title}</p>
                      <p className="text-xs text-text-secondary truncate">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <h2 className="font-semibold text-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/patient/find-doctor" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary-50 hover:border-primary border border-border transition-all group">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Book Appointment</p>
                <p className="text-xs text-text-secondary">Find the right doctor</p>
              </div>
            </Link>
            <Link href="/patient/medical-records" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary-50 hover:border-primary border border-border transition-all group">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Medical Records</p>
                <p className="text-xs text-text-secondary">View prescriptions & reports</p>
              </div>
            </Link>
            <Link href="/patient/ai-assistant" className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary-50 hover:border-primary border border-border transition-all group">
              <div className="w-9 h-9 rounded-lg bg-success flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Chat with AI</p>
                <p className="text-xs text-text-secondary">Get health guidance</p>
              </div>
            </Link>
          </div>
        </div>
    </div>
  );
}
