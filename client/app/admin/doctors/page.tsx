'use client';

import { useState } from 'react';
import { Check, X, Search, Stethoscope } from 'lucide-react';
import { useAllDoctorsAdmin, useVerifyDoctor } from '@/hooks/useDoctor';
import EmptyState from '@/components/common/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function DocSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 skeleton rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton rounded w-32" />
          <div className="h-3 skeleton rounded w-48" />
        </div>
        <div className="h-8 skeleton rounded-xl w-20" />
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

  const { data: doctors, isLoading, isError, refetch } = useAllDoctorsAdmin();
  const { mutate: verifyDoctor, isPending } = useVerifyDoctor();

  const filtered = (doctors ?? []).filter(d => {
    const matchesFilter = filter === 'all' || (filter === 'verified' ? d.isVerified : !d.isVerified);
    const matchesSearch = !search || `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = (doctorId: string) => {
    verifyDoctor(doctorId, {
      onSuccess: () => toast.success('Doctor verified successfully.'),
      onError: () => toast.error('Verification failed. Try again.'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Manage Doctors</h1>
        <p className="text-text-secondary text-sm mt-1">Verify and manage healthcare providers on the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'verified', 'pending'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'}`}
            >
              {f === 'all' ? `All (${doctors?.length ?? 0})` : f === 'verified' ? `Verified (${doctors?.filter(d => d.isVerified).length ?? 0})` : `Pending (${doctors?.filter(d => !d.isVerified).length ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <DocSkeleton key={i} />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">Failed to load doctors.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="No doctors match your search or filter criteria." action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setFilter('all'); } }} />
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-card rounded-2xl border border-border shadow-card p-5">
              <div className="flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0', doc.isVerified ? 'bg-success-light text-success' : 'bg-warning-light text-warning')}>
                  {doc.firstName[0]}{doc.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">Dr. {doc.firstName} {doc.lastName}</p>
                    {doc.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-success-light text-success px-2 py-0.5 rounded-full font-medium">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">{doc.specialization}</p>
                  <p className="text-xs text-text-muted">{doc.currentHospital} · {doc.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!doc.isVerified && (
                    <button
                      onClick={() => handleVerify(doc.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-2 bg-success hover:bg-green-700 text-white text-xs font-medium rounded-xl transition-all disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" /> Verify
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-border text-text-secondary hover:bg-secondary text-xs font-medium rounded-xl transition-all">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
