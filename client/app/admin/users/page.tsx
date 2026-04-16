'use client';

import { useState } from 'react';
import { Search, Users, ShieldCheck, HeartPulse, Stethoscope, CheckCircle2 } from 'lucide-react';
import { useAllDoctorsAdmin } from '@/hooks/useDoctor';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

// ─── Patient list fetcher (admin-accessible via /api/patients) ─────────────────
interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  complete_profile: boolean;
  createdAt?: string;
}

async function getAdminPatientList(): Promise<PatientListItem[]> {
  const { data } = await apiClient.get('/api/patients');
  return data.data ?? [];
}

function useAdminPatients() {
  return useQuery({
    queryKey: ['admin', 'patients', 'list'],
    queryFn: getAdminPatientList,
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function UserSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 skeleton rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 skeleton rounded w-36" />
          <div className="h-3 skeleton rounded w-52" />
        </div>
        <div className="h-6 skeleton rounded-full w-20" />
      </div>
    </div>
  );
}

type TabFilter = 'all' | 'patient' | 'doctor';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('all');

  const { data: patients, isLoading: patientsLoading, isError: patientsError, refetch: refetchPatients } = useAdminPatients();
  const { data: doctors, isLoading: doctorsLoading, isError: doctorsError, refetch: refetchDoctors } = useAllDoctorsAdmin();

  const isLoading = patientsLoading || doctorsLoading;
  // Don't block the whole UI if one source fails — show partial data
  const partialError = patientsError || doctorsError;
  const fullyFailed = patientsError && doctorsError;

  // Normalise both into a unified list
  const allUsers = [
    ...(patients ?? []).map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      role: 'patient' as const,
      isActive: true,
      profileComplete: p.complete_profile,
      badge: null as string | null,
    })),
    ...(doctors ?? []).map((d) => ({
      id: d.id,
      name: `Dr. ${d.firstName} ${d.lastName}`,
      email: d.email,
      role: 'doctor' as const,
      isActive: d.isVerified,
      profileComplete: true,
      badge: d.isVerified ? 'Verified' : 'Pending',
    })),
  ];

  const filtered = allUsers.filter((u) => {
    const matchesTab = tab === 'all' || u.role === tab;
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const patientCount = allUsers.filter((u) => u.role === 'patient').length;
  const doctorCount = allUsers.filter((u) => u.role === 'doctor').length;

  const TABS: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All Users', count: allUsers.length },
    { key: 'patient', label: 'Patients', count: patientCount },
    { key: 'doctor', label: 'Doctors', count: doctorCount },
  ];

  const ROLE_STYLES = {
    patient: {
      avatar: 'bg-primary-50 text-primary',
      badge: 'bg-primary-50 text-primary',
      icon: HeartPulse,
    },
    doctor: {
      avatar: 'bg-orange-50 text-accent',
      badge: 'bg-orange-50 text-accent',
      icon: Stethoscope,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">User Management</h1>
        <p className="text-text-secondary text-sm mt-1">View and manage all registered patients and doctors</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users', value: allUsers.length, icon: Users, color: 'text-text', bg: 'bg-secondary' },
          { label: 'Patients', value: patientCount, icon: HeartPulse, color: 'text-primary', bg: 'bg-primary-50' },
          { label: 'Doctors', value: doctorCount, icon: Stethoscope, color: 'text-accent', bg: 'bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{isLoading ? '—' : s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-medium transition-all',
                tab === t.key ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'
              )}
            >
              {t.label} ({isLoading ? '…' : t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Partial data warning */}
      {!isLoading && partialError && !fullyFailed && (
        <div className="flex items-center gap-3 p-3.5 bg-warning-light border border-warning/20 rounded-xl text-sm text-warning">
          <span className="text-base">⚠️</span>
          <span>
            {patientsError ? 'Patient data is temporarily unavailable (patient service is offline).' : 'Doctor data is temporarily unavailable.'}
            {' '}Showing available data only.
          </span>
        </div>
      )}

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <UserSkeleton key={i} />)}
        </div>
      ) : fullyFailed ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">Failed to load user data.</p>
          <button
            onClick={() => { refetchPatients(); refetchDoctors(); }}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your search criteria."
          action={{ label: 'Clear Search', onClick: () => setSearch('') }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const style = ROLE_STYLES[user.role];
            const RoleIcon = style.icon;
            return (
              <div key={`${user.role}-${user.id}`} className="bg-card rounded-2xl border border-border shadow-card p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', style.avatar)}>
                    {user.name.replace('Dr. ', '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-text text-sm">{user.name}</p>
                      {/* Role badge */}
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', style.badge)}>
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </span>
                      {/* Doctor verification badge */}
                      {user.badge && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          user.badge === 'Verified' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                        )}>
                          {user.badge === 'Verified' ? '✓ ' : ''}{user.badge}
                        </span>
                      )}
                      {/* Patient profile status */}
                      {user.role === 'patient' && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          user.profileComplete ? 'bg-success-light text-success' : 'bg-secondary text-text-muted'
                        )}>
                          {user.profileComplete ? (
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Profile complete</span>
                          ) : 'Profile incomplete'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{user.email}</p>
                  </div>

                  {/* Status dot */}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted flex-shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', user.isActive ? 'bg-success' : 'bg-warning')} />
                    {user.isActive ? 'Active' : 'Pending'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
