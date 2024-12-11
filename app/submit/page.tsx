'use client';
import MenuBar from '../components/MenuBar';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Submit() {
  const [formData, setFormData] = useState({
    placeName: '',
    address: '',
    additionalComments: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-wing-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      toast.success(
        "Thanks for the submission! We'll check it out!", 
        {
          duration: 5000,
          icon: <FontAwesomeIcon icon={faCheck} className="text-green-500" />,
          style: {
            background: '#10B981',
            color: 'white',
            padding: '16px',
          },
        }
      );
      setFormData({ placeName: '', address: '', additionalComments: '', email: '' });
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        'Something went wrong. Please try again.', 
        {
          duration: 5000,
          icon: <FontAwesomeIcon icon={faXmark} className="text-red-500" />,
          style: {
            background: '#EF4444',
            color: 'white',
            padding: '16px',
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <MenuBar />
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'rounded-lg shadow-lg',
          duration: 5000,
        }}
      />
      <div className="content-container fade-in">
        <section className="card page-header p-8 mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white font-heading">Submit a Wing Spot</h1>
            <p className="text-white/90 mt-2 text-lg">Know a great wing spot? Let us know and we'll check it out!</p>
          </div>
        </section>

        <div className="card p-8 slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="placeName" className="block text-sm font-medium text-gray-700 mb-1">
                Spot Name
              </label>
              <input
                type="text"
                id="placeName"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.placeName}
                onChange={(e) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
                placeholder="e.g. Wing Heaven"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="e.g. 123 Wing Street, New York, NY"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="additionalComments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                id="additionalComments"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.additionalComments}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalComments: e.target.value }))}
                placeholder="Tell us what makes their wings special..."
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Wing Spot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
