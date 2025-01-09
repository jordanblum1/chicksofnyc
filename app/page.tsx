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
import SpotDetails from './components/SpotDetails';

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
  mapUrl?: string;
}

interface SelectedSpot extends WingSpot {
  mapUrl?: string;
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

  const handleSpotClick = (spot: WingSpot) => {
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
          <SpotDetails
            spot={selectedSpot}
            photos={photos}
            onPhotoClick={(photo, index) => {
              setSelectedPhoto(photo);
              setSelectedPhotoIndex(index);
            }}
            onShare={() => setIsSharing(true)}
          />
        )}
      </Modal>

      {/* Share Preview Modal */}
      <Modal
        isOpen={isSharing}
        onClose={() => setIsSharing(false)}
      >
        {selectedSpot && photos.length > 0 && (
          <SharePreview
            spot={selectedSpot}
            photoUrl={photos[0] || ''}
            photos={photos.slice(1, 4)}
            mapUrl={selectedSpot.mapUrl || ''}
          />
        )}
      </Modal>
    </div>
  );
}
