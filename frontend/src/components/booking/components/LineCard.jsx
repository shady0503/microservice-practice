import { motion } from 'framer-motion';
import { Clock, DollarSign, TrendingRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LineCard({ line, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="p-4 hover:border-blue-500 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default" className="text-sm font-bold">
                {line.lineRef || line.line}
              </Badge>
              <h3 className="font-semibold text-lg">{line.lineName || `Line ${line.line}`}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{line.duration || line.estimatedDuration || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold text-gray-900">
                  {line.price ? `${line.price} MAD` : line.fare ? `${line.fare} MAD` : 'N/A'}
                </span>
              </div>
            </div>

            {line.nextDeparture && (
              <p className="text-xs text-gray-500 mt-2">
                Next departure: {line.nextDeparture}
              </p>
            )}
          </div>

          <div className="flex items-center ml-4">
            <TrendingRight className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {line.stops && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">{line.stops} stops</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
