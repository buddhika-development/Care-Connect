'use client';

import { useState } from 'react';
import { CreditCard, Search, TrendingUp, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { usePayments, usePaymentSummary } from '@/hooks/usePayments';
import StatsCard from '@/components/common/StatsCard';
import EmptyState from '@/components/common/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AdminPayment } from '@/services/paymentService';

type PaymentFilter = 'all' | AdminPayment['status'];

const STATUS_CONFIG: Record<AdminPayment['status'], { label: string; className: string; icon: React.ReactNode }> = {
  success: { label: 'Success', className: 'bg-success-light text-success', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  failed: { label: 'Failed', className: 'bg-error-light text-error', icon: <XCircle className="w-3.5 h-3.5" /> },
  refunded: { label: 'Refunded', className: 'bg-warning-light text-warning', icon: <RotateCcw className="w-3.5 h-3.5" /> },
  pending: { label: 'Pending', className: 'bg-warning-light text-warning', icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

function SummarySkeleton() {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>;
}

function RowSkeleton() {
  return <div className="h-14 skeleton rounded-xl" />;
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('all');

  const { data: payments, isLoading, isError, refetch } = usePayments();
  const { data: summary, isLoading: summaryLoading } = usePaymentSummary();

  const filtered = (payments ?? []).filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = !search || p.patientName.toLowerCase().includes(search.toLowerCase()) || p.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Payment Management</h1>
        <p className="text-text-secondary text-sm mt-1">Track all transactions across the platform</p>
      </div>

      {/* Summary stats */}
      {summaryLoading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard label="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={TrendingUp} color="success" />
          <StatsCard label="Successful" value={summary?.successfulPayments ?? 0} icon={CheckCircle} color="primary" />
          <StatsCard label="Failed" value={summary?.failedPayments ?? 0} icon={XCircle} color="accent" />
          <StatsCard label="Refunded" value={summary?.refundedPayments ?? 0} icon={RotateCcw} color="warning" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or doctor..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'success', 'failed', 'refunded'] as PaymentFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-white' : 'bg-secondary text-text-secondary hover:bg-border'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <RowSkeleton key={i} />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-error font-medium mb-3">Failed to load payments.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-xl text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments found" description="No payments match your filter criteria." action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setFilter('all'); } }} />
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Doctor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(p => {
                  const config = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-secondary transition-colors">
                      <td className="px-5 py-3 font-medium text-text">{p.patientName}</td>
                      <td className="px-5 py-3 text-text-secondary">{p.doctorName}</td>
                      <td className="px-5 py-3 text-text-secondary">{formatDate(p.date)}</td>
                      <td className="px-5 py-3 font-semibold text-text">{formatCurrency(p.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full', config.className)}>
                          {config.icon} {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
