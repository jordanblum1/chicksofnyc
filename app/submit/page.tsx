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
  const autocompleteInstanceRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);

  // Function to initialize the autocomplete
  const initializeAutocomplete = () => {
    if (autocompleteRef.current && window.google && window.google.maps) {
      try {
        logger.info('APP', 'Initializing Google Places Autocomplete');

        // Clean up previous instance
        if (autocompleteInstanceRef.current) {
          // @ts-ignore
          google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
        }

        // Get the existing input element or create one if it doesn't exist
        let inputElement = document.getElementById('address-input') as HTMLInputElement;
        if (!inputElement && autocompleteRef.current) {
          logger.info('APP', 'Creating new input element');
          inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.placeholder = 'Search for a restaurant or enter address...';
          inputElement.className = 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
          inputElement.id = 'address-input';
          inputElement.name = 'address';

          // Clear any previous content and add the input
          autocompleteRef.current.innerHTML = '';
          autocompleteRef.current.appendChild(inputElement);
        }

        // Create the Autocomplete instance attached to our input
        // @ts-ignore
        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
          // Remove types restriction to avoid the "establishment cannot be mixed" error
          // Let users search for any type of place
          componentRestrictions: { country: 'us' }
        });

        // Store the instance
        autocompleteInstanceRef.current = autocomplete;


        // Listen for the place_changed event
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (place) {
            // Try to get address from various properties
            const selectedAddress = place.formatted_address ||
              place.name ||
              place.vicinity ||
              inputElement.value || '';

            const selectedName = place.name || '';

            if (selectedAddress) {
              // Update form data
              setFormData(prev => ({
                ...prev,
                address: selectedAddress,
                placeName: prev.placeName || selectedName
              }));

              // Also ensure the input shows the address
              inputElement.value = selectedAddress;

              // Log the selected address
              logger.info('APP', 'Address selected:', selectedAddress);

              toast.success(
                'Address selected successfully!',
                {
                  duration: 3000,
                  icon: <FontAwesomeIcon icon={faCheck} className="text-green-500" />,
                }
              );
            }
          } else if (inputElement.value) {
            // If no place object but there's a value, use it directly
            const manualValue = inputElement.value;

            setFormData(prev => ({
              ...prev,
              address: manualValue
            }));
          }
        });

        // Listen for Enter key to allow manual address entry
        inputElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const value = inputElement.value;
            if (value) {
              setFormData(prev => ({
                ...prev,
                address: value
              }));
            }
          }
        });
      } catch (error) {
        logger.error('APP', 'Error initializing Autocomplete:', error);
        toast.error(
          'Unable to initialize location search. Please try again or contact support.',
          {
            duration: 5000,
            icon: <FontAwesomeIcon icon={faXmark} className="text-red-500" />,
          }
        );
      }
    }
  };

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      initializeAutocomplete();
    } else {
      // If Google Maps API is not yet loaded, set up an interval to check
      const checkGoogleMapsInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.google && window.google.maps) {
          setGoogleMapsLoaded(true);
          initializeAutocomplete();
          clearInterval(checkGoogleMapsInterval);
        }
      }, 100);

      // Clear interval on component unmount
      return () => {
        clearInterval(checkGoogleMapsInterval);
        // Clean up listener on unmount
        if (listenerRef.current && autocompleteInstanceRef.current) {
          autocompleteInstanceRef.current.removeEventListener('gmp-placeselect', listenerRef.current);
        }
      };
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
      initializeAutocomplete();
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
              >
                {/* Fallback input that shows while Google Maps loads */}
                <input
                  type="text"
                  id="address-input"
                  name="address"
                  placeholder="Search for a restaurant or enter address..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  defaultValue={formData.address}
                  onChange={(e) => {
                    // Update form data when typing manually
                    setFormData(prev => ({ ...prev, address: e.target.value }));
                  }}
                />
              </div>
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
