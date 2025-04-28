import { useState, useEffect } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';
import wingAnimation from '../animations/wings.json';
import logger from '../utils/logger';

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
  onClose?: () => void;
}

type ShareFormat = 'story' | 'square';

export default function SharePreview({
  spot,
  photoUrl,
  photos,
  mapUrl,
  onClose
}: SharePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyUrl, setStoryUrl] = useState<string | null>(null);
  const [squareUrl, setSquareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ShareFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only clean up URLs when modal closes
  useEffect(() => {
    return () => {
      if (storyUrl) URL.revokeObjectURL(storyUrl);
      if (squareUrl) URL.revokeObjectURL(squareUrl);
    };
  }, []);

  const generateShareImage = async (format: ShareFormat) => {
    setIsGenerating(true);
    setError(null);
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
          format
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate share image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      if (format === 'story') {
        setStoryUrl(url);
      } else {
        setSquareUrl(url);
      }
    } catch (error) {
      logger.error('APP', 'Error generating share image:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormatSelect = async (format: ShareFormat) => {
    setSelectedFormat(format);
    const existingUrl = format === 'story' ? storyUrl : squareUrl;
    if (!existingUrl) {
      await generateShareImage(format);
    }
  };

  const downloadImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = selectedFormat === 'story' ? storyUrl : squareUrl;
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = `${spot.name.toLowerCase().replace(/\s+/g, '-')}-${selectedFormat}-review.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = selectedFormat === 'story' ? storyUrl : squareUrl;
    if (!url) return;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      logger.error('APP', 'Failed to copy image:', err);
      alert('Failed to copy image. Try downloading instead.');
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentUrl = selectedFormat === 'story' ? storyUrl : squareUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl w-[95%] md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-xl" onClick={handleContainerClick}>
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-deep-orange-500">Share {spot.name}</h2>
            <p className="text-gray-600">Choose a format to generate your share image</p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleFormatSelect('story')}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 ${
                selectedFormat === 'story'
                  ? 'bg-deep-orange-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Story Format
            </button>
            <button
              onClick={() => handleFormatSelect('square')}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 ${
                selectedFormat === 'square'
                  ? 'bg-deep-orange-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Post Format
            </button>
          </div>

          <div className="relative">
            {error && (
              <div className="text-red-500 text-center mb-4">{error}</div>
            )}
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-12">
                <div className="w-16 md:w-24 h-16 md:h-24 mb-4">
                  <Lottie animationData={wingAnimation} loop={true} />
                </div>
                <p className="text-gray-600">Generating your share image...</p>
              </div>
            ) : selectedFormat && currentUrl ? (
              <div className="space-y-4 md:space-y-6">
                <div 
                  className={`relative mx-auto overflow-hidden rounded-xl shadow-lg ${
                    selectedFormat === 'story' 
                      ? 'w-[320px] h-[568px] md:w-[400px] md:h-[711px]'
                      : 'w-[320px] h-[320px] md:w-[448px] md:h-[448px]'
                  }`}
                  style={{ 
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Image
                    src={currentUrl}
                    alt={`${spot.name} review`}
                    fill
                    className="object-contain"
                    unoptimized
                    onError={() => setError('Failed to load image. Please try again.')}
                  />
                </div>
                <div className="flex justify-center gap-3 md:gap-4">
                  <button
                    onClick={downloadImage}
                    className="bg-deep-orange-500 hover:bg-deep-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={copyImage}
                    disabled={copySuccess}
                    className={`bg-deep-orange-500 hover:bg-deep-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base ${
                      copySuccess ? 'bg-green-500 hover:bg-green-500' : ''
                    }`}
                  >
                    {copySuccess ? (
                      <svg className="w-4 h-4 md:w-5 md:h-5 animate-[scale_0.3s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 text-gray-500">
                Select a format to generate your share image
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 