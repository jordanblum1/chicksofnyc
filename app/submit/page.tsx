'use client';
import MenuBar from '../components/MenuBar';
import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import logger from '../utils/logger';

// Extend the window interface to include the Google Maps library
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          PlaceAutocompleteElement: any;
        }
      }
    }
  }
}

export default function Submit() {
  const [formData, setFormData] = useState({
    placeName: '',
    address: '',
    additionalComments: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      
      // Initialize Google Maps Places Autocomplete Element (new API)
      if (autocompleteRef.current) {
        try {
          // Clear any previous content
          autocompleteRef.current.innerHTML = '';
          
          // Create the Place Autocomplete Element
          // @ts-ignore - TypeScript definitions might not be up to date with the newest API
          const placeAutocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
            types: ['establishment', 'address'],
            componentRestrictions: { country: 'us' }
          });
          
          // Style the element to match our form
          placeAutocompleteElement.style.width = '100%';
          placeAutocompleteElement.style.borderRadius = '0.5rem';
          placeAutocompleteElement.style.marginBottom = '0.5rem';
          
          // Add the element to our container
          autocompleteRef.current.appendChild(placeAutocompleteElement);
          
          // Listen for place selection events
          // @ts-ignore - TypeScript definitions might not be up to date with the newest API
          placeAutocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
            const place = event.detail?.place;
            if (place) {
              setFormData(prev => ({ 
                ...prev, 
                address: place.formattedAddress || place.formatted_address || '',
                // If the place name is empty, use the name from the place details
                placeName: prev.placeName || place.displayName || place.name || ''
              }));
              logger.info('APP', 'Place selected:', place);
            }
          });
        } catch (error) {
          logger.error('APP', 'Error initializing PlaceAutocompleteElement:', error);
          toast.error(
            'Unable to initialize location search. Please try again or contact support.',
            {
              duration: 5000,
              icon: <FontAwesomeIcon icon={faXmark} className="text-red-500" />,
            }
          );
        }
      }
    } else {
      // If Google Maps API is not yet loaded, set up an interval to check
      const checkGoogleMapsInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.google && window.google.maps) {
          setGoogleMapsLoaded(true);
          clearInterval(checkGoogleMapsInterval);
        }
      }, 100);
      
      // Clear interval on component unmount
      return () => clearInterval(checkGoogleMapsInterval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that we have an address from the autocomplete
    if (!formData.address) {
      toast.error(
        'Please select an address from the autocomplete dropdown.',
        {
          duration: 5000,
          icon: <FontAwesomeIcon icon={faXmark} className="text-red-500" />,
        }
      );
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-wing-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      toast.success(
        "Thanks for the submission! We'll check it out!", 
        {
          duration: 5000,
          icon: <FontAwesomeIcon icon={faCheck} className="text-green-500" />,
          style: {
            background: '#10B981',
            color: 'white',
            padding: '16px',
          },
        }
      );
      setFormData({ placeName: '', address: '', additionalComments: '', email: '' });
      
      // Reset the autocomplete element
      if (autocompleteRef.current) {
        // Re-initialize the autocomplete element
        autocompleteRef.current.innerHTML = '';
        if (window.google && window.google.maps) {
          // @ts-ignore
          const newPlaceAutocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
            types: ['establishment', 'address'],
            componentRestrictions: { country: 'us' }
          });
          
          newPlaceAutocompleteElement.style.width = '100%';
          newPlaceAutocompleteElement.style.borderRadius = '0.5rem';
          newPlaceAutocompleteElement.style.marginBottom = '0.5rem';
          
          autocompleteRef.current.appendChild(newPlaceAutocompleteElement);
          
          // Re-attach the event listener
          // @ts-ignore
          newPlaceAutocompleteElement.addEventListener('gmp-placeselect', (event: any) => {
            const place = event.detail?.place;
            if (place) {
              setFormData(prev => ({ 
                ...prev, 
                address: place.formattedAddress || place.formatted_address || '',
                placeName: prev.placeName || place.displayName || place.name || ''
              }));
            }
          });
        }
      }
    } catch (error) {
      logger.error('APP', 'Submit error:', error);
      toast.error(
        'Something went wrong. Please try again.', 
        {
          duration: 5000,
          icon: <FontAwesomeIcon icon={faXmark} className="text-red-500" />,
          style: {
            background: '#EF4444',
            color: 'white',
            padding: '16px',
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <MenuBar />
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'rounded-lg shadow-lg',
          duration: 5000,
        }}
      />
      <div className="content-container fade-in">
        <section className="card page-header p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white font-heading">Submit a Wing Spot</h1>
            <p className="text-white/90 mt-2 text-lg">Know a great wing spot? Let us know and we'll check it out!</p>
          </div>
        </section>

        <div className="card p-8 slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-1">
                Spot Name
              </label>
              <input
                type="text"
                id="placeName"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.placeName}
                onChange={(e) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
                placeholder="e.g. Wing Heaven"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              {/* Autocomplete Element container */}
              <div 
                id="place-autocomplete"
                ref={autocompleteRef}
                className="w-full"
              ></div>
              {formData.address && (
                <p className="text-xs text-green-600 mt-1">
                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                  Selected: {formData.address}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Search for the restaurant and select from the dropdown
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="additionalComments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                id="additionalComments"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.additionalComments}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
                placeholder="Tell us what makes their wings special..."
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Wing Spot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
