'use client';
import { useWingSpots } from "../hooks/useWingSpots";
import MenuBar from "../components/MenuBar";
import { formatNumber } from "../utils/formatNumber";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite, faStar } from '@fortawesome/free-solid-svg-icons';

export default function Rankings() {
  const { spots, loading, error } = useWingSpots('/api/get-all-wings');

  return (
    <div className="min-h-screen bg-[#FFF8EB] flex flex-col overflow-x-hidden">
      <MenuBar />
      <main className="flex-1 w-full px-4 sm:px-6 py-8" style={{ paddingTop: '84px' }}>
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 px-2">All Wing Rankings</h1>
          
          {loading && (
            <div className="text-center py-8">
              <p>Loading rankings...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 py-8">
              <p>{error}</p>
            </div>
          )}

          {/* Mobile View (Cards) */}
          <div className="lg:hidden space-y-4 px-2">
            {spots.map((spot, index) => (
              <div 
                key={spot.id}
                className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold shrink-0">#{index + 1}</span>
                      <h3 className="text-lg font-semibold truncate">{spot.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 truncate">{spot.address}</p>
                  </div>
                  <div className={`flex items-center gap-2 ml-4 shrink-0 ${
                    spot.overallRanking < 5 ? 'text-red-500' : 
                    spot.overallRanking >= 8 ? 'text-green-500' : 
                    'text-yellow-500'
                  }`}>
                    <FontAwesomeIcon 
                      icon={faStar} 
                      className="w-4 h-4"
                    />
                    <span className="font-bold whitespace-nowrap">{formatNumber(spot.overallRanking)}/10</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faDroplet} 
                      className="text-red-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Sauce</span>
                    <span className="font-semibold ml-1">{formatNumber(spot.sauce)}/10</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faFire} 
                      className="text-orange-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Crispy</span>
                    <span className="font-semibold ml-1">{formatNumber(spot.crispyness)}/10</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FontAwesomeIcon 
                      icon={faDrumstickBite} 
                      className="text-[#8B4513] w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-gray-500">Meat</span>
                    <span className="font-semibold ml-1">{formatNumber(spot.meat)}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#5D4037] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left w-16">Rank</th>
                    <th className="px-6 py-4 text-left">Spot Name</th>
                    <th className="px-6 py-4 text-left">Address</th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-500 w-4 h-4" />
                        <span>Overall</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDroplet} className="text-red-500 w-4 h-4" />
                        <span>Sauce</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faFire} className="text-orange-500 w-4 h-4" />
                        <span>Crispy</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center w-28">
                      <div className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faDrumstickBite} className="text-[#8B4513] w-4 h-4" />
                        <span>Meat</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((spot, index) => (
                    <tr 
                      key={spot.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 font-medium">{spot.name}</td>
                      <td className="px-6 py-4 text-gray-600">{spot.address}</td>
                      <td className={`px-6 py-4 text-center font-bold ${
                        spot.overallRanking < 5 ? 'text-red-500' : 
                        spot.overallRanking >= 8 ? 'text-green-500' : 
                        'text-yellow-500'
                      }`}>
                        {formatNumber(spot.overallRanking)}/10
                      </td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.sauce)}/10</td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.crispyness)}/10</td>
                      <td className="px-6 py-4 text-center">{formatNumber(spot.meat)}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
