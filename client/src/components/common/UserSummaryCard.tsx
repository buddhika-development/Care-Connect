'use client';

import { RefreshCw, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useUserSummary } from '@/hooks/useUser';
import { cn } from '@/lib/utils';

export default function UserSummaryCard() {
  const { data, isLoading, isError, refetch } = useUserSummary();

  const summaryText = typeof data?.user_summary === 'string' ? data.user_summary.trim() : '';
  const hasSummary = !!data && !!summaryText;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-text">User Summary</h2>
            <p className="text-xs text-text-muted">Fetched from your profile details</p>
          </div>
        </div>

        {data && (
          <button
            type="button"
            onClick={() => refetch()}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              'bg-secondary text-text-secondary hover:text-text hover:bg-primary-50'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 skeleton rounded-full w-3/4" />
          <div className="h-4 skeleton rounded-full w-full" />
          <div className="h-4 skeleton rounded-full w-5/6" />
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-error-light px-4 py-3 text-sm text-error">
          Unable to load summary details right now.
        </div>
      ) : hasSummary ? (
        <div className="space-y-3">
          <div className="prose prose-sm sm:prose-base max-w-none break-words prose-headings:text-text prose-p:text-text-secondary prose-strong:text-text prose-ul:text-text-secondary prose-li:text-text-secondary">
            <ReactMarkdown>{summaryText}</ReactMarkdown>
          </div>
          {typeof data?.updated_datetime === 'string' && data.updated_datetime.trim() && (
            <p className="text-xs text-text-muted">Last updated: {data.updated_datetime}</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-light bg-secondary px-4 py-4 text-sm text-text-muted">
          There are no summary details yet.
        </div>
      )}
    </div>
  );
}