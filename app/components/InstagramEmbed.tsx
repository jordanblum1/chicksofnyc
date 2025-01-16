'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

export default function InstagramEmbed() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const loadInstagramEmbed = () => {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };

      document.body.appendChild(script);
    };

    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      loadInstagramEmbed();
    } else if (window.instgrm) {
      window.instgrm.Embeds.process();
    }

    return () => {
      const script = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="card min-h-[450px] animate-pulse bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">Loading Instagram feed...</div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden mb-8">
      <iframe
        src="https://www.instagram.com/chicksofnyc/embed"
        className="w-full min-h-[450px] md:min-h-[500px] border-none"
        loading="lazy"
        allowFullScreen
      ></iframe>
    </div>
  );
} 
