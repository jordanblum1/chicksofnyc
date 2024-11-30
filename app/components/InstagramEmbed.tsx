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
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
    };

    loadInstagramEmbed();

    return () => {
      const script = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isMounted]);

  if (!isMounted) {
    return <div className="card h-full animate-pulse bg-gray-100"></div>;
  }

  return (
    <blockquote 
      className="instagram-media card h-full" 
      data-instgrm-permalink="https://www.instagram.com/chicksofnewyorkcity/"
      data-instgrm-version="14"
      style={{ 
        border: '0',
        margin: '1px',
        maxWidth: '100%',
        minWidth: '326px',
        padding: '0',
        width: '99.375%',
        height: '93%'
      }}
    ></blockquote>
  );
} 
