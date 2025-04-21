"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  permanentAddress: string;
  currentAddress: string;
  phoneNumber: string;
  currentLocation: string;
  assignedLocation: string;
  age: number;
  sex: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define Google Maps typings
  type GoogleMapsAutocomplete = any; // This is a temporary solution
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({});

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get<{ user: User }>(`/users/${userId}`);
      // Initialize form with user data
      setFormData({
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        email: response.data.user.email,
        rank: response.data.user.rank,
        permanentAddress: response.data.user.permanentAddress,
        currentAddress: response.data.user.currentAddress,
        phoneNumber: response.data.user.phoneNumber,
        assignedLocation: response.data.user.assignedLocation,
        age: response.data.user.age,
        sex: response.data.user.sex,
      });
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
      toast.error('Failed to load user details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: keyof User, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    // Required fields validation
    const requiredFields = ['firstName', 'lastName', 'email', 'rank', 'phoneNumber'];
    for (const field of requiredFields) {
      if (!formData[field as keyof User]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
        return false;
      }
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const userData = {
        ...formData,
        // Ensure age is a number
        age: formData.age ? Number(formData.age) : undefined
      };
      
      // Update user data using PUT /users/:id
      await api.put(`/users/${userId}`, userData);
      
      // Also update assigned location if it has changed
      if (formData.assignedLocation) {
        await api.put(`/users/${userId}/assigned-location`, { 
          assignedLocation: formData.assignedLocation 
        });
      }
      
      toast.success('User updated successfully');
      router.push(`/users/${userId}`);
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize Google Places Autocomplete when input is focused
  const initializeAutocomplete = () => {
    if (!locationInputRef.current) return;
    
    const checkAndInitAutocomplete = () => {
      // First check if Google Maps is already available
      if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        // Clear any existing autocomplete
        if (locationInputRef.current) {
          (window as any).google.maps.event.clearInstanceListeners(locationInputRef.current);
        }
        
        // Create new autocomplete instance
        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['geocode', 'establishment']
        });
        
        // Handle mouse selection issues
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          // Prevent closing of dialog when clicking on suggestions
          pacContainer.addEventListener('mousedown', (e) => {
            e.preventDefault();
          });
        }
        
        // Add place_changed event listener
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.formatted_address) {
            setFormData(prev => ({
              ...prev,
              assignedLocation: place.formatted_address
            }));
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">Update user information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Update the details of this user. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rank">Rank *</Label>
                <Select
                  value={formData.rank || 'Inspector'}
                  onValueChange={(value) => handleSelectChange('rank', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Director General of Police (DGP)">Director General of Police (DGP)</SelectItem>
                    <SelectItem value="Additional Director General of Police (ADGP)">Additional Director General of Police (ADGP)</SelectItem>
                    <SelectItem value="Inspector General of Police (IGP)">Inspector General of Police (IGP)</SelectItem>
                    <SelectItem value="Deputy Inspector General of Police (DIG)">Deputy Inspector General of Police (DIG)</SelectItem>
                    <SelectItem value="Senior Superintendent of Police (SSP)">Senior Superintendent of Police (SSP)</SelectItem>
                    <SelectItem value="Superintendent of Police (SP)">Superintendent of Police (SP)</SelectItem>
                    <SelectItem value="Additional Superintendent of Police (ASP)">Additional Superintendent of Police (ASP)</SelectItem>
                    <SelectItem value="Deputy Superintendent of Police (DSP)">Deputy Superintendent of Police (DSP)</SelectItem>
                    <SelectItem value="Assistant Commissioner of Police (ACP)">Assistant Commissioner of Police (ACP)</SelectItem>
                    <SelectItem value="Inspector">Inspector</SelectItem>
                    <SelectItem value="Sub-Inspector (SI)">Sub-Inspector (SI)</SelectItem>
                    <SelectItem value="Assistant Sub-Inspector (ASI)">Assistant Sub-Inspector (ASI)</SelectItem>
                    <SelectItem value="Head Constable">Head Constable</SelectItem>
                    <SelectItem value="Constable">Constable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  value={formData.age || ''}
                  onChange={handleInputChange}
                  placeholder="30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sex">Gender</Label>
                <Select
                  value={formData.sex || 'Male'}
                  onValueChange={(value) => handleSelectChange('sex', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Input
                  id="permanentAddress"
                  name="permanentAddress"
                  value={formData.permanentAddress || ''}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Input
                  id="currentAddress"
                  name="currentAddress"
                  value={formData.currentAddress || ''}
                  onChange={handleInputChange}
                  placeholder="456 Park Ave, City, Country"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignedLocation">Assigned Location</Label>
              <Input
                id="assignedLocation"
                name="assignedLocation"
                ref={locationInputRef}
                value={formData.assignedLocation || ''}
                onChange={handleInputChange}
                placeholder="Search for a location"
                onFocus={initializeAutocomplete}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/users/${userId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 