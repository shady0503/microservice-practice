import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';

export function ErrorBanner({ error, onClose, onRetry, className = '' }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message || 'An error occurred';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{message}</p>
            {error.errors && Object.keys(error.errors).length > 0 && (
              <ul className="mt-2 list-disc list-inside text-xs text-red-700">
                {Object.entries(error.errors).map(([field, msg]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
