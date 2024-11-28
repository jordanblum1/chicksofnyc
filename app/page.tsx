'use client';
import { useWingSpots } from "./hooks/useWingSpots";
import Image from "next/image";
import MenuBar from "./components/MenuBar";
import Modal from "./components/Modal";
import { formatNumber } from "./utils/formatNumber";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useCallback } from 'react';

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

interface SelectedSpot {
  name: string;
  address: string;
}

export default function Home() {
  const { spots: topSpots, loading, error } = useWingSpots('/api/get-top-wings');
  const [selectedSpot, setSelectedSpot] = useState<SelectedSpot | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
  };

  const handleCloseSpot = () => {
    setSelectedSpot(null);
    setPhotos([]);
  };

  useEffect(() => {
    async function fetchPhotos() {
      if (!selectedSpot) return;
      
      setLoadingPhotos(true);
      try {
        console.log('Fetching photos for:', selectedSpot);
        const response = await fetch(
          `/api/get-place-photos?name=${encodeURIComponent(selectedSpot.name)}&address=${encodeURIComponent(selectedSpot.address)}`
        );
        const data = await response.json();
        console.log('Photo response:', data);
        if (data.photos) {
          setPhotos(data.photos);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    }

    fetchPhotos();
  }, [selectedSpot]);

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

  const handleSpotClick = (spot: SelectedSpot) => {
    setSelectedSpot(spot);
    setPhotos([]); // Reset photos when selecting a new spot
  };

  const handlePhotoClick = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const handlePhotoNavigation = useCallback((direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === -1) return;
    
    let newIndex = selectedPhotoIndex;
    if (direction === 'prev') {
      newIndex = selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1;
    } else {
      newIndex = selectedPhotoIndex === photos.length - 1 ? 0 : selectedPhotoIndex + 1;
    }
    
    setSelectedPhotoIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  }, [selectedPhotoIndex, photos]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePhotoNavigation('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePhotoNavigation('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, handlePhotoNavigation]);

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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">#{index + 1} {spot.name}</h3>
                    <span className={`text-lg font-bold ${
                      spot.overallRanking < 5 ? 'text-red-500' : 
                      spot.overallRanking >= 8 ? 'text-green-500' : 
                      'text-yellow-500'
                    }`}>
                      {formatNumber(spot.overallRanking)}/10
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{spot.address}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faDroplet} 
                          className="text-red-500 w-4 h-4"
                          title="Sauce Rating"
                        />
                      </div>
                      <span className="text-xs text-gray-500">Sauce</span>
                      <span className="font-semibold">{formatNumber(spot.sauce)}/10</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faFire} 
                          className="text-orange-500 w-4 h-4"
                          title="Crispy-ness Rating"
                        />
                      </div>
                      <span className="text-xs text-gray-500">Crispy</span>
                      <span className="font-semibold">{formatNumber(spot.crispyness)}/10</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon 
                          icon={faDrumstickBite} 
                          className="text-[#8B4513] w-4 h-4"
                          title="Meat Rating"
                        />
                      </div>
                      <span className="text-xs text-gray-500">Meat</span>
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

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => {
          setSelectedPhoto(null);
          setSelectedPhotoIndex(-1);
        }}
        isPhotoModal={true}
      >
        <div className="p-4">
          <div className="relative max-h-[80vh] flex items-center justify-center">
            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoNavigation('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-opacity"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <img
              src={selectedPhoto || ''}
              alt={`Photo ${selectedPhotoIndex + 1} of ${photos.length}`}
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoNavigation('next');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-opacity"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Photo Counter and Full Size Button */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4">
              <span className="bg-white bg-opacity-80 px-3 py-1 rounded-md text-sm">
                {selectedPhotoIndex + 1} / {photos.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPhoto) {
                    window.open(selectedPhoto, '_blank');
                  }
                }}
                className="bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 px-3 py-1 rounded-md text-sm transition-opacity"
              >
                Open full size
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Spot Details Modal */}
      <Modal
        isOpen={!!selectedSpot}
        onClose={() => {
          setSelectedSpot(null);
          setPhotos([]);
        }}
      >
        {selectedSpot && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">{selectedSpot.name}</h2>
            <p className="text-gray-600 text-sm">{selectedSpot.address}</p>
            
            {/* Photos Section */}
            {loadingPhotos ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading photos...</div>
              </div>
            ) : photos.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => handlePhotoClick(photo, index)}
                    >
                      <img
                        src={photo}
                        alt={`${selectedSpot.name} photo ${index + 1}`}
                        className="object-cover w-full h-full group-hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/placeholder-image.jpg';
                          target.className = 'object-cover w-full h-full opacity-50';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                          View larger
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-gray-500 text-sm">
                No photos available for this location
              </div>
            )}

            {/* Google Maps iframe */}
            <div>
              <iframe
                width="100%"
                height="350"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(selectedSpot.name + ' ' + selectedSpot.address)}`}
              ></iframe>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
