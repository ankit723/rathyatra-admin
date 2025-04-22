"use client";

import { ReactNode } from 'react';
import ProtectedRoute from '@/lib/authMiddleware';
import { Toaster } from '@/components/ui/sonner';
import { EmergencyProvider } from '@/contexts/EmergencyContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ProtectedRoute>
      <EmergencyProvider>
        {children}
      </EmergencyProvider>
    </ProtectedRoute>
  );
} 