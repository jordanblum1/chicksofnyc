'use client';
import MenuBar from '../components/MenuBar';
import { useState } from 'react';

export default function Submit() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/submit-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      setSubmitStatus('success');
      setFormData({ name: '', address: '', comments: '' });
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <MenuBar />
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Spot Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                id="comments"
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
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

              {submitStatus === 'success' && (
                <p className="text-green-600">Thanks for the submission! We'll check it out!</p>
              )}
              {submitStatus === 'error' && (
                <p className="text-red-500">Something went wrong. Please try again.</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
