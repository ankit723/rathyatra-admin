"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/layout/splashScreen.";
import SoundManager from "@/lib/SoundManager";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a splash screen delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000); // show for 2 seconds

    return () => clearTimeout(timer);
  }, []);
  // Global click handler to clean up any stray Google Places suggestions boxes
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Check if the click was inside a modal dialog
      const isInDialog = (e.target as HTMLElement).closest('[role="dialog"]');
      
      // Only proceed with cleanup for clicks outside dialogs
      if (!isInDialog) {
        // Get all autocomplete dropdown containers
        const pacContainers = document.querySelectorAll('.pac-container');
        
        // If we clicked outside any pac-container or pac-item
        if (pacContainers.length > 0) {
          const target = e.target as HTMLElement;
          
          // Check if the click was on or inside pac-container or pac-item
          const clickedInsidePac = target.classList.contains('pac-container') || 
                                   target.closest('.pac-container') ||
                                   target.classList.contains('pac-item') || 
                                   target.closest('.pac-item');
          
          // Check if the click was on an input element (to keep suggestions open)
          const clickedOnInput = target.tagName.toLowerCase() === 'input';
          
          // If clicked outside both pac elements and input, remove the containers
          if (!clickedInsidePac && !clickedOnInput) {
            pacContainers.forEach(container => {
              (container as HTMLElement).style.display = 'none';
              setTimeout(() => {
                container.remove();
              }, 100);
            });
          }
        }
      }
    };

    // Add the event listener
    document.addEventListener('click', handleDocumentClick);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {loading ? (
          <SplashScreen />
        ) : (
          <Providers>
            <SoundManager />
            <Layout>{children}</Layout>
            <Toaster position="top-right" />
          </Providers>
        )}
      </body>
    </html>
  );
}
