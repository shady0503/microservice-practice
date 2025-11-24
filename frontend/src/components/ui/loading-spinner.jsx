import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'medium', color = 'primary', className = '' }) {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colors = {
    primary: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-2 border-t-transparent ${colors[color]} rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="large" />
    </div>
  );
}

export function InlineSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <LoadingSpinner size="medium" />
      <span className="text-gray-600">{text}</span>
    </div>
  );
}
