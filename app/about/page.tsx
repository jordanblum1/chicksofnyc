'use client';
import MenuBar from '../components/MenuBar';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';

const WING_EMOJIS = Array(8).fill('🍗');

export default function About() {
  return (
    <div className="page-container">
      <MenuBar />
      <div className="content-container fade-in">
        <section className="card page-header p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white font-heading">About the Wing Man</h1>
            <p className="text-white/90 mt-2 text-lg">Discovering NYC's Hidden Wing Gems</p>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <section className="card p-8 slide-up overflow-hidden">
            <h2 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
            <span className="animate-wing-flap inline-block">🍗</span>
              The Plan?
              <span className="animate-wing-flap inline-block">🍗</span>
            </h2>
            
            <div className="relative mb-6 group">
              <Image
                src="/theplan.jpg"
                alt="The master plan"
                width={600}
                height={400}
                className="rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex flex-wrap justify-center gap-4 p-4">
                  {WING_EMOJIS.map((emoji, index) => (
                    <span
                      key={index}
                      className="text-3xl animate-wing-flap"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-gray-700 font-medium">
                Create a chicken wing reviewer personality to eventually get paid to eat chicken wings.
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                That's why I'm asking for your help. If you know of a place that has great wings, please visit our{' '}
                <Link href="/submit" className="link">
                  submission page
                </Link>
                !
              </p>
              <p className="text-lg leading-relaxed text-gray-700">
                Also you want to learn more about me or my other projects, feel free to start at{' '}
                <Link 
                  href="https://blumblumblum.com" 
                  className="link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  blumblumblum.com
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="card p-8 slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-semibold mb-8 text-primary flex items-center gap-2">
              Rating System
              <span className="animate-bounce inline-block">📊</span>
            </h2>
            <div className="space-y-8">
              <div className="p-6 rounded-xl hover:bg-primary/5 transition-colors duration-300 border border-primary/10">
                <div className="flex items-center gap-4 mb-3">
                  <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-8 h-8" />
                  <h3 className="font-medium text-xl text-primary">Sauce (0-10)</h3>
                </div>
                <p className="text-gray-600 text-lg">Flavor, consistency, and uniqueness</p>
              </div>
              
              <div className="p-6 rounded-xl hover:bg-primary/5 transition-colors duration-300 border border-primary/10">
                <div className="flex items-center gap-4 mb-3">
                  <FontAwesomeIcon icon={faFire} className="icon-crispy w-8 h-8" />
                  <h3 className="font-medium text-xl text-primary">Crispy-ness (0-10)</h3>
                </div>
                <p className="text-gray-600 text-lg">Texture and cooking perfection</p>
              </div>
              
              <div className="p-6 rounded-xl hover:bg-primary/5 transition-colors duration-300 border border-primary/10">
                <div className="flex items-center gap-4 mb-3">
                  <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-8 h-8" />
                  <h3 className="font-medium text-xl text-primary">Meat Quality (0-10)</h3>
                </div>
                <p className="text-gray-600 text-lg">Size, tenderness, and juiciness</p>
              </div>

              <div className="mt-8 p-4 bg-accent/10 rounded-xl">
                <p className="text-gray-700 text-center italic">
                  Honorable mentions might be added for ranch/blue cheese 
                  <span className="inline-block ml-2 animate-bounce">🥡</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
