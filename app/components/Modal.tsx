import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isPhotoModal?: boolean;
}

export default function Modal({ isOpen, onClose, children, isPhotoModal = false }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className={`
          relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto
          ${isPhotoModal ? 'max-w-6xl' : 'max-w-2xl'}
          animate-modal-appear
        `}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <FontAwesomeIcon icon={faXmark} className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
} 
