'use client';

import { useWingSpots } from "./hooks/useWingSpots";
import Image from "next/image";
import MenuBar from "./components/MenuBar";
import Modal from "./components/Modal";
import SharePreview from "./components/SharePreview";
import Lottie from "lottie-react";
import wingAnimation from "./animations/wings.json";
import { formatNumber } from "./utils/formatNumber";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { default as nextDynamic } from 'next/dynamic';
import type { Settings } from 'react-slick';
import Slider from 'react-slick';
import WingMap from './components/WingMap';

// Configure page options
export const runtime = 'edge';
export const preferredRegion = 'auto';

const InstagramEmbed = nextDynamic(() => import('./components/InstagramEmbed'), { ssr: false });

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
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
  instagram?: string;
}

export default function Home() {
  const { spots: topSpots, loading: spotsLoading, error } = useWingSpots<WingSpot>('/api/get-top-wings');
  const [selectedSpot, setSelectedSpot] = useState<SelectedSpot | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const sliderRef = useRef<Slider>(null);

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

  const handleSpotClick = (spot: SelectedSpot) => {
    setSelectedSpot(spot);
    setPhotos([]); // Reset photos when selecting a new spot
  };

  const handlePhotoClick = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
  };

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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => sliderRef.current?.slickNext(),
    onSwipedRight: () => sliderRef.current?.slickPrev(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

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

  return (
    <div className="page-container">
      <MenuBar />
      {spotsLoading ? (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 text-4xl">
            <span className="animate-bounce [animation-delay:-0.3s]">&#127831;</span>
            <span className="animate-bounce [animation-delay:-0.2s]">.</span>
            <span className="animate-bounce [animation-delay:-0.1s]">.</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:0.1s]">&#127831;</span>
          </div>
        </div>
      ) : (
        <div className="content-container fade-in">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/chicks-of-nyc-logo.png"
              alt="NYC Chicks Logo"
              width={400}
              height={400}
              priority
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="slide-up">
              <h2 className="text-2xl font-bold mb-4 text-primary">Top Wing Spots</h2>
              {error && <p className="text-center text-red-500">{error}</p>}
              {topSpots.length > 0 && (
                <div className="space-y-4">
                  {topSpots.map((spot, index) => (
                    <div 
                      key={spot.id}
                      className="card p-4 hover:cursor-pointer"
                      onClick={() => setSelectedSpot(spot)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">#{index + 1} {spot.name}</h3>
                        <span className={`text-lg font-bold ${
                          spot.overallRanking < 5 ? 'text-red-500' : 
                          spot.overallRanking >= 8 ? 'text-green-500' : 
                          'text-yellow-500'
                        }`}>
                          {formatNumber(spot.overallRanking, 'overall')}/10
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{spot.address}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon 
                              icon={faDroplet} 
                              className="icon-sauce w-5 h-5"
                              title="Sauce Rating"
                            />
                          </div>
                          <span className="text-xs text-gray-500">Sauce</span>
                          <span className="font-semibold text-secondary">{formatNumber(spot.sauce, 'sauce')}/10</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon 
                              icon={faFire} 
                              className="icon-crispy w-5 h-5"
                              title="Crispy-ness Rating"
                            />
                          </div>
                          <span className="text-xs text-gray-500">Crispy</span>
                          <span className="font-semibold text-accent">{formatNumber(spot.crispyness, 'crispy')}/10</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon 
                              icon={faDrumstickBite} 
                              className="icon-meat w-5 h-5"
                              title="Meat Rating"
                            />
                          </div>
                          <span className="text-xs text-gray-500">Meat</span>
                          <span className="font-semibold text-primary-light">{formatNumber(spot.meat, 'meat')}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="slide-up">
              <h2 className="text-2xl font-bold mb-4 invisible">Spacer</h2>
              <InstagramEmbed />
            </div>
          </div>

          <div className="mt-8 card p-4 slide-up">
            <WingMap onSpotSelect={(spot) => setSelectedSpot(spot)} />
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
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
              <div className="w-full">
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

      {/* Spot Details Modal */}
      <Modal
        isOpen={!!selectedSpot}
        onClose={() => {
          setSelectedSpot(null);
          setPhotos([]);
        }}
      >
        {selectedSpot && (
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {/* Title and Actions Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-deep-orange-500 to-deep-orange-400 bg-clip-text text-transparent">
                  {selectedSpot.name}
                </h2>
                <div className="flex items-center gap-3">
                  {selectedSpot.instagram && (
                    <a 
                      href={`https://instagram.com/${selectedSpot.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-deep-orange-500 hover:text-deep-orange-600 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      {selectedSpot.instagram}
                    </a>
                  )}
                  <button
                    onClick={() => setIsSharing(true)}
                    className="text-deep-orange-500 hover:text-deep-orange-600 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              {/* Address Row */}
              <div className="flex items-center gap-2 text-gray-600 text-sm border-b border-gray-100 pb-3">
                <svg className="w-4 h-4 text-deep-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">{selectedSpot.address}</span>
              </div>
            </div>

            {/* Rest of the modal content */}
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
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setSelectedPhotoIndex(index);
                      }}
                    >
                      <Image
                        src={photo}
                        alt={`${selectedSpot.name} photo ${index + 1}`}
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

      <Modal
        isOpen={isSharing}
        onClose={() => setIsSharing(false)}
      >
        {selectedSpot && photos.length > 0 && (
          <SharePreview
            spotName={selectedSpot.name}
            address={selectedSpot.address}
            overallRating={selectedSpot.overallRanking}
            sauceRating={selectedSpot.sauce}
            crispynessRating={selectedSpot.crispyness}
            meatRating={selectedSpot.meat}
            instagram={selectedSpot.instagram}
            photoUrl={photos[0]}
            photos={photos.slice(1, 4)}
            mapUrl={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(selectedSpot.address)}&zoom=15&size=600x300&scale=2&maptype=roadmap&markers=color:orange%7C${encodeURIComponent(selectedSpot.address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          />
        )}
      </Modal>
    </div>
  );
}
