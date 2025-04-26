"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/axios';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Clock,
  Shield,
  Edit,
  Check,
  X,
  Loader2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  rank: string;
  phoneNumber: string;
  currentLocation: string;
  assignedLocation: string;
  atAssignedLocation: boolean;
  assignedGeoFenceRadius: number;
  emergencyAlarm: boolean;
  createdAt: string;
  updatedAt: string;
  sex: string;
  age: number;
  permanentAddress?: string;
  currentAddress?: string;
}

// Dynamically import the map component to ensure it only loads client-side
const UserLocationMap = dynamic(() => import('@/components/maps/UserLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">Loading map...</p>
    </div>
  ),
});

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  
  // Define Google Maps typings
  type GoogleMapsAutocomplete = any; // This is a temporary solution
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<{ user: User }>(`/users/${userId}`);
      setUser(response.data.user);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
      toast.error('Failed to load user details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, setIsLoading, setError, setUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Close suggestions when the dialog is closed
  useEffect(() => {
    if (!locationDialogOpen) {
      if (autocompleteRef.current && (window as any).google && (window as any).google.maps) {
        (window as any).google.maps.event.clearInstanceListeners(inputRef.current);
        autocompleteRef.current = null;
      }
      
      // Remove any existing pac-container that might be stuck
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        container.remove();
      });
    }
  }, [locationDialogOpen]);

  // Initialize Google Places Autocomplete when input is focused
  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    // Create a global click handler for suggestions
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click was on a pac-item
      if (target.classList.contains('pac-item') || target.closest('.pac-item')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the pac-item that was clicked
        const item = target.classList.contains('pac-item') ? target : target.closest('.pac-item');
        if (!item) return;
        
        // Extract the text
        const mainText = item.querySelector('.pac-item-query')?.textContent || '';
        const secondaryText = item.querySelector('.pac-secondary-text')?.textContent || '';
        const fullAddress = mainText + (secondaryText ? ', ' + secondaryText : '');
        
        if (fullAddress && inputRef.current) {
          // Set the input value and update state
          inputRef.current.value = fullAddress;
          setNewLocation(fullAddress);
          
          // Hide the dropdown
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            (pacContainer as HTMLElement).style.display = 'none';
          }
        }
      }
    };
    
    // Add the global click handler
    document.addEventListener('click', handleGlobalClick, true);
    
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
        
        // Add place_changed event listener for keyboard selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            setNewLocation(place.formatted_address);
          }
        });

        // Prevent the dialog from closing when clicking in the pac-container
        document.querySelectorAll('.pac-container').forEach(container => {
          container.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          });
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
    
    // Return a cleanup function
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
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
      await api.put(`/users/${userId}/assigned-location`, { 
        assignedLocation: newLocation
      });
      
      toast.success('User location updated successfully');
      setLocationDialogOpen(false);
      fetchUser(); // Refresh the user data
      cleanup(); // Clean up autocomplete after successful update
    } catch (err: any) {
      console.error('Error updating location:', err);
      toast.error('Failed to update location. Please try again.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
        <Skeleton className="h-[200px] rounded-lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading User</h2>
        <p className="text-muted-foreground mb-6">{error || 'User not found'}</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={fetchUser}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const getFullName = () => `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{getFullName()}</h1>
          <p className="text-muted-foreground">{user.rank}</p>
        </div>
        <div className="ml-auto">
          <Link href={`/users/${userId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic user details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[24px_1fr] items-start gap-x-4 gap-y-3">
              <User className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Full Name</p>
                <p className="text-sm text-muted-foreground">{getFullName()}</p>
              </div>

              <Shield className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Rank</p>
                <p className="text-sm text-muted-foreground">{user.rank}</p>
              </div>

              <Phone className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">{user.phoneNumber || 'Not provided'}</p>
              </div>

              <Calendar className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Age & Gender</p>
                <p className="text-sm text-muted-foreground">{user.age} years, {user.sex}</p>
              </div>

              <Clock className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
            <CardDescription>User location tracking and assignments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[24px_1fr] items-center gap-x-4 gap-y-3">
              <Circle className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Assigned Geo Fence Radius</p>
                <p className="text-sm text-muted-foreground">{user.assignedGeoFenceRadius} meters</p>
              </div>
              <MapPin className="text-muted-foreground" />
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Assigned Location</p>
                  <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
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
                            onFocus={initializeAutocomplete}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setLocationDialogOpen(false)}
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
                </div>
                <p className="text-sm text-muted-foreground">{user.assignedLocation || 'Not Assigned'}</p>
              </div>

              <MapPin className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Current Location</p>
                <p className="text-sm text-muted-foreground">{user.currentLocation || 'Unknown'}</p>
              </div>

              {user.atAssignedLocation ? (
                <Check className="text-green-500" />
              ) : (
                <X className="text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium">Location Status</p>
                {user.atAssignedLocation ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    At Assigned Location
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Not At Assigned Location
                  </Badge>
                )}
              </div>

              {user.emergencyAlarm ? (
                <AlertTriangle className="text-red-500" />
              ) : (
                <Check className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Emergency Status</p>
                {user.emergencyAlarm ? (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Emergency Alarm Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    No Emergency
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>
            Visual representation of assigned and current locations with directions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <UserLocationMap 
              userId={user._id}
              assignedLocation={user.assignedLocation}
              currentLocation={user.currentLocation}
              refreshInterval={15000} // 15 seconds
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
          <CardDescription>Permanent and current address details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Permanent Address</h3>
              <p className="text-sm text-muted-foreground border rounded-md p-3">
                {user.permanentAddress || 'No permanent address provided'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Current Address</h3>
              <p className="text-sm text-muted-foreground border rounded-md p-3">
                {user.currentAddress || 'No current address provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 