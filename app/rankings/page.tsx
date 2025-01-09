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
import SharePreview from "../components/SharePreview";
import SpotDetails from '../components/SpotDetails';

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
  mapUrl?: string;
}

interface SelectedSpot extends WingSpot {
  mapUrl?: string;
}

export default function RankingsPage() {
  const { spots, loading, error } = useWingSpots<WingSpot>('/api/get-all-wings');
  const [selectedSpot, setSelectedSpot] = useState<SelectedSpot | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const sliderRef = useRef<Slider>(null);
  const [isSharing, setIsSharing] = useState(false);

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

  const handleSpotClick = async (spot: WingSpot) => {
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

        {/* Spot Details Modal */}
        {selectedSpot && (
          <Modal isOpen={!!selectedSpot} onClose={handleCloseSpot}>
            <SpotDetails
              spot={selectedSpot}
              photos={photos}
              onPhotoClick={handlePhotoClick}
              onShare={() => setIsSharing(true)}
            />
          </Modal>
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

        {/* Share Preview Modal */}
        {isSharing && selectedSpot && photos.length > 0 && (
          <Modal isOpen={isSharing} onClose={() => setIsSharing(false)} isPhotoModal>
            <SharePreview
              spot={selectedSpot}
              photoUrl={photos[0] || ''}
              photos={photos.slice(1, 4)}
              mapUrl={selectedSpot.mapUrl || ''}
            />
          </Modal>
        )}
      </div>
    </div>
  );
} 
