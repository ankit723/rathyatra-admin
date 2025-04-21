"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AdminLoginCredentials, 
  AdminRegisterCredentials, 
  AuthResponse,
  loginAdmin as login,
  registerAdmin as register,
  logoutAdmin as logout,
  getAdminData,
  isAuthenticated,
  checkAuthStatus
} from './auth';

interface UseAuthReturn {
  admin: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AdminLoginCredentials) => Promise<AuthResponse>;
  register: (credentials: AdminRegisterCredentials) => Promise<AuthResponse>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [admin, setAdmin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();

  // Load admin data and check auth status
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const isAuthed = await checkAuthStatus();
      setIsAuthed(isAuthed);
      
      if (isAuthed) {
        const adminData = getAdminData();
        setAdmin(adminData);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthed(false);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Login function
  const handleLogin = async (credentials: AdminLoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    
    try {
      const response = await login(credentials);
      setAdmin(response.admin);
      setIsAuthed(true);
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const handleRegister = async (credentials: AdminRegisterCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    
    try {
      const response = await register(credentials);
      setAdmin(response.admin);
      setIsAuthed(true);
      
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    logout();
    setAdmin(null);
    setIsAuthed(false);
    router.push('/login');
  };

  return {
    admin,
    isLoading,
    isAuthenticated: isAuthed,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout
  };
} 