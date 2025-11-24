import { motion } from 'framer-motion';

export function Progress({ value = 0, max = 100, className = '', showLabel = false }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-600 mt-1 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}

export function StepProgress({ currentStep, totalSteps, steps = [] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                index < currentStep
                  ? 'bg-green-600 text-white'
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className="text-xs mt-1 text-gray-600">{step}</span>
          </div>
        ))}
      </div>
      <Progress value={currentStep} max={totalSteps - 1} />
    </div>
  );
}
