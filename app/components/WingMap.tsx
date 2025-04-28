import { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDrumstickBite, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { TopVotedSpots } from './TopVotedSpots';
import logger from '../utils/logger';

interface MapProps {
  onSpotSelect: (spot: ReviewedSpot) => void;
  reviewedSpots: ReviewedSpot[];
  unreviewedSpots: UnreviewedSpot[];
  loading?: boolean;
}

interface WingSpot {
  id: string;
  name: string;
  address: string;
  checkedOut: boolean;
  votes: number;
  overallRanking?: number;
  sauce?: number;
  crispyness?: number;
  meat?: number;
  instagram?: string;
}

interface ReviewedSpot {
  id: string;
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
  instagram?: string;
}

interface UnreviewedSpot {
  id: string;
  name: string;
  address: string;
  votes: number;
  checkedOut: boolean;
}

function MapComponent({ onSpotSelect, reviewedSpots, unreviewedSpots: unreviewed, loading }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const newMarkersRef = useRef<google.maps.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: 40.7128, lng: -74.0060 }, // NYC coordinates
      zoom: 12,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#fff2e0" }]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#8e4f27" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#ffffff" }]
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#666666" }]
        },
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    };

    const newMap = new google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);
    boundsRef.current = new google.maps.LatLngBounds();
  }, [mapRef]);

  const handleVote = useCallback(async (spotId: string) => {
    // Check if user has already voted
    if (localStorage.getItem(`voted-${spotId}`)) {
      return;
    }

    try {
      const response = await fetch('/api/vote-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotId }),
      });
      
      if (!response.ok) throw new Error('Failed to vote');
      
      const data = await response.json();
      
      // Update UI
      const voteButton = document.getElementById(`vote-btn-${spotId}`);
      const votesSpan = voteButton?.previousElementSibling;
      
      if (voteButton && votesSpan) {
        // Store vote in localStorage
        localStorage.setItem(`voted-${spotId}`, 'true');
        
        // Update button state
        voteButton.setAttribute('disabled', 'true');
        voteButton.style.opacity = '0.5';
        voteButton.style.cursor = 'not-allowed';
        
        // Update vote count
        votesSpan.textContent = data.votes.toString();
      }
    } catch (error) {
      logger.error('APP', 'Error voting:', error);
    }
  }, []);

  const handleSpotSelect = useCallback((spotId: string) => {
    const spot = reviewedSpots.find((s: ReviewedSpot) => s.id === spotId);
    if (spot) {
      onSpotSelect(spot);
    }
  }, []);

  // Add click handler to map
  useEffect(() => {
    if (!map) return;

    map.addListener('click', () => {
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
      }
    });

    return () => {
      google.maps.event.clearListeners(map, 'click');
    };
  }, [map]);

  // Helper function to add marker to map
  const addMarkerToMap = useCallback((spot: ReviewedSpot | UnreviewedSpot, position: google.maps.LatLngLiteral, isReviewed: boolean) => {
    if (!map || !boundsRef.current) return;

    boundsRef.current.extend(position);

    const markerOptions: google.maps.Symbol = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: isReviewed ? 12 : 10,
      fillColor: isReviewed ? 
        ((spot as ReviewedSpot).overallRanking >= 8 ? '#22c55e' : 
         (spot as ReviewedSpot).overallRanking >= 5 ? '#eab308' : 
         '#ef4444') :
        '#9ca3af',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff'
    };

    const marker = new google.maps.Marker({
      position,
      map,
      animation: initialLoadRef.current ? google.maps.Animation.DROP : undefined,
      icon: markerOptions,
      title: spot.name
    });

    // Add hover effect
    marker.addListener('mouseover', () => {
      marker.setOptions({
        icon: {
          ...marker.getIcon() as google.maps.Symbol,
          scale: (marker.getIcon() as google.maps.Symbol).scale! * 1.2
        }
      });
    });

    marker.addListener('mouseout', () => {
      marker.setOptions({
        icon: markerOptions
      });
    });

    // Create info window content
    const infoWindow = new google.maps.InfoWindow({
      content: isReviewed ? 
        `
          <div class="p-2 min-w-[200px]">
            <div class="bg-deep-orange-50/50 rounded-t-lg p-2 -mt-2 -mx-2 mb-2">
              <h3 class="font-bold text-lg">${spot.name}</h3>
            </div>
            <div class="flex items-center justify-between mb-2 gap-4">
              <p class="text-sm text-gray-600 pr-2">${spot.address}</p>
              <span class="font-semibold text-${
                (spot as ReviewedSpot).overallRanking >= 8 ? 'green' : 
                (spot as ReviewedSpot).overallRanking >= 5 ? 'yellow' : 
                'red'
              }-500 text-lg whitespace-nowrap">${Number((spot as ReviewedSpot).overallRanking).toFixed(1)}/10</span>
            </div>
            <button 
              onclick="window.handleSpotSelect('${spot.id}')"
              class="text-xs text-deep-orange-500 mt-1 hover:text-deep-orange-600 transition-colors cursor-pointer w-full text-left"
            >
              Click to view details →
            </button>
          </div>
        ` :
        `
          <div class="p-2 min-w-[200px]">
            <div class="space-y-3">
              <div>
                <h3 class="font-bold text-lg mb-1">${spot.name}</h3>
                <p class="text-sm text-gray-600">${spot.address}</p>
              </div>
              <div class="bg-deep-orange-50/50 rounded-lg p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-deep-orange-600 text-sm">Should we check it out?</p>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-deep-orange-500">${(spot as UnreviewedSpot).votes}</span>
                    <button 
                      onclick="window.handleVote('${spot.id}')"
                      class="text-deep-orange-500 hover:text-deep-orange-600 transition-colors rounded-full hover:bg-deep-orange-100 p-1.5 -mr-1"
                      id="vote-btn-${spot.id}"
                      ${localStorage.getItem(`voted-${spot.id}`) ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 20.4V13h2v7.4h-2zM20.1 13c.6 0 .9.4.9 1v1l-2.1 4.9c-.2.6-.8 1-1.4 1H9c-.8 0-1.5-.7-1.5-1.5v-5c0-.4.2-.8.4-1.1L13.5 8h2.6l-2.1 5h6.1z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p class="text-xs text-gray-500">Vote to help us prioritize our next review!</p>
              </div>
            </div>
          </div>
        `
    });

    // Add click handler
    marker.addListener('click', () => {
      logger.info('APP', `${isReviewed ? 'Reviewed' : 'Unreviewed'} marker clicked:`, spot.name);
      logger.info('APP', 'Current active window ref:', activeInfoWindowRef.current);
      
      // Close any existing info window
      if (activeInfoWindowRef.current) {
        logger.info('APP', 'Closing existing info window');
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
      }
      
      // Open this info window
      logger.info('APP', 'Opening new info window for:', spot.name);
      infoWindow.open(map, marker);
      activeInfoWindowRef.current = infoWindow;
    });

    newMarkersRef.current.push(marker);

    // Fit bounds after all markers are added
    if (newMarkersRef.current.length === reviewedSpots.length + unreviewed.filter(s => !s.checkedOut).length) {
      map.fitBounds(boundsRef.current);
    }
  }, [map]);

  // Add markers when spots data is loaded
  useEffect(() => {
    if (!map || loading) return;
    if (!reviewedSpots?.length && !unreviewed?.length) return;

    logger.info('MAP', 'Adding markers for wing spots...');
    logger.info('MAP', 'Reviewed spots:', reviewedSpots.length);
    logger.info('MAP', 'Unreviewed spots:', unreviewed.length);

    // Clear existing markers
    markers.forEach((marker: google.maps.Marker) => marker.setMap(null));
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    // Reset markers and bounds
    newMarkersRef.current = [];
    boundsRef.current = new google.maps.LatLngBounds();

    // Add global handlers
    window.handleVote = handleVote;
    window.handleSpotSelect = handleSpotSelect;

    // Add reviewed spots
    reviewedSpots.forEach(spot => {
      const geocoder = new google.maps.Geocoder();
      
      // Check Redis cache
      fetch(`/api/cache-geocode?address=${encodeURIComponent(spot.address)}`)
        .then(response => response.json())
        .then(data => {
          if (data.fromCache) {
            logger.info('MAP', `✓ Using cached coordinates for "${spot.name}"`);
            addMarkerToMap(spot, data.coordinates, true);
          } else {
            logger.info('MAP', `Cache miss for "${spot.name}" - geocoding address`);
            // Geocode and cache the result
            geocoder.geocode({ address: spot.address }, (results, status) => {
              if (status === 'OK' && results?.[0]?.geometry?.location) {
                const position = results[0].geometry.location.toJSON();
                
                // Cache the coordinates
                fetch('/api/cache-geocode', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    address: spot.address,
                    coordinates: position,
                  }),
                })
                .then(() => logger.info('MAP', `→ Cached new coordinates for "${spot.name}"`))
                .catch(error => logger.error('MAP', `✗ Failed to cache coordinates for "${spot.name}":`, error));

                addMarkerToMap(spot, position, true);
              }
            });
          }
        })
        .catch(error => {
          logger.error('MAP', `✗ Error checking geocode cache for "${spot.name}":`, error);
          // Fallback to direct geocoding
          geocoder.geocode({ address: spot.address }, (results, status) => {
            if (status === 'OK' && results?.[0]?.geometry?.location) {
              logger.info('MAP', `⚠ Fallback to direct geocoding for "${spot.name}"`);
              const position = results[0].geometry.location.toJSON();
              addMarkerToMap(spot, position, true);
            }
          });
        });
    });

    // Add unreviewed spots
    unreviewed.forEach(spot => {
      // Skip if the spot has been checked out
      if (spot.checkedOut) return;

      const geocoder = new google.maps.Geocoder();
      
      // Check Redis cache
      fetch(`/api/cache-geocode?address=${encodeURIComponent(spot.address)}`)
        .then(response => response.json())
        .then(data => {
          if (data.fromCache) {
            logger.info('MAP', `✓ Using cached coordinates for "${spot.name}" (unreviewed)`);
            addMarkerToMap(spot, data.coordinates, false);
          } else {
            logger.info('MAP', `Cache miss for "${spot.name}" - geocoding address (unreviewed)`);
            // Geocode and cache the result
            geocoder.geocode({ address: spot.address }, (results, status) => {
              if (status === 'OK' && results?.[0]?.geometry?.location) {
                const position = results[0].geometry.location.toJSON();
                
                // Cache the coordinates
                fetch('/api/cache-geocode', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    address: spot.address,
                    coordinates: position,
                  }),
                })
                .then(() => logger.info('MAP', `→ Cached new coordinates for "${spot.name}" (unreviewed)`))
                .catch(error => logger.error('MAP', `✗ Failed to cache coordinates for "${spot.name}":`, error));

                addMarkerToMap(spot, position, false);
              }
            });
          }
        })
        .catch(error => {
          logger.error('MAP', `✗ Error checking geocode cache for "${spot.name}":`, error);
          // Fallback to direct geocoding
          geocoder.geocode({ address: spot.address }, (results, status) => {
            if (status === 'OK' && results?.[0]?.geometry?.location) {
              logger.info('MAP', `⚠ Fallback to direct geocoding for "${spot.name}" (unreviewed)`);
              const position = results[0].geometry.location.toJSON();
              addMarkerToMap(spot, position, false);
            }
          });
        });
    });

    // Set initialLoadRef to false after first render
    initialLoadRef.current = false;

    // Update markers state
    setMarkers(newMarkersRef.current);

    return () => {
      newMarkersRef.current.forEach((marker: google.maps.Marker) => marker.setMap(null));
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
      }
      if (window.handleVote) delete window.handleVote;
      if (window.handleSpotSelect) delete window.handleSpotSelect;
    };
  }, [map, loading, reviewedSpots, unreviewed]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <FontAwesomeIcon icon={faDrumstickBite} className="w-6 h-6 text-[#a65d2e]" />
            Wing Spots of NYC
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Spot not on here?</span>
          <a
            href="/submit"
            className="text-sm bg-[#a65d2e] text-white px-4 py-2 rounded-lg hover:bg-[#8e4f27] transition-colors flex items-center gap-2"
          >
            <span>Submit a Spot</span>
            <FontAwesomeIcon icon={faDrumstickBite} className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="relative w-full h-[400px] sm:h-[480px] rounded-lg overflow-hidden">
            <div ref={mapRef} className="w-full h-full" />
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="animate-spin">
                  <FontAwesomeIcon icon={faDrumstickBite} className="w-8 h-8 text-deep-orange-500" />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm bg-white/90 py-3 px-4 rounded-full shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                <span className="font-medium whitespace-nowrap">I gotta tell someone (8+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                <span className="font-medium whitespace-nowrap">Yum City (5-7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <span className="font-medium whitespace-nowrap">Game's on (&lt;5)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></div>
                <span className="font-medium whitespace-nowrap">On the list</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80">
          <TopVotedSpots spots={unreviewed.filter(spot => !spot.checkedOut)} />
        </div>
      </div>
    </div>
  );
}

// Add global type for the vote handler
declare global {
  interface Window {
    handleVote?: (spotId: string) => void;
    handleSpotSelect?: (spotId: string) => void;
  }
}

export default function WingMap({ onSpotSelect, reviewedSpots, unreviewedSpots, loading }: MapProps) {
  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <MapComponent 
        onSpotSelect={onSpotSelect} 
        reviewedSpots={reviewedSpots} 
        unreviewedSpots={unreviewedSpots}
        loading={loading}
      />
    </Wrapper>
  );
} 
