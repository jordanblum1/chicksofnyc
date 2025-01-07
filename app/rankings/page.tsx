'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useWingSpots } from "../hooks/useWingSpots";
import MenuBar from "../components/MenuBar";
import Modal from "../components/Modal";
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from "../utils/formatNumber";
import dynamic from 'next/dynamic';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import type { Settings } from 'react-slick';
import Slider from 'react-slick';
import { useSwipeable } from 'react-swipeable';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import wingAnimation from '../animations/wings.json';

interface WingSpot {
  id: string;
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
  instagram?: string;
}

interface SelectedSpot {
  id: string;
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
  instagram?: string;
}

export default function RankingsPage() {
  const { spots, loading, error } = useWingSpots<WingSpot>('/api/get-all-wings');
  const [selectedSpot, setSelectedSpot] = useState<SelectedSpot | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const sliderRef = useRef<Slider>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto || !sliderRef.current) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sliderRef.current.slickPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sliderRef.current.slickNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  const sliderSettings: Settings = {
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    arrows: true,
    afterChange: (current) => {
      setSelectedPhotoIndex(current);
      setSelectedPhoto(photos[current]);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => sliderRef.current?.slickNext(),
    onSwipedRight: () => sliderRef.current?.slickPrev(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const handleClosePhoto = useCallback(() => {
    setSelectedPhoto(null);
    setSelectedPhotoIndex(-1);
  }, []);

  const handlePhotoClick = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

  const handleCloseSpot = () => {
    setSelectedSpot(null);
    setPhotos([]);
  };

  const handleSpotClick = async (spot: SelectedSpot) => {
    setSelectedSpot(spot);
    setPhotos([]); // Reset photos when selecting a new spot
    setLoadingPhotos(true);

    try {
      const response = await fetch(
        `/api/get-place-photos?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`
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
  };

  return (
    <div className="page-container">
      <MenuBar />
      <div className="content-container fade-in">
        <section className="card page-header p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white font-heading">All Wing Rankings</h1>
            <p className="text-white/90 mt-2 text-lg">Every wing spot we've tried, ranked by sauce, crispiness, and meat quality</p>
          </div>
        </section>
        
        {loading && (
          <div className="card p-8 text-center">
            <p>Loading rankings...</p>
          </div>
        )}
        {error && (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="card overflow-hidden">
            {/* Desktop View */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/90 border-b">
                    <th className="px-6 py-4 text-left font-heading text-lg text-primary">Rank</th>
                    <th className="px-6 py-4 text-left font-heading text-lg text-primary">Spot</th>
                    <th className="px-6 py-4 text-left font-heading text-lg text-primary">Address</th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-heading text-lg text-primary">Overall</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-5 h-5" />
                        <span className="font-heading text-lg text-primary">Sauce</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faFire} className="icon-crispy w-5 h-5" />
                        <span className="font-heading text-lg text-primary">Crispy</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-5 h-5" />
                        <span className="font-heading text-lg text-primary">Meat</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((spot, index) => (
                    <tr 
                      key={spot.id}
                      className="border-b hover:bg-primary/5 transition-colors cursor-pointer"
                      onClick={() => handleSpotClick(spot)}
                    >
                      <td className="px-6 py-4 font-medium">#{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-primary">{spot.name}</td>
                      <td className="px-6 py-4 text-gray-600">{spot.address}</td>
                      <td className={`px-6 py-4 text-center font-bold ${
                        spot.overallRanking < 5 ? 'text-red-500' : 
                        spot.overallRanking >= 8 ? 'text-green-500' : 
                        'text-yellow-500'
                      }`}>
                        {formatNumber(spot.overallRanking, 'overall')}/10
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-secondary font-medium">{formatNumber(spot.sauce, 'sauce')}/10</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-accent font-medium">{formatNumber(spot.crispyness, 'crispy')}/10</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-primary-light font-medium">{formatNumber(spot.meat, 'meat')}/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden divide-y">
              {spots.map((spot, index) => (
                <div 
                  key={spot.id}
                  className="p-4 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => handleSpotClick(spot)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      <h3 className="text-lg font-medium">{spot.name}</h3>
                    </div>
                    <span className={`font-bold ${
                      spot.overallRanking < 5 ? 'text-red-500' : 
                      spot.overallRanking >= 8 ? 'text-green-500' : 
                      'text-yellow-500'
                    }`}>
                      {formatNumber(spot.overallRanking, 'overall')}/10
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{spot.address}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Sauce</span>
                      <p className="font-medium text-secondary">{formatNumber(spot.sauce, 'sauce')}/10</p>
                    </div>
                    <div className="text-center">
                      <FontAwesomeIcon icon={faFire} className="icon-crispy w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Crispy</span>
                      <p className="font-medium text-accent">{formatNumber(spot.crispyness, 'crispy')}/10</p>
                    </div>
                    <div className="text-center">
                      <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Meat</span>
                      <p className="font-medium text-primary-light">{formatNumber(spot.meat, 'meat')}/10</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal
          isOpen={!!selectedSpot}
          onClose={handleCloseSpot}
        >
          {selectedSpot && (
            <div className="p-6 space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 animate-fade-in">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-deep-orange-500 to-deep-orange-400 bg-clip-text text-transparent">
                      {selectedSpot.name}
                    </h2>
                    <div className="animate-wing-flap">
                      &#127831;
                    </div>
                  </div>
                  {selectedSpot.instagram && (
                    <a 
                      href={`https://instagram.com/${selectedSpot.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-deep-orange-500 hover:text-deep-orange-600 transition-colors flex items-center gap-2 text-base font-medium"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      {selectedSpot.instagram}
                    </a>
                  )}
                </div>
                <p className="text-gray-600 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1 text-deep-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedSpot.address}
                </p>
              </div>

              {/* Ratings Section */}
              <div className="bg-gradient-to-r from-deep-orange-300/80 to-deep-orange-400/60 rounded-xl p-3 animate-fade-in">
                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
                    <span className={`text-xl font-bold animate-number-pop animate-score-pulse ${
                      selectedSpot.overallRanking < 5 ? 'text-red-500' : 
                      selectedSpot.overallRanking >= 8 ? 'text-green-500' : 
                      'text-yellow-500'
                    }`}>
                      {formatNumber(selectedSpot.overallRanking, 'overall')}
                    </span>
                    <span className="text-xs text-gray-700 font-semibold mt-0.5">Overall</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-secondary animate-number-pop [animation-delay:100ms] animate-score-wiggle">{formatNumber(selectedSpot.sauce, 'sauce')}</span>
                      <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-3.5 h-3.5 animate-icon-bounce" />
                    </div>
                    <span className="text-xs text-gray-700 font-semibold mt-0.5">Sauce</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-accent animate-number-pop [animation-delay:200ms] animate-score-pulse">{formatNumber(selectedSpot.crispyness, 'crispy')}</span>
                      <FontAwesomeIcon icon={faFire} className="icon-crispy w-3.5 h-3.5 animate-icon-bounce" />
                    </div>
                    <span className="text-xs text-gray-700 font-semibold mt-0.5">Crispy</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-primary-light animate-number-pop [animation-delay:300ms] animate-score-wiggle">{formatNumber(selectedSpot.meat, 'meat')}</span>
                      <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-3.5 h-3.5 animate-icon-bounce" />
                    </div>
                    <span className="text-xs text-gray-700 font-semibold mt-0.5">Meat</span>
                  </div>
                </div>
              </div>

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
                    <span className="animate-wing-flap text-sm">&#127831;</span>
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
                        onClick={() => handlePhotoClick(photo, index)}
                      >
                        <Image
                          src={photo}
                          alt={`${selectedSpot?.name} photo ${index + 1}`}
                          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index === 0}
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
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(selectedSpot.name + ' ' + selectedSpot.address)}`}
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                ></iframe>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => {
            setSelectedPhoto(null);
            setSelectedPhotoIndex(-1);
          }}
          isPhotoModal={true}
        >
          {selectedPhoto && (
            <div className="p-2 md:p-0">
              <div className="relative min-h-[50vh] md:min-h-[75vh] flex items-center">
                <div className="w-full" {...swipeHandlers}>
                  <Slider 
                    {...sliderSettings} 
                    ref={sliderRef}
                  >
                    {photos.map((photo, index) => (
                      <div key={index} className="outline-none">
                        <div className="flex items-center justify-center min-h-[50vh] md:min-h-[75vh] px-4">
                          <Image
                            src={photo}
                            alt={`${selectedSpot?.name} photo ${index + 1}`}
                            width={1200}
                            height={800}
                            className="max-w-full h-auto max-h-[75vh] object-contain rounded-lg"
                            priority={index === selectedPhotoIndex}
                            unoptimized
                          />
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-md text-sm z-10">
                  {selectedPhotoIndex + 1} / {photos.length}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 
