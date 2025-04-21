"use client";

import { ReactNode } from 'react';
import ProtectedRoute from '@/lib/authMiddleware';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ProtectedRoute>
      {children}
      <Toaster />
    </ProtectedRoute>
  );
} 