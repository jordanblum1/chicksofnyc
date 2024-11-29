'use client';
import MenuBar from '../components/MenuBar';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faDrumstickBite } from '@fortawesome/free-solid-svg-icons';

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
          <section className="card p-8 slide-up">
            <h2 className="text-2xl font-semibold mb-6 text-primary">Our Mission</h2>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-gray-700">
                I'm Jordan and I love a good chicken wing. I'm on a mission to find the best wings in NYC. Despite being so close to Buffalo it's been surprisingly difficult.
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
            <h2 className="text-2xl font-semibold mb-6 text-primary">Rating System</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faDroplet} className="icon-sauce w-6 h-6" />
                <div>
                  <h3 className="font-medium text-primary">Sauce (0-10)</h3>
                  <p className="text-gray-600">Flavor, consistency, and uniqueness</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faFire} className="icon-crispy w-6 h-6" />
                <div>
                  <h3 className="font-medium text-primary">Crispy-ness (0-10)</h3>
                  <p className="text-gray-600">Texture and cooking perfection</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faDrumstickBite} className="icon-meat w-6 h-6" />
                <div>
                  <h3 className="font-medium text-primary">Meat Quality (0-10)</h3>
                  <p className="text-gray-600">Size, tenderness, and juiciness</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
