'use client';
import { useWingSpots } from "../hooks/useWingSpots";
import MenuBar from "../components/MenuBar";
import Modal from "../components/Modal";
import { formatNumber } from "../utils/formatNumber";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite, faStar } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useCallback } from 'react';
import Lottie from "lottie-react";
import wingAnimation from "../animations/wings.json";
import Image from 'next/image';

interface SelectedSpot {
  id: string;
  name: string;
  address: string;
}

export default function Rankings() {
  const { spots, loading, error } = useWingSpots('/api/get-all-wings');
  const [selectedSpot, setSelectedSpot] = useState<SelectedSpot | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);

  // Fetch photos when a spot is selected
  useEffect(() => {
    async function fetchPhotos() {
      if (!selectedSpot) return;
      
      setLoadingPhotos(true);
      try {
        const response = await fetch(
          `/api/get-place-photos?name=${encodeURIComponent(selectedSpot.name)}&address=${encodeURIComponent(selectedSpot.address)}`
        );
        const data = await response.json();
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

  // Add touch handling for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handlePhotoNavigation('next');
    } else if (isRightSwipe) {
      handlePhotoNavigation('prev');
    }
  };

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
    <div className="min-h-screen bg-[#FFF8EB] flex flex-col overflow-x-hidden">
      <MenuBar />
      <main className="flex-1 w-full px-4 sm:px-6 py-8" style={{ paddingTop: '84px' }}>
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 px-2">All Wing Rankings</h1>
          
          {loading && (
            <div className="text-center py-8">
              <p>Loading rankings...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
            </div>
          )}

          {/* Mobile View (Cards) */}
          <div className="lg:hidden space-y-4 px-2">
            {spots.map((spot, index) => (
              <div 
                key={spot.id}
                className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedSpot(spot)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold shrink-0">#{index + 1}</span>
                      <h3 className="text-lg font-semibold truncate">{spot.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 truncate">{spot.address}</p>
                  </div>
                  <div className={`flex items-center gap-2 ml-4 shrink-0 ${
                    spot.overallRanking < 5 ? 'text-red-500' : 
                    spot.overallRanking >= 8 ? 'text-green-500' : 
                    'text-yellow-500'
                  }`}>
                    <FontAwesomeIcon 
                      icon={faStar} 
                      className="w-4 h-4"
                    />
                    <span className="font-bold whitespace-nowrap">{formatNumber(spot.overallRanking)}/10</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex flex-col items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faDroplet} 
                      className="text-red-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Sauce</span>
                    <span className="font-semibold">{formatNumber(spot.sauce)}/10</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faFire} 
                      className="text-orange-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Crispy</span>
                    <span className="font-semibold">{formatNumber(spot.crispyness)}/10</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faDrumstickBite} 
                      className="text-[#8B4513] w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Meat</span>
                    <span className="font-semibold">{formatNumber(spot.meat)}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#5D4037] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left w-16">Rank</th>
                    <th className="px-6 py-4 text-left">Spot Name</th>
                    <th className="px-6 py-4 text-left">Address</th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-500 w-4 h-4" />
                        <span>Overall</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDroplet} className="text-red-500 w-4 h-4" />
                        <span>Sauce</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faFire} className="text-orange-500 w-4 h-4" />
                        <span>Crispy</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDrumstickBite} className="text-[#8B4513] w-4 h-4" />
                        <span>Meat</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((spot, index) => (
                    <tr 
                      key={spot.id}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedSpot(spot)}
                    >
                      <td className="px-6 py-4 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 font-medium">{spot.name}</td>
                      <td className="px-6 py-4 text-gray-600">{spot.address}</td>
                      <td className={`px-6 py-4 text-center font-bold ${
                        spot.overallRanking < 5 ? 'text-red-500' : 
                        spot.overallRanking >= 8 ? 'text-green-500' : 
                        'text-yellow-500'
                      }`}>
                        {formatNumber(spot.overallRanking)}/10
                      </td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.sauce)}/10</td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.crispyness)}/10</td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.meat)}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Spot Details Modal */}
      <Modal
        isOpen={!!selectedSpot}
        onClose={() => {
          setSelectedSpot(null);
          setPhotos([]);
        }}
      >
        {selectedSpot && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 animate-fade-in">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-deep-orange-500 to-deep-orange-400 bg-clip-text text-transparent">
                {selectedSpot.name}
              </h2>
              <div className="animate-wing-flap">
                🍗
              </div>
            </div>
            <p className="text-gray-600 text-sm flex items-center animate-fade-in">
              <svg className="w-4 h-4 mr-1 text-deep-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {selectedSpot.address}
            </p>

            {/* Photos Section */}
            {loadingPhotos ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-24 h-24">
                  <Lottie animationData={wingAnimation} loop={true} />
                </div>
              </div>
            ) : photos.length > 0 ? (
              <div className="animate-slide-in-right">
                <h3 className="text-lg font-semibold mb-3 text-deep-orange-500 flex items-center gap-2">
                  Photos
                  <span className="animate-wing-flap text-sm">🍗</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-w-16 aspect-h-9 group cursor-pointer 
                               overflow-hidden rounded-lg border-4 border-deep-orange-100 
                               hover:border-deep-orange-300 transition-all duration-300
                               shadow-md hover:shadow-xl animate-border-pulse
                               md:aspect-w-4 md:aspect-h-3"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setSelectedPhotoIndex(index);
                      }}
                    >
                      <img
                        src={photo}
                        alt={`${selectedSpot.name} photo ${index + 1}`}
                        className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Google Maps iframe */}
            <div className="rounded-lg overflow-hidden border-4 border-deep-orange-100 shadow-lg animate-fade-in hover:border-deep-orange-200 transition-colors duration-300">
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

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => {
          setSelectedPhoto(null);
          setSelectedPhotoIndex(-1);
        }}
        isPhotoModal={true}
      >
        <div className="p-2 md:p-0">
          <div className="relative flex items-center justify-center min-h-[50vh] md:min-h-[75vh]">
            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoNavigation('prev');
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-opacity hidden md:block z-10"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <img
              src={selectedPhoto || ''}
              alt="Large view"
              className="max-w-full h-auto max-h-[75vh] object-contain rounded-lg"
            />

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePhotoNavigation('next');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-opacity hidden md:block z-10"
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
    </div>
  );
} 
