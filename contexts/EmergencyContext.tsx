"use client";

import { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

// Add a global interface for window to track sound state
declare global {
  interface Window {
    _emergencyAudioEnabled?: boolean;
    _emergencyHasInteracted?: boolean;
    _emergencyAudioElement?: HTMLAudioElement;
    _emergencyPreviousCount?: number;
  }
}

// Define types for the emergency user
interface EmergencyUser {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
  currentLocation: string;
  assignedLocation: string;
  atAssignedLocation: boolean;
  emergencyAlarm: boolean;
  createdAt: string;
  updatedAt: string;
  sex: string;
  age: number;
}

// Define the context type
interface EmergencyContextType {
  emergencyUsers: EmergencyUser[];
  emergencySidebarOpen: boolean;
  setEmergencySidebarOpen: (isOpen: boolean) => void;
  resolveEmergency: (userId: string) => Promise<void>;
  isResolvingEmergency: boolean;
  refreshEmergencies: () => Promise<void>;
  isRefreshing: boolean;
  audioEnabled: boolean;
  enableAudio: () => Promise<boolean>;
  testPlaySound: () => Promise<boolean>;
}

// Create context with default values
const EmergencyContext = createContext<EmergencyContextType>({
  emergencyUsers: [],
  emergencySidebarOpen: false,
  setEmergencySidebarOpen: () => {},
  resolveEmergency: async () => {},
  isResolvingEmergency: false,
  refreshEmergencies: async () => {},
  isRefreshing: false,
  audioEnabled: false,
  enableAudio: async () => false,
  testPlaySound: async () => false,
});

// Hook for components to use the emergency context
export const useEmergency = () => useContext(EmergencyContext);

interface EmergencyProviderProps {
  children: ReactNode;
}

export const EmergencyProvider = ({ children }: EmergencyProviderProps) => {
  const [emergencyUsers, setEmergencyUsers] = useState<EmergencyUser[]>([]);
  const [emergencySidebarOpen, setEmergencySidebarOpen] = useState(false);
  const [isResolvingEmergency, setIsResolvingEmergency] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousEmergencyCount, setPreviousEmergencyCount] = useState(
    typeof window !== 'undefined' && window._emergencyPreviousCount ? window._emergencyPreviousCount : 0
  );
  const [hasInteracted, setHasInteracted] = useState<boolean>(
    typeof window !== 'undefined' && window._emergencyHasInteracted === true
  );
  const [audioEnabled, setAudioEnabled] = useState<boolean>(
    typeof window !== 'undefined' && window._emergencyAudioEnabled === true
  );
  
  // Function to play sound directly using global audio element
  const playEmergencySound = async () => {
    if (typeof window === 'undefined') {
      console.warn('Window not available for playback');
      return false;
    }
    
    if (!window._emergencyAudioElement) {
      console.warn('Audio element not available for playback');
      return false;
    }
    
    // Ensure audio is enabled
    if (!window._emergencyAudioEnabled && !audioEnabled) {
      console.warn('Audio is not enabled, skipping playback');
      return false;
    }
    
    try {
      console.log('EmergencyContext: Attempting to play emergency sound');
      
      // Check if audio is already playing
      if (window._emergencyAudioElement.paused === false) {
        console.log('EmergencyContext: Audio already playing, resetting it first');
        window._emergencyAudioElement.pause();
        window._emergencyAudioElement.currentTime = 0;
      }
      
      // Reset to beginning and set proper volume
      window._emergencyAudioElement.currentTime = 0;
      window._emergencyAudioElement.volume = 0.8;
      
      // Try to play the audio directly
      const playResult = await window._emergencyAudioElement.play().catch(err => {
        console.error('EmergencyContext: Play error caught:', err);
        throw err;
      });
      
      console.log('EmergencyContext: Sound played successfully');
      return true;
    } catch (err) {
      console.error('EmergencyContext: Error playing emergency sound:', err);
      
      // If autoplay is blocked, show a message
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.info('🔔 New emergency alert! (Sound blocked by browser)', {
          id: 'emergency-sound-blocked'
        });
      }
      
      return false;
    }
  };
  
  // Test function to play sound (for debugging)
  const testPlaySound = async (): Promise<boolean> => {
    console.log('Testing sound playback');
    const result = await playEmergencySound();
    console.log('Sound test result:', result);
    return result;
  };

  // Function to enable audio globally
  const enableAudio = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      console.log('Attempting to enable audio');
      
      // Ensure we have a global audio element
      if (!window._emergencyAudioElement) {
        console.log('No global audio element, please try again after page fully loads');
        toast.error('Audio system not ready. Please wait a moment and try again.');
        return false;
      }
      
      // Set volume low for the test
      window._emergencyAudioElement.volume = 0.1;
      
      // Make sure audio is in a good state
      if (window._emergencyAudioElement.paused === false) {
        window._emergencyAudioElement.pause();
      }
      window._emergencyAudioElement.currentTime = 0;
      
      // Try to play the sound
      console.log('Attempting to play sound to enable audio');
      const playPromise = window._emergencyAudioElement.play();
      await playPromise;
      
      // If we got here, audio played successfully
      console.log('Audio played successfully, pausing it');
      window._emergencyAudioElement.pause();
      window._emergencyAudioElement.currentTime = 0;
      window._emergencyAudioElement.volume = 0.8; // Reset to normal volume
      
      // Update local and global state
      setAudioEnabled(true);
      setHasInteracted(true);
      window._emergencyAudioEnabled = true;
      window._emergencyHasInteracted = true;
      
      console.log('Audio enabled successfully');
      toast.success('Emergency notifications sound enabled');
      return true;
    } catch (err) {
      console.error('Failed to enable audio:', err);
      toast.error('Could not enable audio. Please try again with a user interaction.');
      return false;
    }
  };

  // Setup user interaction listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Update local state from global window state
    if (window._emergencyAudioEnabled) {
      setAudioEnabled(true);
    }
    
    if (window._emergencyHasInteracted) {
      setHasInteracted(true);
    }
    
    // Add interaction listeners only if not already interacted
    if (!window._emergencyHasInteracted) {
      const setInteracted = () => {
        console.log('User interaction detected in EmergencyContext');
        setHasInteracted(true);
        window._emergencyHasInteracted = true;
      };
      
      // Add global interaction listeners
      window.addEventListener('click', setInteracted, { once: true });
      window.addEventListener('keydown', setInteracted, { once: true });
      window.addEventListener('touchstart', setInteracted, { once: true });
      
      // Cleanup function
      return () => {
        window.removeEventListener('click', setInteracted);
        window.removeEventListener('keydown', setInteracted);
        window.removeEventListener('touchstart', setInteracted);
      };
    }
  }, []);

  // Fetch emergency users
  const fetchEmergencyUsers = async (isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await api.get<{ users: EmergencyUser[] }>('/users');
      
      // Filter users with active emergency
      const usersWithEmergency = response.data.users.filter(user => user.emergencyAlarm);
      
      // Check for new emergency alerts
      const currentEmergencyCount = usersWithEmergency.length;
      const previousCount = previousEmergencyCount;
      
      console.log(`EmergencyContext: Checking emergencies - Current: ${currentEmergencyCount}, Previous: ${previousCount}`);
      
      // Update global count for sharing across page changes
      if (typeof window !== 'undefined') {
        window._emergencyPreviousCount = currentEmergencyCount;
      }
      
      // Play sound if there are new emergencies (not on silent refresh)
      if (!isSilent && currentEmergencyCount > previousCount) {
        console.log(`EmergencyContext: New emergencies detected: ${currentEmergencyCount - previousCount}`);
        
        // Show a notification toast
        toast.error(`🚨 New emergency alert! ${currentEmergencyCount - previousCount} new emergency alerts`, {
          id: 'new-emergency-alert',
          duration: 10000,
        });
        
        // Play sound if user has interacted with the page
        if (hasInteracted || window._emergencyHasInteracted) {
          console.log('EmergencyContext: User has interacted, playing sound');
          const soundResult = await playEmergencySound();
          console.log('EmergencyContext: Sound play result:', soundResult);
        } else {
          console.log('EmergencyContext: User has not interacted yet, cannot play sound');
        }
        
        // Open emergency sidebar automatically when new emergency detected
        setEmergencySidebarOpen(true);
      }
      
      // Update previous count for next comparison
      setPreviousEmergencyCount(currentEmergencyCount);
      
      // Update emergency users
      setEmergencyUsers(usersWithEmergency);
    } catch (error) {
      console.error('Failed to fetch emergency users:', error);
    } finally {
      if (!isSilent) {
        setIsRefreshing(false);
      }
    }
  };

  // Initialize and set up interval for fetching
  useEffect(() => {
    // Initial fetch
    fetchEmergencyUsers(true);
    
    // Set up interval for regular refreshes
    const interval = setInterval(() => {
      fetchEmergencyUsers(true);
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to resolve emergency
  const resolveEmergency = async (userId: string) => {
    setIsResolvingEmergency(true);
    
    try {
      await api.put(`/users/${userId}/emergency`, { 
        emergencyAlarm: false
      });
      
      // Refresh the emergency list
      await fetchEmergencyUsers();
    } catch (error) {
      console.error('Error resolving emergency:', error);
      throw error;
    } finally {
      setIsResolvingEmergency(false);
    }
  };

  // Public method to refresh emergencies
  const refreshEmergencies = async () => {
    await fetchEmergencyUsers();
  };

  // Update global audio state when local state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._emergencyAudioEnabled = audioEnabled;
    }
  }, [audioEnabled]);
  
  // Update local state when global state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAudioEnabled(window._emergencyAudioEnabled === true);
      setHasInteracted(window._emergencyHasInteracted === true);
      
      if (window._emergencyPreviousCount !== undefined) {
        setPreviousEmergencyCount(window._emergencyPreviousCount);
      }
    }
  }, []);

  const value = {
    emergencyUsers,
    emergencySidebarOpen,
    setEmergencySidebarOpen,
    resolveEmergency,
    isResolvingEmergency,
    refreshEmergencies,
    isRefreshing,
    audioEnabled,
    enableAudio,
    testPlaySound
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}; 