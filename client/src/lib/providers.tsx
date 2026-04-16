'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider must be inside QueryClientProvider so it can use React Query internally if needed */}
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          duration={4000}
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
