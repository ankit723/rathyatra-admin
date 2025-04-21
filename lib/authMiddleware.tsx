"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, checkAuthStatus } from './auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/register'];

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Check if the current route is public
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (isPublicRoute) {
        // If user is authenticated and trying to access login/register, redirect to dashboard
        if (isAuthenticated()) {
          router.push('/dashboard');
        }
        setIsChecking(false);
        return;
      }
      
      // For protected routes, check authentication status
      const isAuthed = await checkAuthStatus();
      
      if (!isAuthed) {
        // Redirect to login if not authenticated
        router.push('/login');
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [pathname, router]);
  
  // Show nothing while checking authentication status
  if (isChecking) {
    return null;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute; 