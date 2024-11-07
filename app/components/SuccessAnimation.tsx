'use client';
import Lottie from 'lottie-react';
import wingAnimation from '../animations/wings.json';

export default function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/30">
      <div className="w-64 h-64">
        <Lottie
          animationData={wingAnimation}
          loop={false}
          autoplay={true}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
} 