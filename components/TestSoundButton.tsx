"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { useEmergency } from '@/contexts/EmergencyContext';

const TestSoundButton = () => {
  const [isTesting, setIsTesting] = useState(false);
  const { audioEnabled, enableAudio, testPlaySound } = useEmergency();

  const testSound = async () => {
    setIsTesting(true);
    
    try {
      console.log('TestSoundButton: Testing emergency sound');
      
      // First make sure we enable audio for the context
      if (!audioEnabled || (typeof window !== 'undefined' && !window._emergencyAudioEnabled)) {
        console.log('TestSoundButton: Enabling audio first');
        await enableAudio();
        
        // Set global flag to ensure it's accessible across components
        if (typeof window !== 'undefined') {
          window._emergencyAudioEnabled = true;
          window._emergencyHasInteracted = true;
        }
      }
      
      // Then try to play the test sound
      console.log('TestSoundButton: Playing test sound');
      const directPlaySuccess = await testPlaySound();
      
      if (directPlaySuccess) {
        console.log('TestSoundButton: Sound played successfully');
        toast.success('Sound is working! Emergency alerts will now play audio notifications.');
      } else {
        console.log('TestSoundButton: Sound playback failed, trying direct method');
        
        // Try a more direct method as fallback
        if (typeof window !== 'undefined' && window._emergencyAudioElement) {
          const audio = window._emergencyAudioElement;
          
          // Make sure it's in right state
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.8;
          
          // Direct play
          await audio.play();
          toast.success('Sound is working! Emergency alerts will now play audio notifications.');
          
          // Ensure flags are set
          window._emergencyAudioEnabled = true;
          window._emergencyHasInteracted = true;
        } else {
          // Last resort - create new audio
          const tempAudio = new Audio('/sounds/emergency-alert.mp3');
          tempAudio.volume = 0.8;
          await tempAudio.play();
          toast.success('Sound is working! Emergency alerts will now play audio notifications.');
          
          // Set flags
          if (typeof window !== 'undefined') {
            window._emergencyAudioEnabled = true;
            window._emergencyHasInteracted = true;
          }
        }
      }
    } catch (err) {
      console.error('TestSoundButton: Error testing sound:', err);
      toast.error(
        'Browser blocked audio playback. Please check your browser settings.', 
        { duration: 5000 }
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={testSound}
      disabled={isTesting}
      className="flex items-center gap-1.5"
    >
      {audioEnabled ? (
        <Volume2 className="h-4 w-4 text-green-600" />
      ) : (
        <VolumeX className="h-4 w-4 text-muted-foreground" />
      )}
      {isTesting ? 'Playing...' : 'Test Emergency Sound'}
    </Button>
  );
};

export default TestSoundButton; 