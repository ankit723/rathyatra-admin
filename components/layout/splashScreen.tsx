// components/SplashScreen.tsx
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

// Define interface for particle type
interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  movePattern: number; // Add movement pattern property
  type: string; // 'circle', 'star', or 'dot'
  color: string; // CSS color class
}

const SplashScreen = () => {
  // State for particle positions with proper typing
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate random particles on component mount
  useEffect(() => {
    const particleTypes = ['circle', 'star', 'dot'];
    const colorClasses = ['bg-white', 'bg-violet-300', 'bg-pink-200', 'bg-indigo-200', 'bg-yellow-100'];
    
    const newParticles = Array.from({ length: 70 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      movePattern: Math.floor(Math.random() * 3),
      type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
      color: colorClasses[Math.floor(Math.random() * colorClasses.length)]
    }));
    
    setParticles(newParticles);
  }, []);

  // Function to get animation based on movement pattern
  const getParticleAnimation = (pattern: number) => {
    switch(pattern) {
      case 0:
        return { 
          y: [0, -30, 0],
          opacity: [0, 0.9, 0]
        }; // Simple up and down
      case 1: 
        return { 
          y: [0, -20, 0],
          x: [0, 15, 0, -15, 0],
          opacity: [0, 0.8, 0.6, 0.8, 0]
        }; // Wavy pattern
      case 2:
        return { 
          y: [0, -25, -10, -30, 0],
          rotate: [0, 45, 0, -45, 0],
          opacity: [0, 0.9, 0.7, 0.9, 0]
        }; // Complex pattern with rotation
      default:
        return { 
          y: [0, -30, 0],
          opacity: [0, 0.9, 0]
        };
    }
  };

  // Function to render different particle shapes
  const renderParticleShape = (type: string, color: string, size: number) => {
    switch(type) {
      case 'star':
        return (
          <div className={`${color} transform rotate-45`} style={{
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            width: `${size * 1.5}px`, 
            height: `${size * 1.5}px`
          }}></div>
        );
      case 'circle':
        return <div className={`${color} rounded-full w-full h-full`}></div>;
      case 'dot':
      default:
        return <div className={`${color} rounded-full w-full h-full`}></div>;
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Background with enhanced gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-violet-700 to-indigo-900" />
      
      {/* CSS-based mesh grid instead of image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), 
                            radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px, 50px 50px',
          backgroundPosition: '0 0, 10px 10px',
          opacity: 0.2
        }}
      />
      
      {/* Animated radial pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="w-[150vw] h-[150vw] rounded-full bg-gradient-to-r from-violet-500/10 to-transparent"
          animate={{ 
            scale: [1, 1.5],
            opacity: [0.1, 0],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-500/20 backdrop-blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, 180],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div 
          className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-pink-500/10 backdrop-blur-xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, -180],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Animated geometric shapes */}
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 rotate-45 bg-gradient-to-tr from-indigo-500/40 to-transparent backdrop-blur-sm"
          animate={{
            rotate: [45, 225, 45],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: '0 0 15px 3px rgba(99, 102, 241, 0.3)'
          }}
        />
        
        <motion.div
          className="absolute top-1/3 right-1/4 w-16 h-16 rotate-12 border-2 border-white/20 rounded-lg backdrop-blur-sm"
          animate={{
            rotate: [12, 372],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.2)'
          }}
        />
        
        {/* Additional geometric shape */}
        <motion.div
          className="absolute top-2/3 left-1/3 w-20 h-20 rounded-full bg-gradient-to-b from-pink-500/30 to-transparent backdrop-blur-sm"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            boxShadow: '0 0 15px 5px rgba(236, 72, 153, 0.2)'
          }}
        />
      </div>

      {/* Light streak effect */}
      <motion.div
        className="absolute -rotate-45 w-[500px] h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent top-1/3 -left-20"
        animate={{
          left: ["0%", "100%"],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />

      {/* Floating particles - placed after content to ensure they appear on top */}
      {particles.map((particle, index) => (
        <motion.div 
          key={index}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            boxShadow: particle.type === 'star' 
              ? '0 0 5px 2px rgba(255, 255, 255, 0.7)' 
              : particle.type === 'circle' 
                ? '0 0 4px 1px rgba(255, 255, 255, 0.6)'
                : '0 0 3px 1px rgba(255, 255, 255, 0.5)',
            zIndex: 50
          }}
          animate={getParticleAnimation(particle.movePattern)}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        >
          {renderParticleShape(particle.type, particle.color, particle.size)}
        </motion.div>
      ))}

      {/* Content Container */}
      <div className="h-full w-full flex items-center justify-center flex-col text-white relative z-10">
        {/* Logo with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, type: "spring" }}
          className="relative"
        >
          {/* Pulsing ring animation */}
          <motion.div 
            className="absolute -inset-6 rounded-full border-2 border-white/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -inset-10 rounded-full border border-white/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          {/* Clean logo container with no blur effects */}
          <div className="relative z-20">
            <Image
              src="/odisha-police-logo.png"
              alt="Puri Police"
              width={150}
              height={150}
              quality={100}
              priority={true}
              className="rounded-full border-4 border-white shadow-xl"
            />
          </div>
        </motion.div>

        {/* Text with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-10 text-center backdrop-blur-sm bg-black/5 p-6 rounded-xl border border-white/10"
        >
          <motion.h1 
            className="text-3xl md:text-4xl font-bold tracking-wide text-white drop-shadow-lg"
            animate={{ 
              textShadow: [
                "0 0 7px rgba(255,255,255,0.3)", 
                "0 0 10px rgba(255,255,255,0.5)", 
                "0 0 7px rgba(255,255,255,0.3)"
              ] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Puri District Police
          </motion.h1>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.3, duration: 1 }}
            className="h-1 bg-gradient-to-r from-violet-400 via-pink-500 to-purple-400 mx-auto mt-2 rounded-full max-w-xs"
          />
          
          <motion.p 
            className="mt-4 text-base md:text-lg text-white/90 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.8 }}
          >
            Protecting with Pride & Dedication
          </motion.p>
        </motion.div>

        {/* Enhanced Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="absolute bottom-16 flex gap-3"
        >
          <motion.div className="flex items-center gap-2">
            <motion.span 
              className="h-3 w-3 rounded-full bg-violet-400" 
              animate={{ scale: [1, 1.5, 1], boxShadow: ["0 0 0px rgba(167,139,250,0.5)", "0 0 8px rgba(167,139,250,0.8)", "0 0 0px rgba(167,139,250,0.5)"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.span 
              className="h-3 w-3 rounded-full bg-white" 
              animate={{ scale: [1, 1.5, 1], boxShadow: ["0 0 0px rgba(255,255,255,0.5)", "0 0 8px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0.5)"] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span 
              className="h-3 w-3 rounded-full bg-pink-500" 
              animate={{ scale: [1, 1.5, 1], boxShadow: ["0 0 0px rgba(236,72,153,0.5)", "0 0 8px rgba(236,72,153,0.8)", "0 0 0px rgba(236,72,153,0.5)"] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SplashScreen;
