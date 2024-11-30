'use client';
import { useState, useEffect } from 'react';
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

const Slider = dynamic(() => import('react-slick'), { ssr: false });
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import wingAnimation from '../animations/wings.json';

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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
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

  const handlePhotoClick = (photo: string) => {
    setSelectedPhoto(photo);
  };

  const handlePhotoNavigation = (direction: 'prev' | 'next') => {
    if (!selectedPhoto || photos.length <= 1 || isAnimating) return;
    
    setIsAnimating(true);
    const currentIndex = photos.indexOf(selectedPhoto);
    let newIndex;
    
    if (direction === 'prev') {
      setSlideDirection('right');
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    } else {
      setSlideDirection('left');
      newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    }
    
    setTimeout(() => {
      setSelectedPhoto(photos[newIndex]);
      setSlideDirection(null);
      setIsAnimating(false);
    }, 300);
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
      } else if (e.key === 'Escape') {
        handleClosePhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: photos.indexOf(selectedPhoto || ''),
    swipe: true,
    arrows: true,
    adaptiveHeight: true,
    beforeChange: (current: number, next: number) => {
      setSelectedPhoto(photos[next]);
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
                        {formatNumber(spot.overallRanking)}/10
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-secondary font-medium">{formatNumber(spot.sauce)}/10</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-accent font-medium">{formatNumber(spot.crispyness)}/10</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-primary-light font-medium">{formatNumber(spot.meat)}/10</span>
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
                      {formatNumber(spot.overallRanking)}/10
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{spot.address}</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Sauce</span>
                      <p className="font-medium text-secondary">{formatNumber(spot.sauce)}/10</p>
                    </div>
                    <div className="text-center">
                      <FontAwesomeIcon icon={faFire} className="icon-crispy w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Crispy</span>
                      <p className="font-medium text-accent">{formatNumber(spot.crispyness)}/10</p>
                    </div>
                    <div className="text-center">
                      <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-5 h-5 mb-1" />
                      <span className="text-gray-600 block">Meat</span>
                      <p className="font-medium text-primary-light">{formatNumber(spot.meat)}/10</p>
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
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 animate-fade-in">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-deep-orange-500 to-deep-orange-400 bg-clip-text text-transparent">
                  {selectedSpot.name}
                </h2>
                <div className="animate-wing-flap">
                  🍗
                </div>
              </div>
              <p className="text-gray-600 text-sm flex items-center">
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
                        onClick={() => handlePhotoClick(photo)}
                      >
                        <Image
                          src={photo}
                          alt={`${selectedSpot.name} photo ${index + 1}`}
                          fill
                          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                          unoptimized // Since these are external URLs from Google Places API
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
          isOpen={!!selectedPhoto}
          onClose={handleClosePhoto}
          isPhotoModal={true}
        >
          {selectedPhoto && (
            <div className="p-2 md:p-0">
              <div className="relative min-h-[50vh] md:min-h-[75vh] flex items-center">
                <Slider {...sliderSettings} className="w-full">
                  {photos.map((photo, index) => (
                    <div key={index} className="outline-none">
                      <div className="flex items-center justify-center min-h-[50vh] md:min-h-[75vh] px-4">
                        <Image
                          src={photo}
                          alt={`${selectedSpot?.name} photo ${index + 1}`}
                          width={1200}
                          height={800}
                          className="max-w-full h-auto max-h-[75vh] object-contain rounded-lg"
                          unoptimized
                        />
                      </div>
                    </div>
                  ))}
                </Slider>
                
                {/* Photo Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 px-3 py-1 rounded-md text-sm z-10">
                  {photos.indexOf(selectedPhoto) + 1} / {photos.length}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 
