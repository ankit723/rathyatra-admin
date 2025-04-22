"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Keep track of if audio is currently playing to prevent interruptions
let isCurrentlyPlaying = false;
let isInitializing = false;

// Global sound initialization component
// This ensures that we initialize sound system on all pages
const SoundManager = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize audio element once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized || isInitializing) return;
    
    const initAudio = async () => {
      try {
        isInitializing = true;
        console.log('SoundManager: Initializing audio system');
        
        // Clean up any existing audio element first
        if (window._emergencyAudioElement) {
          console.log('SoundManager: Cleaning up existing audio element');
          window._emergencyAudioElement.pause();
          window._emergencyAudioElement.src = '';
          try {
            window._emergencyAudioElement.remove();
          } catch (e) {
            console.warn('SoundManager: Could not remove element:', e);
          }
          window._emergencyAudioElement = null;
        }
        
        console.log('SoundManager: Creating fresh emergency audio element');
        
        // Create a new audio element with proper event listeners
        const audio = new Audio();
        
        // Set important properties before setting src to avoid issues
        audio.preload = 'auto';
        audio.volume = 0.8;
        
        // Add event listeners before setting src
        audio.addEventListener('play', () => {
          console.log('SoundManager: Emergency sound started playing');
          isCurrentlyPlaying = true;
        });
        
        audio.addEventListener('ended', () => {
          console.log('SoundManager: Emergency sound finished playing');
          isCurrentlyPlaying = false;
        });
        
        audio.addEventListener('pause', () => {
          console.log('SoundManager: Emergency sound paused');
          isCurrentlyPlaying = false;
        });
        
        audio.addEventListener('error', (e) => {
          console.error('SoundManager: Error with emergency sound:', e);
          isCurrentlyPlaying = false;
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log('SoundManager: Audio is ready to play completely through');
        });
        
        // Now set the source (this starts loading the audio file)
        audio.src = '/sounds/emergency-alert.mp3';
        
        // Wait for the audio to be loaded
        try {
          await new Promise((resolve, reject) => {
            const loadHandler = () => {
              console.log('SoundManager: Audio loaded successfully');
              audio.removeEventListener('loadeddata', loadHandler);
              audio.removeEventListener('error', errorHandler);
              resolve(null);
            };
            
            const errorHandler = (err: Event) => {
              console.error('SoundManager: Error loading audio:', err);
              audio.removeEventListener('loadeddata', loadHandler);
              audio.removeEventListener('error', errorHandler);
              reject(err);
            };
            
            audio.addEventListener('loadeddata', loadHandler, { once: true });
            audio.addEventListener('error', errorHandler, { once: true });
            
            // Force load
            audio.load();
            
            // Fallback resolve in case loadeddata doesn't fire
            setTimeout(() => {
              console.log('SoundManager: Fallback resolution after timeout');
              audio.removeEventListener('loadeddata', loadHandler);
              audio.removeEventListener('error', errorHandler);
              resolve(null);
            }, 3000);
          });
        } catch (loadErr) {
          console.warn('SoundManager: Load error, continuing anyway:', loadErr);
        }
        
        // Store in global state
        window._emergencyAudioElement = audio;
        
        // Define a patched play method for the global audio
        const originalPlay = audio.play;
        window._emergencyAudioElement.play = async function() {
          if (isCurrentlyPlaying) {
            console.log('SoundManager: Audio already playing, stopping first');
            this.pause();
            this.currentTime = 0;
          }
          
          try {
            console.log('SoundManager: Starting audio playback');
            this.currentTime = 0;
            return originalPlay.call(this);
          } catch (err) {
            console.error('SoundManager: Error in patched play method:', err);
            throw err;
          }
        };
        
        // Initialize or restore state variables
        window._emergencyPreviousCount = window._emergencyPreviousCount || 0;
        window._emergencyAudioEnabled = window._emergencyAudioEnabled || false;
        window._emergencyHasInteracted = window._emergencyHasInteracted || false;
        
        console.log('SoundManager: Audio initialization complete');
        
        // Test play silent audio (volume 0) to ensure it works
        try {
          const originalVolume = audio.volume;
          audio.volume = 0;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = originalVolume;
          console.log('SoundManager: Silent test playback successful');
        } catch (e) {
          console.log('SoundManager: Silent test failed (expected if no user interaction yet):', e);
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('SoundManager: Failed to initialize audio system:', err);
        toast.error('Audio system initialization failed. Some features may not work.');
      } finally {
        isInitializing = false;
      }
    };
    
    initAudio();
  }, [isInitialized]);
  
  // Setup interaction listeners in a separate effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set up interaction listeners
    const setInteracted = () => {
      console.log('SoundManager: User interaction detected');
      window._emergencyHasInteracted = true;
      
      // Try to pre-load audio once user interacts
      if (window._emergencyAudioElement) {
        try {
          // Just load the audio, don't play it
          console.log('SoundManager: Preloading audio after interaction');
          window._emergencyAudioElement.load();
        } catch (err) {
          console.warn('SoundManager: Error loading audio after interaction:', err);
        }
      }
    };
    
    // Log current state
    console.log('SoundManager: Current state:', {
      hasInteracted: window._emergencyHasInteracted,
      audioEnabled: window._emergencyAudioEnabled,
      audioElementExists: !!window._emergencyAudioElement,
      isInitialized
    });
    
    // Add global event listeners if not already interacted
    if (!window._emergencyHasInteracted) {
      console.log('SoundManager: Setting up interaction listeners');
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
  }, []); // Empty dependency array to keep it consistent between renders
  
  // No visible UI, this is just for initialization
  return null;
};

export default SoundManager; 