'use client';
import { useEffect, useState } from "react";
import Image from "next/image";
import MenuBar from "./components/MenuBar";

interface WingSpot {
  id: string;
  name: string;
  address: string;
  overallRanking: number;
  sauce: number;
  crispyness: number;
  meat: number;
}

export default function Home() {
  const [topSpots, setTopSpots] = useState<WingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSpots = async () => {
      try {
        const response = await fetch('/api/get-top-wings');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setTopSpots(data.data);
      } catch (err) {
        setError('Failed to load top wing spots');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSpots();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4" style={{ paddingTop: '64px' }}>
      <MenuBar />
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/chicks-of-nyc-logo.png"
          alt="NYC Chicks Logo"
          width={400}
          height={400}
          priority
        />
      </div>

      {/* Top Wings Section */}
      <div className="w-full max-w-3xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Top Wing Spots</h2>
        {loading && <p className="text-center">Loading top spots...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {topSpots.length > 0 && (
          <div className="space-y-4">
            {topSpots.map((spot, index) => (
              <div 
                key={spot.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">#{index + 1} {spot.name}</h3>
                  <span className="text-lg font-bold text-[#5D4037]">
                    {spot.overallRanking}/5
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{spot.address}</p>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Sauce:</span> {spot.sauce}/5
                  </div>
                  <div>
                    <span className="font-semibold">Crispy-ness:</span> {spot.crispyness}/5
                  </div>
                  <div>
                    <span className="font-semibold">Meat:</span> {spot.meat}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl">
        <iframe
          src="https://www.google.com/maps/d/u/0/embed?mid=13UCUpt_uJToGhcRjSQltSAbXV9zNDWg&ehbc=2E312F"
          width="640"
          height="480"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </main>
  );
}
