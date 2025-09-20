'use client';
import { useState, useEffect, useRef } from 'react';
import MenuBar from "../components/MenuBar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRotate, 
  faPlus, 
  faChartLine,
  faGear,
  faDrumstickBite,
  faDatabase,
  faLock,
  faFootball,
  faXmark,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import logger from '../utils/logger';

// Extend the window interface to include the Google Maps library
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: any;
        }
      }
    }
  }
}

export default function AdminPage() {
  const [refreshStatus, setRefreshStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [upNextSpot, setUpNextSpot] = useState<any>(null);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [isSettingUpNext, setIsSettingUpNext] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);

  // Check for existing authentication and fetch up next spot
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchUpNextSpot();
    }
  }, []);

  // Initialize autocomplete when authenticated
  useEffect(() => {
    if (isAuthenticated && autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isAuthenticated]);

  const fetchUpNextSpot = async () => {
    try {
      const response = await fetch('/api/admin/up-next');
      if (response.ok) {
        const data = await response.json();
        setUpNextSpot(data.spot);
      }
    } catch (error) {
      logger.error('ADMIN', 'Error fetching up next spot:', error);
    }
  };

  const initializeAutocomplete = () => {
    if (autocompleteRef.current && window.google && window.google.maps) {
      try {
        logger.info('ADMIN', 'Initializing Google Places Autocomplete');

        // Create input element
        let inputElement = document.getElementById('up-next-input') as HTMLInputElement;
        if (!inputElement && autocompleteRef.current) {
          inputElement = document.createElement('input');
          inputElement.type = 'text';
          inputElement.placeholder = 'Search for a wing spot...';
          inputElement.className = 'w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5D4037] focus:border-transparent';
          inputElement.id = 'up-next-input';
          autocompleteRef.current.innerHTML = '';
          autocompleteRef.current.appendChild(inputElement);
        }

        // Create autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
          componentRestrictions: { country: 'us' }
        });

        autocompleteInstanceRef.current = autocomplete;

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place) {
            const selectedAddress = place.formatted_address || place.name || place.vicinity || '';
            const selectedName = place.name || '';
            const placeId = place.place_id || '';
            
            setSelectedSpot({
              id: placeId,
              name: selectedName,
              address: selectedAddress
            });

            inputElement.value = `${selectedName} - ${selectedAddress}`;
          }
        });
      } catch (error) {
        logger.error('ADMIN', 'Error initializing Autocomplete:', error);
      }
    } else {
      // Try again in 100ms if Google Maps isn't loaded yet
      setTimeout(initializeAutocomplete, 100);
    }
  };

  const handleSetUpNext = async () => {
    if (!selectedSpot) {
      toast.error('Please select a wing spot first');
      return;
    }

    setIsSettingUpNext(true);
    try {
      const response = await fetch('/api/admin/up-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true'
        },
        body: JSON.stringify({ spot: selectedSpot })
      });

      if (response.ok) {
        toast.success('Up Next spot set successfully!');
        setUpNextSpot(selectedSpot);
        setSelectedSpot(null);
        // Clear the input
        const inputElement = document.getElementById('up-next-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
        }
      } else {
        toast.error('Failed to set Up Next spot');
      }
    } catch (error) {
      toast.error('Error setting Up Next spot');
    } finally {
      setIsSettingUpNext(false);
    }
  };

  const handleClearUpNext = async () => {
    try {
      const response = await fetch('/api/admin/up-next', {
        method: 'DELETE',
        headers: {
          'x-admin-auth': 'true'
        }
      });

      if (response.ok) {
        toast.success('Up Next spot cleared!');
        setUpNextSpot(null);
      } else {
        toast.error('Failed to clear Up Next spot');
      }
    } catch (error) {
      toast.error('Error clearing Up Next spot');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuth', 'true');
        toast.success('Successfully logged in!');
      } else {
        toast.error('Invalid password');
      }
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    toast.success('Logged out successfully');
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setRefreshStatus('Refreshing...');
    
    const refreshPromise = new Promise<string>(async (resolve, reject) => {
      try {
        // First, revalidate the cache
        await fetch('/api/revalidate', {
          cache: 'no-store'
        });
        
        // Then force a refetch of the data
        const response = await fetch('/api/get-top-wings?t=' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }
        });
        
        if (!response.ok) throw new Error('Failed to refresh data');
        
        resolve('Rankings refreshed successfully!');
      } catch (error) {
        reject('Failed to refresh rankings');
      }
    });

    toast.promise(refreshPromise, {
      loading: 'Refreshing rankings...',
      success: (message: string) => {
        setIsLoading(false);
        setRefreshStatus('Rankings refreshed successfully!');
        // Force reload of data on all pages
        window.location.reload();
        return (
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            <span>{message}</span>
          </div>
        );
      },
      error: (message) => {
        setIsLoading(false);
        setRefreshStatus('Failed to refresh rankings. Please try again.');
        return `Error: ${message}`;
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8EB] flex flex-col">
        <MenuBar />
        <main className="flex-1 flex items-center justify-center" style={{ paddingTop: '84px' }}>
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#5D4037] p-4 rounded-full">
                <FontAwesomeIcon icon={faLock} className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-6">Admin Access</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D4037] focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#5D4037] text-white rounded-lg hover:bg-[#4E342E] transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </main>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8EB] flex flex-col">
      <MenuBar />
      <main className="flex-1 w-full px-4 sm:px-6 py-8" style={{ paddingTop: '84px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faGear} className="w-6 h-6 text-gray-500 animate-spin-slow" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Up Next Management Card */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-lg">
                  <FontAwesomeIcon icon={faFootball} className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Game Day Up Next</h2>
              </div>
              
              {upNextSpot ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Currently set to:</p>
                  <p className="font-semibold">{upNextSpot.name}</p>
                  <p className="text-sm text-gray-500">{upNextSpot.address}</p>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">No spot currently set as "Up Next"</p>
              )}

              <div className="space-y-3">
                <div ref={autocompleteRef} />
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSetUpNext}
                    disabled={isSettingUpNext || !selectedSpot}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-white font-medium
                      flex items-center justify-center gap-2
                      ${isSettingUpNext || !selectedSpot
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                      }
                      transition-colors
                    `}
                  >
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                    Set Up Next
                  </button>
                  
                  {upNextSpot && (
                    <button
                      onClick={handleClearUpNext}
                      className="px-3 py-2 rounded-lg text-white font-medium
                        bg-red-500 hover:bg-red-600 transition-colors
                        flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rankings Management Card */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#5D4037] p-3 rounded-lg">
                  <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Rankings Management</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Refresh the rankings data from Airtable and update the website.
              </p>
              
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`
                  w-full px-4 py-3 rounded-lg text-white font-medium
                  flex items-center justify-center gap-2
                  ${isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#5D4037] hover:bg-[#4E342E]'
                  }
                  transition-colors
                `}
              >
                <FontAwesomeIcon 
                  icon={faRotate} 
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                />
                {isLoading ? 'Refreshing...' : 'Refresh Rankings'}
              </button>
            </div>

            {/* Add New Wing Spot Card (Coming Soon) */}
            <div className="bg-white p-6 rounded-xl shadow-md opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <FontAwesomeIcon icon={faDrumstickBite} className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Add Wing Spot</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Add a new wing spot directly through the admin interface.
              </p>
              
              <button
                disabled
                className="w-full px-4 py-3 rounded-lg text-white font-medium
                  bg-gray-400 cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                Coming Soon
              </button>
            </div>

            {/* Data Management Card (Coming Soon) */}
            <div className="bg-white p-6 rounded-xl shadow-md opacity-75">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <FontAwesomeIcon icon={faDatabase} className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold">Data Management</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Manage and update existing wing spot data.
              </p>
              
              <button
                disabled
                className="w-full px-4 py-3 rounded-lg text-white font-medium
                  bg-gray-400 cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
