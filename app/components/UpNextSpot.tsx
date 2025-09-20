'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFootball, faLocationDot, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import logger from '../utils/logger';

interface UpNextSpotData {
  id?: string;
  name: string;
  address: string;
}

interface UpNextSpotProps {
  onSpotClick: (spot: any) => void;
  allSpots: any[];
}

export default function UpNextSpot({ onSpotClick, allSpots }: UpNextSpotProps) {
  const [upNextSpot, setUpNextSpot] = useState<UpNextSpotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetchUpNextSpot();
  }, []);

  const fetchUpNextSpot = async () => {
    try {
      const response = await fetch('/api/admin/up-next');
      if (response.ok) {
        const data = await response.json();
        if (data.spot) {
          setUpNextSpot(data.spot);
        }
      }
    } catch (error) {
      logger.error('APP', 'Error fetching up next spot:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !upNextSpot) {
    return null; // Don't show anything if no spot is set
  }

  // Find the full spot data from allSpots - try multiple matching strategies
  const fullSpotData = allSpots.find(spot => {
    // First try to match by ID if available
    if (upNextSpot.id && spot.id === upNextSpot.id) {
      return true;
    }
    // Then try exact name and address match
    if (spot.name === upNextSpot.name && spot.address === upNextSpot.address) {
      return true;
    }
    // Try case-insensitive name match
    if (spot.name?.toLowerCase() === upNextSpot.name?.toLowerCase()) {
      return true;
    }
    // Try partial address match (in case formatting differs)
    if (spot.name === upNextSpot.name && 
        (spot.address?.includes(upNextSpot.address) || 
         upNextSpot.address?.includes(spot.address))) {
      return true;
    }
    return false;
  });

  const handleClick = () => {
    logger.info('APP', 'UpNext clicked', { upNextSpot, fullSpotData });
    
    if (fullSpotData) {
      onSpotClick(fullSpotData);
    } else {
      // Fallback: create a minimal spot object if no match found
      logger.warn('APP', 'No matching spot found, using fallback', upNextSpot);
      onSpotClick({
        ...upNextSpot,
        id: upNextSpot.id || `up-next-${Date.now()}`,
        overallRanking: 0,
        sauce: 0,
        crispyness: 0,
        meat: 0,
        isUpNext: true  // Flag to identify this is from Up Next
      });
    }
  };

  return (
    <div 
      className="card overflow-hidden cursor-pointer transition-all duration-500 ease-out slide-up"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: 'linear-gradient(135deg, #1e6b1e 0%, #2a8f2a 50%, #228B22 100%)',
        position: 'relative',
        transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.35)' 
          : '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 animate-gradient-shift"
        style={{
          background: 'linear-gradient(270deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        }}
      />

      {/* Field background with modern animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Yard lines with subtle pulse */}
        <div className="absolute inset-0 animate-subtle-pulse" style={{ opacity: 0.25 }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/80"
              style={{
                width: '1.5px',
                height: '100%',
                left: `${20 + i * 15}%`,
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
              }}
            />
          ))}
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 bg-white/80" 
               style={{ height: '1.5px', boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)' }} />
        </div>

        {/* Modern goal posts with breathing effect - proper field goal fork shape */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 animate-breathe">
          <div className="relative w-10 h-16">
            {/* Horizontal crossbar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-300 to-yellow-500 h-1 rounded-full" 
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
            {/* Left upright extending upward */}
            <div className="absolute bottom-0 left-0 bg-gradient-to-t from-yellow-500 to-yellow-300 w-1 h-full rounded-full" 
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
            {/* Right upright extending upward */}
            <div className="absolute bottom-0 right-0 bg-gradient-to-t from-yellow-500 to-yellow-300 w-1 h-full rounded-full" 
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-breathe" style={{ animationDelay: '1s' }}>
          <div className="relative w-10 h-16">
            {/* Horizontal crossbar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-300 to-yellow-500 h-1 rounded-full"
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
            {/* Left upright extending upward */}
            <div className="absolute bottom-0 left-0 bg-gradient-to-t from-yellow-500 to-yellow-300 w-1 h-full rounded-full"
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
            {/* Right upright extending upward */}
            <div className="absolute bottom-0 right-0 bg-gradient-to-t from-yellow-500 to-yellow-300 w-1 h-full rounded-full"
                 style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }} />
          </div>
        </div>

        {/* Floating footballs with smooth rotation */}
        <div className="absolute top-6 left-12 animate-float opacity-20">
          <FontAwesomeIcon icon={faFootball} className="text-white/80 text-xl animate-gentle-spin" />
        </div>
        <div className="absolute bottom-6 right-12 animate-float-delayed opacity-20">
          <FontAwesomeIcon icon={faFootball} className="text-white/80 text-xl animate-gentle-spin-reverse" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header with modern design */}
        <div className="text-center mb-6">
          <div className="inline-block animate-fade-in-down">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-5 py-1.5 rounded-t-lg font-bold text-xs tracking-wider shadow-lg">
              SUNDAY WING WATCH
            </div>
            <div className="bg-white/95 backdrop-blur-md text-gray-900 px-8 py-3 rounded-b-lg shadow-xl">
              <div className="flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faFootball} className="text-orange-500 animate-pulse-scale" />
                <span className="font-bold text-sm tracking-wide">GAME DAY SPECIAL</span>
                <FontAwesomeIcon icon={faFootball} className="text-orange-500 animate-pulse-scale" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main matchup display with glow effect */}
        <div className="text-center animate-fade-in">
          <div className="text-white/90 text-sm font-semibold mb-3 tracking-wider animate-subtle-glow">
            YOUR TASTE BUDS
          </div>
          <div className="text-yellow-400 text-3xl font-black my-3 animate-vs-pulse"
               style={{ textShadow: '0 0 30px rgba(255, 215, 0, 0.5)' }}>
            VS
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/25 shadow-2xl
                          transition-all duration-300 hover:bg-white/20">
            <h3 className="text-white text-2xl font-black mb-3 tracking-tight">
              {upNextSpot.name.toUpperCase()}
            </h3>
            <div className="flex items-center justify-center gap-2 text-white/95 text-sm">
              <FontAwesomeIcon icon={faLocationDot} className="text-yellow-400 animate-subtle-bounce" />
              <span className="font-medium">{upNextSpot.address}</span>
            </div>
          </div>
        </div>

        {/* Modern call to action */}
        <div className="text-center mt-5">
          <div className="inline-flex items-center gap-2 text-white/90 text-sm font-medium tracking-wide
                          bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm
                          transition-all duration-300 hover:bg-white/20">
            <span>VIEW SCOUTING REPORT</span>
            <FontAwesomeIcon icon={faArrowRight} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
          </div>
        </div>

        {/* Smooth flying football */}
        <div className="absolute top-1/2 -translate-y-1/2 animate-smooth-fly opacity-40 pointer-events-none">
          <FontAwesomeIcon icon={faFootball} className="text-yellow-300 text-2xl" 
                           style={{ filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(5deg); }
          50% { transform: translateY(-12px) rotate(-5deg); }
        }
        
        @keyframes gentle-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes gentle-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes smooth-fly {
          0% { 
            left: -60px;
            transform: translateY(-50%) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.4;
            transform: translateY(-50%) rotate(90deg);
          }
          50% {
            transform: translateY(-50%) rotate(180deg);
          }
          85% {
            opacity: 0.4;
            transform: translateY(-50%) rotate(270deg);
          }
          100% { 
            left: calc(100% + 60px);
            transform: translateY(-50%) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes gradient-shift {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes subtle-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.35; }
        }
        
        @keyframes vs-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes subtle-glow {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-breathe {
          animation: breathe 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-float {
          animation: float 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 7s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 1.5s;
        }
        
        .animate-gentle-spin {
          animation: gentle-spin 20s linear infinite;
        }
        
        .animate-gentle-spin-reverse {
          animation: gentle-spin-reverse 25s linear infinite;
        }
        
        .animate-smooth-fly {
          animation: smooth-fly 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 3s ease-in-out infinite;
        }
        
        .animate-subtle-pulse {
          animation: subtle-pulse 4s ease-in-out infinite;
        }
        
        .animate-vs-pulse {
          animation: vs-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-scale {
          animation: pulse-scale 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-subtle-glow {
          animation: subtle-glow 3s ease-in-out infinite;
        }
        
        .animate-subtle-bounce {
          animation: subtle-bounce 2s ease-in-out infinite;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.6s cubic-bezier(0.4, 0, 0.6, 1);
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.6, 1);
          animation-delay: 0.2s;
          animation-fill-mode: backwards;
        }
      `}</style>
    </div>
  );
}
