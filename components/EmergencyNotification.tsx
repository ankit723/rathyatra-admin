"use client";

import { useEffect } from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Bell, ChevronRight, ChevronLeft, VolumeX, AlertTriangle, MapPin } from 'lucide-react';

const EmergencyNotification = () => {
  const { 
    emergencyUsers, 
    emergencySidebarOpen, 
    setEmergencySidebarOpen, 
    resolveEmergency,
    isResolvingEmergency,
    refreshEmergencies,
    audioEnabled,
    enableAudio,
    testPlaySound
  } = useEmergency();

  // Try to play test sound when the component mounts (silent)
  useEffect(() => {
    // Only try this if audio is already enabled and we have user interaction
    if (typeof window !== 'undefined' && window._emergencyAudioEnabled && window._emergencyHasInteracted) {
      // Just to make sure audio is initialized on this page
      const initAudio = async () => {
        try {
          console.log('Initializing audio on page load');
          // Try a silent sound (volume 0) just to make sure audio works on this page
          if (window._emergencyAudioElement) {
            const oldVolume = window._emergencyAudioElement.volume;
            window._emergencyAudioElement.volume = 0;
            
            try {
              await window._emergencyAudioElement.play();
              window._emergencyAudioElement.pause();
              window._emergencyAudioElement.currentTime = 0;
            } catch (e) {
              console.log('Silent audio test failed, this is expected if no user interaction yet');
            }
            
            window._emergencyAudioElement.volume = oldVolume;
          }
        } catch (err) {
          console.error('Error initializing audio:', err);
        }
      };
      
      initAudio();
    }
  }, []);

  // Handler for enabling audio
  const handleEnableAudio = async () => {
    try {
      // First try the enableAudio method
      const success = await enableAudio();
      
      // If that fails, try direct play as a test
      if (!success) {
        await testPlaySound();
      }
    } catch (error) {
      console.error('Failed to enable audio from sidebar:', error);
    }
  };

  // Handler for resolving emergency
  const handleResolveEmergency = async (userId: string) => {
    try {
      await resolveEmergency(userId);
      toast.success('Emergency has been resolved');
    } catch (error) {
      toast.error('Failed to resolve emergency. Please try again.');
    }
  };

  return (
    <>
      {/* Emergency Sidebar Toggle Button */}
      <div className={`fixed top-20 right-0 z-40 transition-transform duration-300 ${emergencySidebarOpen ? 'translate-x-[350px]' : 'translate-x-0'}`}>
        <div className="flex flex-col space-y-2">
          <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-r-none rounded-l-md h-12"
            onClick={() => setEmergencySidebarOpen(!emergencySidebarOpen)}
          >
            {emergencyUsers.length > 0 && (
              <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-red-600">
                {emergencyUsers.length}
              </span>
            )}
            <Bell className="h-5 w-5 mr-1" />
            {emergencySidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          
          {!audioEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none rounded-l-md bg-white hover:bg-gray-50"
              onClick={handleEnableAudio}
              title="Enable emergency sound alerts"
            >
              <VolumeX className="h-5 w-5 text-red-600" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Emergency Sidebar */}
      <div className={`fixed top-0 right-0 z-50 h-full w-[350px] bg-white shadow-lg border-l border-gray-200 transition-transform duration-300 ${emergencySidebarOpen ? 'transform-none' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 bg-red-50 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-bold text-lg text-red-700">Emergency Alerts</h3>
          </div>
          <div className="flex space-x-2">
            {!audioEnabled && (
              <Button
                variant="outline" 
                size="sm"
                className="h-8 bg-white hover:bg-gray-50"
                onClick={handleEnableAudio}
              >
                <VolumeX className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-xs">Enable Sound</span>
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setEmergencySidebarOpen(false)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-56px)]">
          {emergencyUsers.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground opacity-20 mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">No active emergency alerts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emergencyUsers.map(user => (
                <Card key={user._id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-red-700 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Emergency Alert
                        </h4>
                        <p className="text-sm text-gray-800 font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        {user.rank}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1 mt-3">
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span>Current: {user.currentLocation || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span>Assigned: {user.assignedLocation || 'Not Assigned'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone: </span>
                        <span>{user.phoneNumber}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mr-2 text-xs h-8 bg-white hover:bg-gray-50"
                        onClick={() => window.location.href = `/users/${user._id}`}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => handleResolveEmergency(user._id)}
                        disabled={isResolvingEmergency}
                      >
                        {isResolvingEmergency ? 'Resolving...' : 'Resolve Emergency'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmergencyNotification; 