// Google Maps type declarations
interface GoogleMapsType {
  maps: {
    Map: any;
    DirectionsService: any;
    DirectionsRenderer: any;
    Geocoder: any;
    Marker: any;
    LatLng: any;
    LatLngBounds: any;
    Size: any;
    TravelMode: { DRIVING: string };
    event: { clearInstanceListeners: (instance: any) => void };
    places: { 
      Autocomplete: any;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsType;
    initMap: () => void;
    mapsScriptLoaded?: boolean;
    googleMapsInitialized?: boolean;
    waitForGoogleMaps?: (callback: () => void) => void;
  }
} 