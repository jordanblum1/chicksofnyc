'use client';
import { useState } from 'react';
import MenuBar from '../components/MenuBar';
import dynamic from 'next/dynamic';

// Dynamic import with no SSR
const SuccessAnimation = dynamic(() => import('../components/SuccessAnimation'), {
  ssr: false,
});

export default function Submit() {
  const [formState, setFormState] = useState({
    placeName: '',
    address: '',
    additionalComments: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submit-wing-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setShowAnimation(true);
        setFormState({ placeName: '', address: '', additionalComments: '', email: '' });
        setTimeout(() => setShowAnimation(false), 2000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content bg-[#FFF8EB] min-h-screen">
      <MenuBar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <section className="hero text-center py-16 rounded-2xl bg-gradient-to-r from-[#5D4037] to-[#4E342E] text-white mb-12">
          <h1 className="text-5xl font-bold mb-4">Submit a Wing Spot</h1>
          <p className="text-xl text-[#FFF8EB] opacity-90">Help Us Find NYC's Best Wings</p>
        </section>

        <section className="form-section bg-white rounded-lg p-8 shadow-md">
          {submitSuccess ? (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg mb-6">
              Thanks for your suggestion! We'll check it out soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="placeName" className="block text-gray-700 font-medium mb-2">
                  Place Name
                </label>
                <input
                  type="text"
                  id="placeName"
                  name="placeName"
                  value={formState.placeName}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D4037] focus:border-transparent transition duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formState.address}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D4037] focus:border-transparent transition duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="additionalComments" className="block text-gray-700 font-medium mb-2">
                  Additional Comments
                </label>
                <textarea
                  id="additionalComments"
                  name="additionalComments"
                  value={formState.additionalComments}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D4037] focus:border-transparent transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5D4037] focus:border-transparent transition duration-200"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
                
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setFormState({placeName: '', address: '', additionalComments: '', email: ''});
                  }}
                >
                  Clear Form
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {showAnimation && <SuccessAnimation onComplete={() => setShowAnimation(false)} />}
    </div>
  );
} 
