import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';
import wingAnimation from '../animations/wings.json';

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

interface SharePreviewProps {
  spot: WingSpot;
  photoUrl: string;
  photos: string[];
  mapUrl: string;
}

export default function SharePreview({
  spot,
  photoUrl,
  photos,
  mapUrl,
}: SharePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Automatically generate image when component mounts
  useEffect(() => {
    generateShareImage();
  }, []); // Empty dependency array means this runs once on mount

  const generateShareImage = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-share-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotName: spot.name,
          address: spot.address,
          overallRating: spot.overallRanking,
          sauceRating: spot.sauce,
          crispynessRating: spot.crispyness,
          meatRating: spot.meat,
          instagram: spot.instagram,
          photoUrl,
          photos,
          mapUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating share image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!previewUrl) return;

    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${spot.name.toLowerCase().replace(/\s+/g, '-')}-review.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyImage = async () => {
    if (!previewUrl) return;
    
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy image:', err);
      alert('Failed to copy image. Try downloading instead.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-deep-orange-500 mb-2">Share {spot.name}</h2>
        <p className="text-gray-600">Download or copy the image to share on Instagram</p>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24 mb-4">
            <Lottie animationData={wingAnimation} loop={true} />
          </div>
          <p className="text-gray-600">Generating your share image...</p>
        </div>
      ) : previewUrl ? (
        <div className="space-y-4">
          <div className="relative aspect-[9/16] w-full max-w-md mx-auto overflow-hidden rounded-xl border-4 border-deep-orange-100">
            <Image
              src={previewUrl}
              alt={`${spot.name} review`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={downloadImage}
              className="bg-deep-orange-500 hover:bg-deep-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={copyImage}
              disabled={copySuccess}
              className={`bg-deep-orange-500 hover:bg-deep-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                copySuccess ? 'bg-green-500 hover:bg-green-500' : ''
              }`}
            >
              {copySuccess ? (
                <svg className="w-5 h-5 animate-[scale_0.3s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
} 