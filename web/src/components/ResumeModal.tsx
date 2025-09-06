'use client';

import { useEffect } from 'react';
import { XMarkIcon } from './Icons';
import { EnhancedResumeView } from './EnhancedResumeView';

interface ResumeModalProps {
  resume: {
    id: string;
    fileName: string;
    content?: string;
    rawContent?: string;
    skills: string[];
    experience?: number;
    education?: string;
    uploadedAt: string;
    parsedData?: any;
    aiSummary?: string;
    matchScore?: number;
    processingStatus?: string;
    analyzedAt?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function ResumeModal({ resume, isOpen, onClose }: ResumeModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 pt-8 pb-8">
          <div 
            className="relative w-full max-w-5xl bg-vtb-surface dark:bg-vtb-surface rounded-2xl shadow-2xl border border-border dark:border-gray-600 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-vtb-surface dark:bg-vtb-surface border-b border-border dark:border-gray-600 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm">
              <div>
                <h2 className="text-xl font-bold text-vtb-text dark:text-vtb-text">
                  Полный анализ резюме
                </h2>
                <p className="text-sm text-vtb-text-secondary dark:text-vtb-text-secondary mt-1">
                  {resume.fileName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-vtb-surface-secondary dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Закрыть"
              >
                <XMarkIcon className="w-5 h-5 text-vtb-text-secondary dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              <EnhancedResumeView resume={resume} />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-vtb-surface dark:bg-vtb-surface border-t border-border dark:border-gray-600 px-6 py-4 backdrop-blur-sm">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-vtb-text-secondary dark:text-gray-400 hover:text-vtb-text dark:hover:text-white transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement export functionality
                    console.log('Export resume', resume.id);
                  }}
                  className="px-4 py-2 bg-vtb-primary dark:bg-vtb-primary text-white text-sm font-medium rounded-lg hover:bg-vtb-primary-hover dark:hover:bg-vtb-primary-hover transition-colors"
                >
                  Экспорт PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Add modal styles for smooth animations
if (typeof document !== 'undefined' && !document.getElementById('resume-modal-styles')) {
  const modalStyles = `
    .modal-enter {
      opacity: 0;
      transform: scale(0.95);
    }
    .modal-enter-active {
      opacity: 1;
      transform: scale(1);
      transition: opacity 300ms, transform 300ms;
    }
    .modal-exit {
      opacity: 1;
      transform: scale(1);
    }
    .modal-exit-active {
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 300ms, transform 300ms;
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'resume-modal-styles';
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}