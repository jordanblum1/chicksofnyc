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
        e.preventDefault(); // Prevent event from bubbling
        if (isPhotoModal) {
          onClose();
        } else if (!document.querySelector('[data-photo-modal="true"]')) {
          // Only close the spot modal if no photo modal is open
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
      className={`fixed inset-0 ${isPhotoModal ? 'z-50' : 'z-40'} flex items-center justify-center pt-16 px-4 pb-4`}
      data-photo-modal={isPhotoModal}
    >
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-5rem)] overflow-auto ${isPhotoModal ? 'bg-black' : ''}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
} 
