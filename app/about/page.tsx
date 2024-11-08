'use client';
import MenuBar from '../components/MenuBar';
import Link from 'next/link';

export default function About() {
  return (
    <div className="page-content bg-[#FFF8EB] min-h-screen">
      <MenuBar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <section className="hero text-center py-16 rounded-2xl bg-gradient-to-r from-[#5D4037] to-[#4E342E] text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">About the Wing Man</h1>
          <p className="text-xl text-[#FFF8EB] opacity-90">Discovering NYC's Hidden Wing Gems</p>
        </section>

        <section className="content my-12 bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-3xl font-semibold mb-6 text-[#4E342E]">Our Mission</h2>
          <p className="text-lg leading-relaxed text-gray-700 mb-6">
            I'm Jordan and I love a good chicken wing. I'm on a mission to find the best wings in NYC. Despite being so close to Buffalo it's been surprisingly difficult.
            That's why I'm asking for your help. If you know of a place that has great wings, please visit our{' '}
            <Link 
              href="/submit" 
              className="link link-accent"
            >
              submission page
            </Link>
            !
            <br />
            <br />
            Also you want to learn more about me or my other projects, feel free to start at{' '}
            <Link 
              href="https://blumblumblum.com" 
              className="link link-accent" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              blumblumblum.com
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
