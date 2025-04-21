import { api } from './axios';

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminRegisterCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  admin: {
    _id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Token expiration tracking
let tokenExpiryTime: number | null = null;

// Set token expiry (default 1 hour from now)
const setTokenExpiry = () => {
  // Set expiry to 55 minutes from now (slightly less than the 1h token lifetime)
  // This ensures we refresh before the token actually expires
  tokenExpiryTime = Date.now() + 55 * 60 * 1000;
};

// Check if token is expired or about to expire
export const isTokenExpired = (): boolean => {
  if (!tokenExpiryTime) {
    // If we don't have an expiry time, consider it expired
    return true;
  }
  
  // Return true if current time is past expiry time
  return Date.now() >= tokenExpiryTime;
};

// Save tokens to localStorage
const saveTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setTokenExpiry();
  }
};

// Clear tokens from localStorage
export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_data');
    tokenExpiryTime = null;
  }
};

// Save admin data to localStorage
const saveAdminData = (admin: AuthResponse['admin']) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_data', JSON.stringify(admin));
  }
};

// Get admin data from localStorage
export const getAdminData = () => {
  if (typeof window !== 'undefined') {
    const adminData = localStorage.getItem('admin_data');
    return adminData ? JSON.parse(adminData) : null;
  }
  return null;
};

// Get auth token with automatic refresh if needed
export const getAuthToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const token = localStorage.getItem('auth_token');
  
  // If no token or token is expired, the axios interceptor will handle refresh
  return token;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('auth_token');
  }
  return false;
};

// Login admin
export const loginAdmin = async (credentials: AdminLoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/admin/login', credentials);
    const { accessToken, refreshToken, admin } = response.data;
    
    saveTokens(accessToken, refreshToken);
    saveAdminData(admin);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register admin
export const registerAdmin = async (credentials: AdminRegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/admin/register', credentials);
    const { accessToken, refreshToken, admin } = response.data;
    
    saveTokens(accessToken, refreshToken);
    saveAdminData(admin);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check auth status and refresh token if needed
export const checkAuthStatus = async (): Promise<boolean> => {
  if (!isAuthenticated()) {
    return false;
  }
  
  // The axios interceptor will handle token refresh automatically
  // This function is mainly for explicit auth checks
  const token = await getAuthToken();
  return !!token;
};

// Logout admin
export const logoutAdmin = () => {
  clearTokens();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}; 