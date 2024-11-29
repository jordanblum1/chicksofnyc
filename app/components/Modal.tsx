import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isPhotoModal?: boolean;
  onEscape?: () => void;
}

export default function Modal({ isOpen, onClose, children, isPhotoModal = false, onEscape }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isPhotoModal) {
          onClose();
        } else if (!document.querySelector('[data-photo-modal="true"]')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      if (!isPhotoModal) {
        document.body.style.overflow = 'hidden';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (!isPhotoModal) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose, isPhotoModal]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 ${isPhotoModal ? 'z-50' : 'z-40'} flex items-start justify-center overflow-y-auto`}
      data-photo-modal={isPhotoModal}
      style={{ paddingTop: 'calc(64px + 1rem)', paddingBottom: '1rem' }}
    >
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={`
          relative w-full max-w-4xl mx-4 
          ${isPhotoModal ? 'bg-black' : 'bg-white/95 backdrop-blur-sm'} 
          rounded-xl shadow-2xl 
          transform transition-all duration-300 ease-out
          animate-modal-slide-up
          hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]
        `}
        style={{ minHeight: 'min-content', maxHeight: 'calc(100vh - 96px)' }}
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200 z-10"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="overflow-y-auto max-h-[calc(100vh-96px)] rounded-xl">
          <div className="transform transition-all duration-300 ease-out">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 
