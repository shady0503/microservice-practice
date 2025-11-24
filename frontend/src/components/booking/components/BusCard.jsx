import { motion } from 'framer-motion';
import { Bus, Users, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function BusCard({ bus, onClick }) {
  const capacityPercentage = bus.capacity ? ((bus.occupied || 0) / bus.capacity) * 100 : 0;
  const availableSeats = bus.capacity - (bus.occupied || 0);

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { variant: 'success', label: 'Active' },
      INACTIVE: { variant: 'danger', label: 'Inactive' },
      MAINTENANCE: { variant: 'warning', label: 'Maintenance' },
    };

    const config = statusMap[status] || { variant: 'info', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="p-4 hover:border-blue-500 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Bus {bus.busNumber || bus.id}</h3>
              <p className="text-sm text-gray-500">{bus.lineRef || 'Unknown Line'}</p>
            </div>
          </div>
          {getStatusBadge(bus.status)}
        </div>

        <div className="space-y-3">
          {/* Capacity */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>Capacity</span>
              </div>
              <span className="font-semibold">
                {availableSeats} / {bus.capacity} seats available
              </span>
            </div>
            <Progress value={capacityPercentage} max={100} />
          </div>

          {/* Location/Next Stop */}
          {bus.currentLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{bus.currentLocation}</span>
            </div>
          )}

          {/* ETA */}
          {bus.eta && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Arrives in {bus.eta}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
