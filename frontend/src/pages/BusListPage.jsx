import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bus as BusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/layout/PageTransition';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { ListSkeleton } from '@/components/ui/skeleton';
import { BusCard } from '@/components/booking/components/BusCard';
import { useBusesByLine } from '@/hooks/queries/useBuses';
import { useBooking } from '@/hooks/useBooking';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function BusListPage() {
  const navigate = useNavigate();
  const { lineId } = useParams();
  const { selectedLine, setSelectedBus } = useBooking();

  const { data: buses, isLoading, error, refetch } = useBusesByLine(lineId);

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    navigate(`/buses/${bus.busNumber || bus.id}/reserve`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/lines')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Routes
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BusIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedLine?.lineName || `Line ${lineId}`}
                </h1>
                <p className="text-gray-600">Select a bus to continue</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <ErrorBanner error={error} onRetry={refetch} className="mb-6" />
          )}

          {/* Loading */}
          {isLoading && <ListSkeleton count={4} />}

          {/* Buses List */}
          {!isLoading && buses && buses.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {buses.map((bus, index) => (
                <motion.div key={bus.id || index} variants={itemVariants}>
                  <BusCard bus={bus} onClick={() => handleBusSelect(bus)} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && buses && buses.length === 0 && (
            <div className="text-center py-12">
              <BusIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No Buses Available
              </h2>
              <p className="text-gray-500 mb-6">
                There are no active buses on this line at the moment.
              </p>
              <Button onClick={() => navigate('/search')}>
                Search Another Route
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
