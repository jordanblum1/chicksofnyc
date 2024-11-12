'use client';
import { useWingSpots } from "./hooks/useWingSpots";
import Image from "next/image";
import MenuBar from "./components/MenuBar";
import { formatNumber } from "./utils/formatNumber";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import { useEffect } from 'react';

// Add this type declaration at the top after imports
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

export default function Home() {
  const { spots: topSpots, loading, error } = useWingSpots('/api/get-top-wings');

  useEffect(() => {
    // Load Instagram embed script
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    // Process embeds when script loads
    script.onload = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    };

    // If script is already loaded, process embeds immediately
    if (window.instgrm) {
      window.instgrm.Embeds.process();
    }

    return () => {
      // Cleanup script when component unmounts
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ paddingTop: '64px' }}>
      <MenuBar />
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/chicks-of-nyc-logo.png"
          alt="NYC Chicks Logo"
          width={400}
          height={400}
          priority
        />
      </div>

      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Top Wing Spots</h2>
          {loading && <p className="text-center">Loading top spots...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {topSpots.length > 0 && (
            <div className="space-y-4">
              {topSpots.map((spot, index) => (
                <div 
                  key={spot.id}
                  className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">#{index + 1} {spot.name}</h3>
                    <span className={`text-lg font-bold ${
                      spot.overallRanking < 5 ? 'text-red-500' : 
                      spot.overallRanking >= 8 ? 'text-green-500' : 
                      'text-yellow-500'
                    }`}>
                      {formatNumber(spot.overallRanking)}/10
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{spot.address}</p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faDroplet} 
                          className="text-red-500 w-4 h-4"
                          title="Sauce Rating"
                        />
                        <span className="text-xs text-gray-500 font-medium">Sauce</span>
                      </div>
                      <span className="font-semibold">{formatNumber(spot.sauce)}/10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faFire} 
                          className="text-orange-500 w-4 h-4"
                          title="Crispy-ness Rating"
                        />
                        <span className="text-xs text-gray-500 font-medium">Crispy</span>
                      </div>
                      <span className="font-semibold">{formatNumber(spot.crispyness)}/10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faDrumstickBite} 
                          className="text-[#8B4513] w-4 h-4"
                          title="Meat Rating"
                        />
                        <span className="text-xs text-gray-500 font-medium">Meat</span>
                      </div>
                      <span className="font-semibold">{formatNumber(spot.meat)}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4 invisible">Spacer</h2>
          <blockquote 
            className="instagram-media h-full" 
            data-instgrm-permalink="https://www.instagram.com/chicksofnewyorkcity/"
            data-instgrm-version="14"
            style={{ 
              background: '#FFF',
              border: '0',
              borderRadius: '3px',
              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
              margin: '1px',
              maxWidth: '100%',
              minWidth: '326px',
              padding: '0',
              width: '99.375%',
              height: '93%'
            }}
          ></blockquote>
        </div>
      </div>

      <div className="w-full max-w-7xl mt-8">
        <iframe
          src="https://www.google.com/maps/d/u/0/embed?mid=13UCUpt_uJToGhcRjSQltSAbXV9zNDWg&ehbc=2E312F"
          width="640"
          height="480"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </main>
  );
}
