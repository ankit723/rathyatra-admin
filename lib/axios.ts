import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Default config for the axios instance
const axiosConfig: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const axiosInstance: AxiosInstance = axios.create(axiosConfig);

// Flag to track if token refresh is in progress
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: { resolve: (token: string | null) => void; reject: (error: Error) => void }[] = [];

// Process the queue of failed requests
const processQueue = (error: Error | null = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      return null;
    }
    
    const response = await axios.post(
      `${axiosConfig.baseURL}/auth/admin/refresh-token`,
      { refreshToken }
    );
    
    const { accessToken } = response.data;
    localStorage.setItem('auth_token', accessToken);
    
    return accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('admin_data');
    }
    return null;
  }
};

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth tokens here
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      // Set retry flag and start refreshing
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        
        // If token refresh was successful
        if (newToken) {
          // Update Authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          // Process queue with new token
          processQueue(null, newToken);
          isRefreshing = false;
          
          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          // If token refresh failed, redirect to login
          processQueue(new Error('Failed to refresh token'));
          isRefreshing = false;
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Handle errors in token refresh
        processQueue(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
        isRefreshing = false;
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors or if refresh failed, reject with the original error
    return Promise.reject(error);
  }
);

// API wrapper functions
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.get<T, AxiosResponse<T>>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.post<T, AxiosResponse<T>>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.put<T, AxiosResponse<T>>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.patch<T, AxiosResponse<T>>(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.delete<T, AxiosResponse<T>>(url, config),
};

// Export the axios instance as default
export default axiosInstance; 