'use client';
import { useWingSpots } from "../hooks/useWingSpots";
import MenuBar from "../components/MenuBar";
import { formatNumber } from "../utils/formatNumber";

export default function Rankings() {
  const { spots, loading, error } = useWingSpots('/api/get-all-wings');

  return (
    <main className="min-h-screen bg-[#FFF8EB]">
      <MenuBar />
      <div className="max-w-6xl mx-auto px-4 py-8" style={{ paddingTop: '84px' }}>
        <h1 className="text-3xl font-bold mb-6">All Wing Rankings</h1>
        
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

        {spots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white shadow-lg rounded-lg">
              <thead className="bg-[#5D4037] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Spot Name</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-center">Overall</th>
                  <th className="px-4 py-3 text-center">Sauce</th>
                  <th className="px-4 py-3 text-center">Crispy-ness</th>
                  <th className="px-4 py-3 text-center">Meat</th>
                </tr>
              </thead>
              <tbody>
                {spots.map((spot, index) => (
                  <tr 
                    key={spot.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{spot.name}</td>
                    <td className="px-4 py-3 text-gray-600">{spot.address}</td>
                    <td className="px-4 py-3 text-center font-bold">{formatNumber(spot.overallRanking)}/5</td>
                    <td className="px-4 py-3 text-center">{formatNumber(spot.sauce)}/5</td>
                    <td className="px-4 py-3 text-center">{formatNumber(spot.crispyness)}/5</td>
                    <td className="px-4 py-3 text-center">{formatNumber(spot.meat)}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 