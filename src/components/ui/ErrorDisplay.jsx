import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ErrorDisplay = ({
  error,
  type = 'error', // 'error', 'warning', 'info'
  title,
  message,
  details,
  onClose,
  actionButton,
  className = ''
}) => {
  const icons = {
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      title: 'text-red-900',
      button: 'text-red-600 hover:text-red-800'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      button: 'text-yellow-600 hover:text-yellow-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      button: 'text-blue-600 hover:text-blue-800'
    }
  };

  const Icon = icons[type];
  const style = styles[type];

  // Parse error object if provided
  const errorMessage = error?.message || message || 'An error occurred';
  const errorDetails = error?.details || details;
  const errorTitle = title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information');

  return (
    <div className={`rounded-lg border p-4 ${style.container} ${className}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={`flex-shrink-0 w-5 h-5 ${style.icon}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-sm font-semibold ${style.title} mb-1`}>
            {errorTitle}
          </h3>

          {/* Message */}
          <p className="text-sm">
            {errorMessage}
          </p>

          {/* Details */}
          {errorDetails && (
            <div className="mt-2">
              {Array.isArray(errorDetails) ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {errorDetails.map((detail, index) => (
                    <li key={index}>
                      {detail.field ? `${detail.field}: ${detail.message}` : detail.message || detail}
                    </li>
                  ))}
                </ul>
              ) : typeof errorDetails === 'object' ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {Object.entries(errorDetails).map(([field, msg]) => (
                    <li key={field}>
                      {field}: {msg}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{errorDetails}</p>
              )}
            </div>
          )}

          {/* Action Button */}
          {actionButton && (
            <div className="mt-3">
              {actionButton}
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors ${style.button}`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Inline error message for forms
export const InlineError = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-1.5 text-red-600 text-sm mt-1 ${className}`}>
      <AlertCircle size={14} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// Field error message
export const FieldError = ({ error, touched, className = '' }) => {
  if (!error || !touched) return null;

  return <InlineError message={error} className={className} />;
};

// Empty state with error
export const EmptyStateError = ({
  title = 'No data found',
  message = 'There was an error loading the data',
  icon: Icon = AlertCircle,
  actionButton,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 max-w-sm mb-4">{message}</p>
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default ErrorDisplay;
