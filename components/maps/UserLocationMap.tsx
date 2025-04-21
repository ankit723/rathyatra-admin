import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

// Use the types from the global type declaration
type GoogleMapsRef = {
  current: any;
}

interface UserLocationMapProps {
  userId: string;
  assignedLocation: string;
  currentLocation: string;
  refreshInterval?: number; // in milliseconds
}

interface LocationData {
  currentLocation: string;
  assignedLocation: string;
  atAssignedLocation: boolean;
}

// Helper function to wait for Google Maps to load
const waitForGoogleMaps = (callback: () => void) => {
  if ((window as any).google && (window as any).google.maps) {
    callback();
    return;
  }
  
  (window as any).waitForGoogleMaps = callback;
  
  // Check every 100ms if Google Maps has loaded
  const interval = setInterval(() => {
    if ((window as any).google && (window as any).google.maps) {
      clearInterval(interval);
      callback();
      delete (window as any).waitForGoogleMaps;
    }
  }, 100);
};

const UserLocationMap = ({
  userId,
  assignedLocation,
  currentLocation,
  refreshInterval = 15000, // default to 15 seconds
}: UserLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const assignedMarkerRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [currentLocationData, setCurrentLocationData] = useState<string>(currentLocation);
  const [assignedLocationData, setAssignedLocationData] = useState<string>(assignedLocation);
  const [atAssignedLocation, setAtAssignedLocation] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const calculateAndDisplayRoute = useCallback(() => {
    if (
      !(window as any).google || 
      !(window as any).google.maps || 
      !directionsServiceRef.current || 
      !directionsRendererRef.current || 
      !geocoderRef.current ||
      !googleMapRef.current
    ) {
      setError('Map services not initialized properly.');
      return;
    }
    
    // Clear any existing directions
    directionsRendererRef.current.setMap(null);
    assignedMarkerRef.current?.setMap(null);
    currentMarkerRef.current?.setMap(null);
    
    // Check if we have valid location data
    if (
      !assignedLocationData || 
      !currentLocationData ||
      assignedLocationData === 'Not Assigned' ||
      currentLocationData === 'Not Assigned' ||
      currentLocationData === 'Unknown'
    ) {
      setError('Cannot display route: Valid location data not available');
      // Center map on India
      googleMapRef.current?.setCenter({ lat: 20.5937, lng: 78.9629 });
      googleMapRef.current?.setZoom(5);
      return;
    }
    
    // Re-attach renderer to map
    directionsRendererRef.current.setMap(googleMapRef.current);
    assignedMarkerRef.current?.setMap(googleMapRef.current);
    currentMarkerRef.current?.setMap(googleMapRef.current);
    
    const geocodeLocation = (
      address: string, 
      callback: (location: any | null) => void
    ) => {
      geocoderRef.current?.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          callback(results[0].geometry.location);
        } else {
          console.error(`Geocode error for ${address}: ${status}`);
          callback(null);
        }
      });
    };
    
    // Geocode both locations
    geocodeLocation(assignedLocationData, (assignedLatLng) => {
      if (!assignedLatLng) {
        setError('Could not find assigned location on map');
        return;
      }
      
      // Set assigned location marker
      assignedMarkerRef.current?.setPosition(assignedLatLng);
      
      geocodeLocation(currentLocationData, (currentLatLng) => {
        if (!currentLatLng) {
          setError('Could not find current location on map');
          return;
        }
        
        // Set current location marker
        currentMarkerRef.current?.setPosition(currentLatLng);
        
        // Set bounds to include both points
        const bounds = new (window as any).google.maps.LatLngBounds();
        bounds.extend(assignedLatLng);
        bounds.extend(currentLatLng);
        googleMapRef.current?.fitBounds(bounds);
        
        // Calculate directions
        directionsServiceRef.current?.route(
          {
            origin: currentLatLng,
            destination: assignedLatLng,
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === 'OK' && result) {
              directionsRendererRef.current?.setDirections(result);
              
              // Extract distance and duration information
              const route = result.routes[0];
              if (route && route.legs.length > 0) {
                setDistance(route.legs[0].distance?.text || null);
                setDuration(route.legs[0].duration?.text || null);
              }
            } else {
              console.error(`Directions error: ${status}`);
              setError('Could not calculate route between locations');
              
              // Just show the markers without a route
              directionsRendererRef.current?.setMap(null);
              assignedMarkerRef.current?.setMap(googleMapRef.current);
              currentMarkerRef.current?.setMap(googleMapRef.current);
            }
          }
        );
      });
    });
  }, [assignedLocationData, currentLocationData, setDistance, setDuration, setError]);

  // Function to update locations from API
  const fetchLocations = useCallback(async () => {
    try {
      const response = await api.get<LocationData>(`/users/${userId}/locations`);
      setCurrentLocationData(response.data.currentLocation);
      setAssignedLocationData(response.data.assignedLocation);
      setAtAssignedLocation(response.data.atAssignedLocation);
      setLastUpdated(new Date());
      return response.data;
    } catch (err: any) {
      console.error('Error fetching locations:', err);
      return null;
    }
  }, [userId, setCurrentLocationData, setAssignedLocationData, setAtAssignedLocation, setLastUpdated]);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).google || !(window as any).google.maps) return;
    
    try {
      // Create map instance
      googleMapRef.current = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 20.5937, lng: 78.9629 }, // Default to center of India
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      
      // Initialize services
      directionsServiceRef.current = new (window as any).google.maps.DirectionsService();
      directionsRendererRef.current = new (window as any).google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      
      geocoderRef.current = new (window as any).google.maps.Geocoder();
      
      // Custom markers
      assignedMarkerRef.current = new (window as any).google.maps.Marker({
        map: googleMapRef.current,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new (window as any).google.maps.Size(40, 40)
        }
      });
      
      currentMarkerRef.current = new (window as any).google.maps.Marker({
        map: googleMapRef.current,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new (window as any).google.maps.Size(40, 40)
        }
      });
      
      setMapApiLoaded(true);
      setIsLoading(false);
      
      // Initialize after a short delay to ensure map is ready
      setTimeout(() => {
        fetchLocations().then(() => {
          calculateAndDisplayRoute();
        });
      }, 500);
      
    } catch (err: any) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map. Please try again.');
      setIsLoading(false);
    }
  }, [fetchLocations, calculateAndDisplayRoute]);

  // Load Google Maps script
  useEffect(() => {
    // If Maps API is already loaded, initialize the map
    if ((window as any).google && (window as any).google.maps) {
      initMap();
      (window as any).googleMapsInitialized = true;
      return;
    }
    
    // Check if there's already a Google Maps script tag in the document
    const existingScript = document.querySelector(
      `script[src^="https://maps.googleapis.com/maps/api/js"]`
    );
    
    if (existingScript) {
      // If a script already exists, wait for it to load
      waitForGoogleMaps(initMap);
      return;
    }
    
    // If script is already being loaded by another instance, wait for it
    if ((window as any).mapsScriptLoaded) {
      waitForGoogleMaps(initMap);
      return;
    }
    
    // Mark that we're loading the script to prevent duplicates
    (window as any).mapsScriptLoaded = true;
    
    // Global callback for Google Maps
    (window as any).initMap = () => {
      initMap();
      (window as any).googleMapsInitialized = true;
    };
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Failed to load Google Maps API');
      setIsLoading(false);
      (window as any).mapsScriptLoaded = false;
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up
      if (typeof (window as any).initMap === 'function' && (window as any).initMap === initMap) {
        // Don't remove the init function completely, just replace it with a no-op
        (window as any).initMap = () => {};
      }
    };
  }, [initMap]);
  
  // Update route when locations change
  useEffect(() => {
    if (googleMapRef.current && mapApiLoaded) {
      calculateAndDisplayRoute();
    }
  }, [assignedLocationData, currentLocationData, mapApiLoaded, calculateAndDisplayRoute]);
  
  // Set up refresh interval
  useEffect(() => {
    if (!mapApiLoaded) return;
    
    const intervalId = setInterval(async () => {
      const locations = await fetchLocations();
      if (locations && googleMapRef.current) {
        calculateAndDisplayRoute();
      }
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, mapApiLoaded, fetchLocations, calculateAndDisplayRoute]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div 
          id="map"
          ref={mapRef} 
          className="h-[400px] rounded-md border" 
          aria-label="Map showing user locations"
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-md">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
      
      {distance && duration && (
        <div className="bg-slate-50 p-3 rounded-md text-sm space-y-1">
          <p className="font-medium">Distance: <span className="text-muted-foreground">{distance}</span></p>
          <p className="font-medium">Estimated travel time: <span className="text-muted-foreground">{duration}</span></p>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                Assigned Location: {assignedLocationData}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                Current Location: {currentLocationData}
              </p>
            </div>
            <div>
              <Badge variant={atAssignedLocation ? "success" : "warning"} className="ml-2">
                {atAssignedLocation ? 'At Location' : 'Not At Location'}
              </Badge>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserLocationMap; 