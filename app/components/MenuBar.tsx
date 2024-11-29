'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/about', label: 'About' },
  { href: '/submit', label: 'Submit a Spot' }
];

export default function MenuBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 navbar ${isScrolled ? 'shadow-lg' : ''}`}>
      <div className="navbar-content">
        <Link href="/" className="navbar-logo">
          <Image
            src="/chicks-of-nyc-logo.png"
            alt="NYC Chicks Logo"
            width={50}
            height={50}
            className="hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="text-white hover:text-accent transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden text-white p-2 hover:text-accent transition-colors duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-primary shadow-lg sm:hidden">
            <div className="py-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="block px-4 py-2 text-white hover:bg-primary-dark transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
