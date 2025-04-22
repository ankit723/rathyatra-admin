"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rank: string;
  permanentAddress: string;
  currentAddress: string;
  phoneNumber: string;
  age: string;
  sex: string;
  assignedLocation: string;
}

// Define Google Maps typings
type GoogleMapsAutocomplete = any; // This is a temporary solution

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    rank: 'Inspector',
    permanentAddress: '',
    currentAddress: '',
    phoneNumber: '',
    age: '',
    sex: 'Male',
    assignedLocation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    // Required fields validation
    const requiredFields: (keyof UserFormData)[] = ['firstName', 'lastName', 'email', 'password', 'rank', 'phoneNumber'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`);
        return false;
      }
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Password validation (min 6 chars)
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    // Age validation
    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) <= 0)) {
      toast.error('Please enter a valid age');
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
        // Ensure phone number has +91 prefix
        phoneNumber: formData.phoneNumber.startsWith('+91') ? formData.phoneNumber : `+91${formData.phoneNumber}`,
        age: formData.age ? parseInt(formData.age) : undefined
      };
      
      // Call the register endpoint
      await api.post('/auth/register', userData);
      
      toast.success('User created successfully');
      router.push('/users');
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.response?.data?.message || 'Failed to create user. Please try again.');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Enter the details of the new user. Fields marked with * are required.
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
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rank">Rank *</Label>
                <Select
                  value={formData.rank}
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
              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="1"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sex">Gender</Label>
                <Select
                  value={formData.sex}
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <div className="flex">
                <div className="flex items-center justify-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground">
                  +91
                </div>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className="rounded-l-none"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="permanentAddress">Permanent Address</Label>
                <Input
                  id="permanentAddress"
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Input
                  id="currentAddress"
                  name="currentAddress"
                  value={formData.currentAddress}
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
                value={formData.assignedLocation}
                onChange={handleInputChange}
                placeholder="Search for a location"
                onFocus={initializeAutocomplete}
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/users')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 