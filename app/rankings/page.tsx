'use client';
import { useWingSpots } from "../hooks/useWingSpots";
import MenuBar from "../components/MenuBar";
import Modal from "../components/Modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { formatNumber } from "../utils/formatNumber";

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

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
  };

  const handleCloseSpot = () => {
    setSelectedSpot(null);
    setPhotos([]);
  };

  const handleSpotClick = (spot: SelectedSpot) => {
    setSelectedSpot(spot);
    setPhotos([]); // Reset photos when selecting a new spot
  };

  const handlePhotoClick = (photo: string) => {
    setSelectedPhoto(photo);
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
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedSpot.name}</h2>
              <p className="text-gray-600 mb-4">{selectedSpot.address}</p>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                    selectedSpot.name + ' ' + selectedSpot.address
                  )}`}
                  style={{ border: 0, borderRadius: '0.5rem' }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
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
            <div className="flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt="Wing spot photo"
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 
