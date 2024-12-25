import { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper } from "@googlemaps/react-wrapper";
import { useWingSpots } from '../hooks/useWingSpots';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDrumstickBite, faThumbsUp } from '@fortawesome/free-solid-svg-icons';

interface MapProps {
  onSpotSelect: (spot: ReviewedSpot) => void;
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

function MapComponent({ onSpotSelect }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const { spots: reviewedSpots } = useWingSpots<ReviewedSpot>('/api/get-all-wings');
  const { spots: unreviewed, loading } = useWingSpots<UnreviewedSpot>('/api/get-all-spots');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

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
      console.error('Error voting:', error);
    }
  }, []);

  const handleSpotSelect = useCallback((spotId: string) => {
    const spot = reviewedSpots.find((s: ReviewedSpot) => s.id === spotId);
    if (spot) {
      onSpotSelect(spot);
    }
  }, [reviewedSpots, onSpotSelect]);

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

  // Add markers when spots data is loaded
  useEffect(() => {
    if (!map || !reviewedSpots.length || !unreviewed.length) return;

    // Clear existing markers
    markers.forEach((marker: google.maps.Marker) => marker.setMap(null));
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    const newMarkers: google.maps.Marker[] = [];

    // Add global handlers
    window.handleVote = handleVote;
    window.handleSpotSelect = handleSpotSelect;

    // Add reviewed spots
    reviewedSpots.forEach(spot => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: spot.address }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const position = results[0].geometry.location;
          bounds.extend(position);

          const markerOptions: google.maps.Symbol = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: spot.overallRanking >= 8 ? '#22c55e' : 
                      spot.overallRanking >= 5 ? '#eab308' : 
                      '#ef4444',
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

          // Create info window content for reviewed spots
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2 min-w-[200px]">
                <div class="bg-deep-orange-50/50 rounded-t-lg p-2 -mt-2 -mx-2 mb-2">
                  <h3 class="font-bold text-lg">${spot.name}</h3>
                </div>
                <div class="flex items-center justify-between mb-2 gap-4">
                  <p class="text-sm text-gray-600 pr-2">${spot.address}</p>
                  <span class="font-semibold text-${
                    spot.overallRanking >= 8 ? 'green' : 
                    spot.overallRanking >= 5 ? 'yellow' : 
                    'red'
                  }-500 text-lg whitespace-nowrap">${Number(spot.overallRanking).toFixed(1)}/10</span>
                </div>
                <button 
                  onclick="window.handleSpotSelect('${spot.id}')"
                  class="text-xs text-deep-orange-500 mt-1 hover:text-deep-orange-600 transition-colors cursor-pointer w-full text-left"
                >
                  Click to view details →
                </button>
              </div>
            `
          });

          // Add click handler for marker
          marker.addListener('click', () => {
            console.log('Marker clicked:', spot.name);
            console.log('Current active window ref:', activeInfoWindowRef.current);
            
            // Close any existing info window
            if (activeInfoWindowRef.current) {
              console.log('Closing existing info window');
              activeInfoWindowRef.current.close();
              activeInfoWindowRef.current = null;
            }
            
            // Open this info window
            console.log('Opening new info window for:', spot.name);
            infoWindow.open(map, marker);
            activeInfoWindowRef.current = infoWindow;
          });

          newMarkers.push(marker);
        }
      });
    });

    // Add unreviewed spots
    unreviewed.forEach(spot => {
      // Skip if the spot has been checked out
      if (spot.checkedOut) return;

      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address: spot.address }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const position = results[0].geometry.location;
          bounds.extend(position);

          const markerOptions: google.maps.Symbol = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#9ca3af',
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

          // Create info window content for unreviewed spots
          const infoWindow = new google.maps.InfoWindow({
            content: `
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
                        <span class="text-sm font-medium text-deep-orange-500">${spot.votes}</span>
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
            console.log('Unreviewed marker clicked:', spot.name);
            console.log('Current active window ref:', activeInfoWindowRef.current);
            
            // Close any existing info window
            if (activeInfoWindowRef.current) {
              console.log('Closing existing info window');
              activeInfoWindowRef.current.close();
              activeInfoWindowRef.current = null;
            }
            
            // Open this info window
            console.log('Opening new info window for:', spot.name);
            infoWindow.open(map, marker);
            activeInfoWindowRef.current = infoWindow;
          });

          newMarkers.push(marker);
        }
      });
    });

    // Set initialLoadRef to false after first render
    initialLoadRef.current = false;

    setMarkers(newMarkers);

    // Fit bounds after all markers are added
    if (newMarkers.length === reviewedSpots.length + unreviewed.length) {
      map.fitBounds(bounds);
    }

    return () => {
      newMarkers.forEach((marker: google.maps.Marker) => marker.setMap(null));
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
        activeInfoWindowRef.current = null;
      }
      if (window.handleVote) delete window.handleVote;
      if (window.handleSpotSelect) delete window.handleSpotSelect;
    };
  }, [map, reviewedSpots, unreviewed, handleVote, handleSpotSelect]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
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

      <div className="relative w-full h-[480px] rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin">
              <FontAwesomeIcon icon={faDrumstickBite} className="w-8 h-8 text-deep-orange-500" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6 items-center text-sm bg-white/90 py-2 px-4 rounded-full shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
          <span className="font-medium">I gotta tell someone bout this (8+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
          <span className="font-medium">Yum City, population you (5-7)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
          <span className="font-medium">Hopefully there's also a game on (&lt;5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></div>
          <span className="font-medium">On the list</span>
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

export default function WingMap({ onSpotSelect }: MapProps) {
  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <MapComponent onSpotSelect={onSpotSelect} />
    </Wrapper>
  );
} 
