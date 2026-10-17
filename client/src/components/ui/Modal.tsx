import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <div
          className={`relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all w-full ${widthClasses[maxWidth]} my-8 border border-zinc-200`}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-zinc-100 bg-zinc-50/50">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 leading-6">{title}</h3>
              {description && (
                <p className="mt-1 text-xs text-zinc-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
