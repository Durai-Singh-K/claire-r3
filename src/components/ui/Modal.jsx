import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useEscapeKey, useClickOutside, useFocusTrap } from '../../hooks/useCommon';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlay = true,
  className,
  overlayClassName,
  contentClassName,
  ...props
}) => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  };

  // Handle escape key
  useEscapeKey(() => {
    if (closeOnEscape && isOpen) {
      onClose();
    }
  }, isOpen);

  // Handle click outside
  const modalRef = useClickOutside(() => {
    if (closeOnOverlay && isOpen) {
      onClose();
    }
  }, isOpen);

  // Focus trap
  const focusTrapRef = useFocusTrap(isOpen);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fade-in',
        overlayClassName
      )}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        ref={(node) => {
          modalRef.current = node;
          focusTrapRef.current = node;
        }}
        className={cn(
          'relative bg-white rounded-lg shadow-xl',
          'w-full',
          sizes[size],
          'animate-scale-in',
          contentClassName
        )}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 pb-4">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className={cn('p-6', title && 'pt-0', className)}>
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
};

// Modal Header
const ModalHeader = ({ children, className, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

// Modal Body
const ModalBody = ({ children, className, ...props }) => (
  <div className={cn('mb-6', className)} {...props}>
    {children}
  </div>
);

// Modal Footer
const ModalFooter = ({ children, className, ...props }) => (
  <div 
    className={cn(
      'flex items-center justify-end space-x-3 pt-4 border-t border-gray-200',
      className
    )} 
    {...props}
  >
    {children}
  </div>
);

// Confirmation Modal
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  ...props
}) => {
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <ModalBody>
        <p className="text-gray-600">{message}</p>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'btn',
            variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
            variant === 'primary' && 'btn-primary'
          )}
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Confirm = ConfirmModal;

export default Modal;
export { ModalHeader, ModalBody, ModalFooter, ConfirmModal };
