"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { 
  UserPlus, 
  Search, 
  SlidersHorizontal, 
  MoreHorizontal,
  RefreshCcw,
  MapPin,
  AlertTriangle,
  Check,
  X,
  Bell,
  ChevronRight,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useEmergency } from '@/contexts/EmergencyContext';
import MessageDialog from '@/components/MessageDialog';

// Google Maps types
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: {
              types?: string[];
            }
          ) => google.maps.places.Autocomplete;
        };
        event: {
          clearInstanceListeners: (instance: any) => void;
        };
      };
    };
    initGoogleMapsCallback?: () => void;
  }
  
  namespace google.maps.places {
    interface Autocomplete {
      addListener: (event: string, callback: () => void) => any;
      getPlace: () => {
        formatted_address?: string;
      };
    }
  }
}

interface User {
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

// Define a proper type for GoogleMapsAutocomplete - use 'any' to avoid TypeScript errors
type GoogleMapsAutocomplete = any;

// Fix TypeScript issues by casting the window.google object
interface GoogleWindow extends Window {
  google?: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLElement,
          options?: {
            types?: string[];
          }
        ) => any;
      };
      event: {
        clearInstanceListeners: (instance: any) => void;
      };
    };
  };
}

// Add proper styling for the Places autocomplete dropdown
const GlobalStyles = () => {
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      /* Container styling */
      .pac-container {
        z-index: 9999 !important;
        background-color: white !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 0 0 0.5rem 0.5rem !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        margin-top: -1px !important;
        font-family: var(--font-geist-sans) !important;
        width: calc(100% - 48px) !important; /* Dialog has 24px padding on each side */
        margin-left: auto !important;
        margin-right: auto !important;
        left: 24px !important; /* Account for dialog padding */
      }
      
      /* Make sure the container is fixed */
      .pac-container-fixed {
        position: fixed !important;
      }
      
      /* Style individual items */
      .pac-item {
        padding: 0.75rem 1rem !important;
        font-size: 0.925rem !important;
        cursor: pointer !important;
        border-top: 1px solid #f1f5f9 !important;
        border-bottom: none !important;
        line-height: 1.5 !important;
      }
      
      .pac-item:hover, .pac-item.pac-item-selected {
        background-color: #f8fafc !important;
      }
      
      .pac-item:first-child {
        border-top: none !important;
      }
      
      .pac-icon {
        margin-right: 0.75rem !important;
      }
      
      .pac-item-query {
        font-size: 0.925rem !important;
        font-weight: 500 !important;
        color: #1e293b !important;
      }
      
      .pac-matched {
        font-weight: 600 !important;
      }
      
      /* Force left alignment fix */
      .pac-container:after {
        display: none !important;
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  
  // New states for location search
  const [locationSearchOpen, setLocationSearchOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchingByLocation, setIsSearchingByLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<(User & { distance?: number })[]>([]);
  const [searchedLocation, setSearchedLocation] = useState('');
  const locationSearchInputRef = useRef<HTMLInputElement>(null);
  const locationAutocompleteRef = useRef<GoogleMapsAutocomplete>(null);
  
  // Get emergency context
  const { emergencyUsers, setEmergencySidebarOpen, resolveEmergency, refreshEmergencies } = useEmergency();
  
  // Define Google Maps typings
  const autocompleteRef = useRef<GoogleMapsAutocomplete>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element on client side only
  useEffect(() => {
    // Create audio element on client side
    audioRef.current = new Audio('/sounds/emergency-alert.mp3');
    audioRef.current.volume = 0.7;
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const fetchUsers = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsBackgroundRefreshing(true);
    }
    setError(null);
    
    try {
      const response = await api.get<{ users: User[] }>('/users');
      setUsers(response.data.users);
      
      // Also refresh emergency data
      refreshEmergencies();
      
      // Handle filtered users based on current search query
      if (searchQuery.trim() !== '') {
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        const filtered = response.data.users.filter(user => 
          user.firstName.toLowerCase().includes(lowerCaseQuery) || 
          user.lastName.toLowerCase().includes(lowerCaseQuery) || 
          user.rank.toLowerCase().includes(lowerCaseQuery) ||
          user.phoneNumber.includes(lowerCaseQuery)
        );
        
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers(response.data.users);
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      if (isInitialLoad) {
        setError(err.response?.data?.message || 'Failed to load users');
        toast.error('Failed to load users. Please try again.');
      } else {
        // Only show a toast for background refresh failures, don't update the error state
        toast.error('Background refresh failed. Will retry again shortly.');
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
      setIsBackgroundRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  // Add auto refresh interval
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Only refresh if not already loading or background refreshing
      if (!isLoading && !isBackgroundRefreshing) {
        fetchUsers(false);
      }
    }, 5000); // Refresh every 15 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [isLoading, isBackgroundRefreshing]);

  // Function to position the pac-container exactly where it needs to be
  const positionPacContainer = () => {
    setTimeout(() => {
      if (!inputRef.current) return;
      
      const pacContainer = document.querySelector('.pac-container');
      if (!pacContainer) return;
      
      const dialogContent = document.querySelector('.sm\\:max-w-\\[425px\\]');
      if (!dialogContent) return;
      
      // Get dialog and input dimensions
      const dialogRect = dialogContent.getBoundingClientRect();
      const inputRect = inputRef.current.getBoundingClientRect();
      
      // Calculate the correct width and positions
      const dialogPadding = 24; // Dialog has 24px padding on each side
      const contentWidth = dialogRect.width - (dialogPadding * 2);
      
      // Force positioning and size
      (pacContainer as HTMLElement).style.position = 'fixed';
      (pacContainer as HTMLElement).style.width = `${contentWidth}px`;
      (pacContainer as HTMLElement).style.left = `${dialogRect.left + dialogPadding}px`;
      (pacContainer as HTMLElement).style.top = `${inputRect.bottom + 2}px`; // Small offset from input
      (pacContainer as HTMLElement).style.maxHeight = `${window.innerHeight - inputRect.bottom - 40}px`;
      (pacContainer as HTMLElement).style.overflowY = 'auto';
      
      // Add event listeners to prevent bubbling
      ['click', 'mousedown', 'pointerdown', 'touchstart'].forEach(eventType => {
        pacContainer.addEventListener(eventType, (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      });
    }, 100);
  };

  // Initialize Google Places Autocomplete when input is focused
  const initializeAutocomplete = () => {
    if (!inputRef.current) return;
    
    const checkAndInitAutocomplete = () => {
      // First check if Google Maps is already available
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        // Clear any existing autocomplete
        if (inputRef.current) {
          (window as any).google.maps.event.clearInstanceListeners(inputRef.current);
        }
        
        // Create new autocomplete instance
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment']
        });
        
        // Fix styling and prevent closing
        const setupPacContainer = () => {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            // Add listeners to prevent events from closing the dialog
            pacContainer.addEventListener('mousedown', (e) => {
              e.preventDefault();
              e.stopPropagation();
            });
            
            pacContainer.addEventListener('click', (e) => {
              e.stopPropagation();
            });
            
            // Position properly
            positionPacContainer();
          }
        };
        
        // Run setup once then on every input focus
        setTimeout(setupPacContainer, 300);
        if (inputRef.current) {
          inputRef.current.addEventListener('focus', setupPacContainer);
        }
        
        // Add place_changed event listener
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            setNewLocation(place.formatted_address);
          }
        });
        
        return true;
      }
      return false;
    };
    
    // Try to initialize immediately
    if (checkAndInitAutocomplete()) return;
    
    // If Google Maps isn't available yet, wait for it using the waitForGoogleMaps function
    if ((window as any).waitForGoogleMaps) {
      (window as any).waitForGoogleMaps(checkAndInitAutocomplete);
    } else {
      // If waitForGoogleMaps isn't available, try loading the script directly
      if (!(window as any).googleMapsLoading) {
        (window as any).googleMapsLoading = true;
        
        // Create callback
        (window as any).initGoogleMapsCallback = () => {
          checkAndInitAutocomplete();
          (window as any).googleMapsLoading = false;
        };
        
        // Load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  };

  const openLocationDialog = (userId: string, currentLocation: string) => {
    setSelectedUserId(userId);
    setNewLocation(currentLocation || '');
    setLocationDialogOpen(true);
  };

  const openDeleteDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setDeleteDialogOpen(true);
  };

  const openPasswordDialog = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const updateUserLocation = async () => {
    // Add cleanup function to remove any leftover suggestions
    const cleanup = () => {
      if (autocompleteRef.current && (window as any).google && (window as any).google.maps) {
        (window as any).google.maps.event.clearInstanceListeners(inputRef.current);
        autocompleteRef.current = null;
      }
      
      // Remove any existing pac-container
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        container.remove();
      });
    };

    if (!newLocation.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsUpdatingLocation(true);
    
    try {
      await api.put(`/users/${selectedUserId}/assigned-location`, { 
        assignedLocation: newLocation
      });
      
      toast.success('User location updated successfully');
      setLocationDialogOpen(false);
      fetchUsers(false); // Refresh the user list
      cleanup(); // Clean up autocomplete after successful update
    } catch (err: any) {
      console.error('Error updating location:', err);
      toast.error('Failed to update location. Please try again.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const deleteUser = async () => {
    if (!selectedUserId) return;
    
    setIsDeletingUser(true);
    
    try {
      await api.delete(`/users/${selectedUserId}`);
      
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers(true); // Refresh the user list
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const updateUserPassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }

    setIsUpdatingPassword(true);
    
    try {
      await api.put(`/users/${selectedUserId}/password`, { 
        password: newPassword
      });
      
      toast.success('User password updated successfully');
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getFullName = (user: User) => `${user.firstName} ${user.lastName}`;

  // Use more robust observer and event listeners
  useEffect(() => {
    if (!locationDialogOpen) return;
    
    // More robust function to handle positioning
    const handlePacContainer = () => {
      positionPacContainer();
      
      // Ensure the pac-container doesn't close on clicks
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer) {
        // Stop all events from bubbling out of pac-container
        ['click', 'mousedown', 'touchstart', 'pointerdown'].forEach(eventType => {
          pacContainer.addEventListener(eventType, (e) => {
            e.stopPropagation();
          }, true);
        });
      }
    };
    
    // Set up mutation observer to watch for pac-container being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          if (document.querySelector('.pac-container')) {
            handlePacContainer();
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add various event listeners
    window.addEventListener('resize', handlePacContainer);
    window.addEventListener('scroll', handlePacContainer, true);
    
    // Run initially with a delay to ensure dialog is rendered
    setTimeout(handlePacContainer, 300);
    
    // Set up more observers to keep dialog from closing
    const stopPropagation = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-container') || target.classList.contains('pac-container') || 
          target.classList.contains('pac-item') || target.closest('.pac-item')) {
        e.stopPropagation();
      }
    };
    
    // Add global event listeners to prevent dialog closing
    document.addEventListener('mousedown', stopPropagation, true);
    document.addEventListener('pointerdown', stopPropagation, true);
    
    // Clean up
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handlePacContainer);
      window.removeEventListener('scroll', handlePacContainer, true);
      document.removeEventListener('mousedown', stopPropagation, true);
      document.removeEventListener('pointerdown', stopPropagation, true);
    };
  }, [locationDialogOpen]);

  // Message dialog state
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const openMessageDialog = () => {
    setMessageDialogOpen(true);
  };

  // Update fetchUsers to refresh after sending messages
  const refreshAfterMessageSent = () => {
    fetchUsers(false);
  };

  // Initialize Google Places Autocomplete for the location search
  const initializeLocationSearchAutocomplete = () => {
    if (!locationSearchInputRef.current) return;
    
    const checkAndInitAutocomplete = () => {
      // First check if Google Maps is already available
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        // Clear any existing autocomplete
        if (locationSearchInputRef.current) {
          (window as any).google.maps.event.clearInstanceListeners(locationSearchInputRef.current);
        }
        
        // Create new autocomplete instance
        locationAutocompleteRef.current = new (window as any).google.maps.places.Autocomplete(locationSearchInputRef.current, {
          types: ['geocode', 'establishment']
        });
        
        // Add place_changed event listener
        locationAutocompleteRef.current.addListener('place_changed', () => {
          const place = locationAutocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            setLocationSearchQuery(place.formatted_address);
          }
        });
        
        return true;
      }
      return false;
    };
    
    // Try to initialize immediately
    if (checkAndInitAutocomplete()) return;
    
    // If Google Maps isn't available yet, wait for it
    if ((window as any).waitForGoogleMaps) {
      (window as any).waitForGoogleMaps(checkAndInitAutocomplete);
    } else {
      // If waitForGoogleMaps isn't available, try loading the script directly
      if (!(window as any).googleMapsLoading) {
        (window as any).googleMapsLoading = true;
        
        // Create callback
        (window as any).initGoogleMapsCallback = () => {
          checkAndInitAutocomplete();
          (window as any).googleMapsLoading = false;
        };
        
        // Load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  };

  // Search users by location
  const searchUsersByLocation = async () => {
    if (!locationSearchQuery.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsSearchingByLocation(true);
    
    try {
      const response = await api.get('/users/search/location', {
        params: {
          location: locationSearchQuery,
          radius: 200 // Default to 200m
        }
      });
      
      setLocationSearchResults(response.data.users);
      setFilteredUsers(response.data.users);
      setSearchedLocation(response.data.searchLocation);
      setLocationSearchOpen(false);
      
      // Show toast with result count
      toast.success(`Found ${response.data.total} user(s) within 200m of ${response.data.searchLocation}`);
    } catch (err: any) {
      console.error('Error searching users by location:', err);
      toast.error(err.response?.data?.message || 'Failed to search users by location');
    } finally {
      setIsSearchingByLocation(false);
    }
  };

  // Clear location search
  const clearLocationSearch = () => {
    setLocationSearchResults([]);
    setSearchedLocation('');
    setFilteredUsers(users);
    
    // Only clear search query if it's a location search
    if (locationSearchResults.length > 0) {
      setSearchQuery('');
    }
  };

  // Add useEffect for location search input initialization
  useEffect(() => {
    if (locationSearchOpen) {
      setTimeout(() => {
        if (locationSearchInputRef.current) {
          locationSearchInputRef.current.focus();
          initializeLocationSearchAutocomplete();
        }
      }, 100);
    }
  }, [locationSearchOpen]);

  return (
    <div className="space-y-6">
      {/* Add global styles for Google Places */}
      <GlobalStyles />
      
      {/* Audio elements for notifications */}
      <audio id="emergency-sound" src="/sounds/emergency-alert.mp3" preload="auto" />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">Manage user accounts and assignments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchUsers(true)}
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          
          {/* Emergency button */}
          {emergencyUsers.length > 0 && (
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={() => setEmergencySidebarOpen(true)}
              className="relative"
              title="Emergency Alerts"
            >
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-medium text-red-600">
                {emergencyUsers.length}
              </span>
              <Bell className="h-4 w-4" />
            </Button>
          )}
          
          {/* Add Location Search Button */}
          <Button 
            variant="outline"
            onClick={() => setLocationSearchOpen(true)}
            className="group"
            title="Search by location"
          >
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-foreground" />
            <span>Search by Location</span>
          </Button>
          
          <Button onClick={openMessageDialog} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Message</span>
          </Button>
          
          <Button asChild>
            <Link href="/users/create">
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Add User</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Add Location Search Results Banner - only shown when there are results */}
      {searchedLocation && (
        <div className="bg-muted/60 py-2 px-4 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span className="text-sm">
              Showing users within 200m of <strong>{searchedLocation}</strong>
              {locationSearchResults.length > 0 && ` (${locationSearchResults.length} found)`}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearLocationSearch}
            className="h-8 bg-primary text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} in the system
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilteredUsers(users)}>
                    All Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilteredUsers(users.filter(user => user.atAssignedLocation))}>
                    At Assigned Location
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilteredUsers(users.filter(user => !user.atAssignedLocation))}>
                    Not At Assigned Location
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilteredUsers(users.filter(user => user.emergencyAlarm))}>
                    Emergency Alarm Active
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-orange-500" />
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => fetchUsers(true)}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                    <th className="pb-3 pl-4">Name</th>
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Emergency</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user._id} 
                      className="border-b text-sm transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 pl-4">
                        <div>
                          <p className="font-medium">{getFullName(user)}</p>
                          <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{user.rank}</Badge>
                      </td>
                      <td className="py-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs">{user.assignedLocation || 'Not Assigned'}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Current: {user.currentLocation || 'Unknown'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="py-3">
                        {user.atAssignedLocation ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="mr-1 h-3 w-3" />
                            At Location
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <X className="mr-1 h-3 w-3" />
                            Not At Location
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        {user.emergencyAlarm ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Emergency
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                            None
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openLocationDialog(user._id, user.assignedLocation)}
                            >
                              Update Location
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => resolveEmergency(user._id)}
                              className={user.emergencyAlarm ? "text-red-600 focus:text-red-600" : "text-muted-foreground"}
                            >
                              {user.emergencyAlarm ? 'Emergency Resolved' : 'Emergency'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openPasswordDialog(user._id, getFullName(user))}
                            >
                              Reset Password
                            </DropdownMenuItem>
                            <Link href={`/users/${user._id}`}>
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                            </Link>
                            <Link href={`/users/${user._id}/edit`}>
                              <DropdownMenuItem>Edit User</DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(user._id, getFullName(user))}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Update Dialog */}
      <Dialog 
        open={locationDialogOpen} 
        onOpenChange={(open) => {
          // Make sure we don't close when clicking on suggestions
          if (!open) {
            // Detect if we're clicking on the pac-container
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer && pacContainer.contains(document.activeElement)) {
              return; // Don't close the dialog
            }
            setLocationDialogOpen(false);
          } else {
            setLocationDialogOpen(true);
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => {
            // Always prevent closing when clicking on pac-container
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer && 
               (pacContainer.contains(e.target as Node) || 
                (e.target as HTMLElement).classList.contains('pac-item') || 
                (e.target as HTMLElement).closest('.pac-item') || 
                (e.target as HTMLElement).classList.contains('pac-container') || 
                (e.target as HTMLElement).closest('.pac-container'))) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            // Always prevent interaction when clicking on pac-container
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer && 
               (pacContainer.contains(e.target as Node) || 
                (e.target as HTMLElement).classList.contains('pac-item') || 
                (e.target as HTMLElement).closest('.pac-item') || 
                (e.target as HTMLElement).classList.contains('pac-container') || 
                (e.target as HTMLElement).closest('.pac-container'))) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Update Assigned Location</DialogTitle>
            <DialogDescription>
              Enter a new assigned location for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                ref={inputRef}
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Search for a location"
                className="z-10"
                autoComplete="off"
                autoFocus
                onFocus={initializeAutocomplete}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setLocationDialogOpen(false);
              }}
              disabled={isUpdatingLocation}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateUserLocation}
              disabled={isUpdatingLocation}
            >
              {isUpdatingLocation ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUserName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingUser}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteUser}
              disabled={isDeletingUser}
            >
              {isDeletingUser ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUserName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={isUpdatingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={updateUserPassword}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Search Dialog */}
      <Dialog open={locationSearchOpen} onOpenChange={setLocationSearchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search Users by Location</DialogTitle>
            <DialogDescription>
              Find users within 200 meters of a specific location
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="location-search">Location</Label>
              <Input
                id="location-search"
                placeholder="Enter a location to search..."
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                ref={locationSearchInputRef}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationSearchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={searchUsersByLocation} disabled={isSearchingByLocation || !locationSearchQuery.trim()}>
              {isSearchingByLocation ? 'Searching...' : 'Search'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace the old message dialog with the new reusable component */}
      <MessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        users={users}
        onMessageSent={refreshAfterMessageSent}
      />
    </div>
  );
} 