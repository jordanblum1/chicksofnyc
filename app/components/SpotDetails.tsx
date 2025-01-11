import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import Lottie from 'lottie-react';
import wingAnimation from '../animations/wings.json';
import { formatNumber } from '../utils/formatNumber';

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

interface SpotDetailsProps {
  spot: WingSpot;
  photos: string[];
  onPhotoClick: (photo: string, index: number) => void;
  onShare: () => void;
}

export default function SpotDetails({ spot, photos, onPhotoClick, onShare }: SpotDetailsProps) {
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!spot) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check Redis cache first
        const cacheResponse = await fetch(
          `/api/cache-geocode?address=${encodeURIComponent(spot.address)}`
        );
        const cacheData = await cacheResponse.json();
        
        if (cacheData.fromCache) {
          console.log(`[SPOT] ✓ Using cached coordinates for "${spot.name}"`);
          setCoordinates(cacheData.coordinates);
        } else {
          console.log(`[SPOT] Cache miss for "${spot.name}" - geocoding address`);
          // If not in cache, use Google Maps Geocoder
          const geocoder = new google.maps.Geocoder();
          const results = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: spot.address }, (results, status) => {
              if (status === 'OK' && results?.[0]?.geometry?.location) {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            });
          });
          
          const position = (results as any)[0].geometry.location.toJSON();
          
          // Cache the result
          await fetch('/api/cache-geocode', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address: spot.address,
              coordinates: position,
            }),
          });
          
          console.log(`[SPOT] → Cached new coordinates for "${spot.name}"`);
          setCoordinates(position);
        }
      } catch (error) {
        console.error(`[SPOT] ✗ Error fetching coordinates for "${spot.name}":`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [spot]);

  useEffect(() => {
    const fetchMapUrl = async () => {
      try {
        // Get map URL
        const response = await fetch(
          `/api/cache-map-url?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`
        );
        const data = await response.json();
        setMapUrl(data.url);
        console.log(`[SPOT] ${data.fromCache ? '✓ Using cached' : '→ Generated new'} map URL for "${spot.name}"`);
      } catch (error) {
        console.error(`[SPOT] ✗ Failed to fetch map URL for "${spot.name}":`, error);
      } finally {
        setIsMapLoading(false);
      }
    };

    fetchMapUrl();
  }, [spot.name, spot.address]);

  useEffect(() => {
    async function fetchPhotos() {
      if (!spot) return;
      
      setLoadingPhotos(true);
      try {
        console.log(`[SPOT DETAILS] Fetching photos for: ${spot.name}`);
        const response = await fetch(
          `/api/get-place-photos?name=${encodeURIComponent(spot.name)}&address=${encodeURIComponent(spot.address)}`
        );
        const data = await response.json();
        
        if (data.error) {
          console.error(`[PHOTOS ERROR] ${spot.name}: ${data.error}`);
        } else {
          const status = data.fromCache ? 
            (data.isStale ? 'STALE CACHE' : 'CACHE HIT') : 
            'FRESH DATA';
          const age = data.cacheAge ? 
            ` (${Math.round(data.cacheAge / (1000 * 60 * 60))} hours old)` : 
            '';
          console.log(`[PHOTOS ${status}] ${spot.name}${age}`);
          console.log(`[PHOTOS COUNT] ${data.photos.length} photos loaded in ${data.duration}ms`);
        }
      } catch (error) {
        console.error('[PHOTOS ERROR] Failed to fetch photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    }

    fetchPhotos();
  }, [spot]);

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-3">
        {/* Title and Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-deep-orange-500 to-deep-orange-400 bg-clip-text text-transparent">
            {spot.name}
          </h2>
          <div className="flex items-center gap-3">
            {spot.instagram && (
              <a 
                href={`https://instagram.com/${spot.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-deep-orange-500 hover:text-deep-orange-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                {spot.instagram}
              </a>
            )}
            <button
              onClick={onShare}
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
          <span className="line-clamp-2">{spot.address}</span>
        </div>
      </div>

      {/* Ratings Grid */}
      <div className="bg-gradient-to-r from-deep-orange-300/80 to-deep-orange-400/60 rounded-xl p-3 animate-fade-in">
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
            <span className={`text-xl font-bold animate-number-pop animate-score-pulse ${
              spot.overallRanking < 5 ? 'text-red-500' : 
              spot.overallRanking >= 8 ? 'text-green-500' : 
              'text-yellow-500'
            }`}>
              {formatNumber(spot.overallRanking, 'overall')}
            </span>
            <span className="text-xs text-gray-700 font-semibold mt-0.5">Overall</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-secondary animate-number-pop [animation-delay:100ms] animate-score-wiggle">{formatNumber(spot.sauce, 'sauce')}</span>
              <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-3.5 h-3.5 animate-icon-bounce" />
            </div>
            <span className="text-xs text-gray-700 font-semibold mt-0.5">Sauce</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-accent animate-number-pop [animation-delay:200ms] animate-score-pulse">{formatNumber(spot.crispyness, 'crispy')}</span>
              <FontAwesomeIcon icon={faFire} className="icon-crispy w-3.5 h-3.5 animate-icon-bounce" />
            </div>
            <span className="text-xs text-gray-700 font-semibold mt-0.5">Crispy</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2.5 bg-white/95 rounded-lg shadow-sm">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-primary-light animate-number-pop [animation-delay:300ms] animate-score-wiggle">{formatNumber(spot.meat, 'meat')}</span>
              <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-3.5 h-3.5 animate-icon-bounce" />
            </div>
            <span className="text-xs text-gray-700 font-semibold mt-0.5">Meat</span>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      {photos.length > 0 && (
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
                onClick={() => onPhotoClick(photo, index)}
              >
                <Image
                  src={photo}
                  alt={`${spot.name} photo ${index + 1}`}
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
      )}

      {/* Google Maps Section */}
      <div className="rounded-lg overflow-hidden border-4 border-deep-orange-100 shadow-lg animate-fade-in hover:border-deep-orange-200 transition-colors duration-300">
        {isMapLoading ? (
          <div className="h-[350px] flex items-center justify-center bg-gray-100">
            <div className="w-24 h-24">
              <Lottie animationData={wingAnimation} loop={true} />
            </div>
          </div>
        ) : mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="h-[350px] flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-600">
              <p>Error loading map</p>
              <p className="text-sm">Please try again later</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 