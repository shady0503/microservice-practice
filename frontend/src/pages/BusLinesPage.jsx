import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/layout/PageTransition';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LineCard } from '@/components/booking/components/LineCard';
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

export function BusLinesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { searchResults, setSelectedLine, searchParams: storedParams } = useBooking();

  // If no search results, redirect to search
  if (!searchResults || searchResults.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Routes Found</h2>
            <p className="text-gray-600 mb-6">
              Please perform a search to find available routes.
            </p>
            <Button onClick={() => navigate('/search')}>Go to Search</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleLineSelect = (line) => {
    setSelectedLine(line);
    navigate(`/lines/${line.lineRef || line.line}/buses`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/search')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Available Routes
                </h1>
                {storedParams.fromAddress && storedParams.toAddress && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {storedParams.fromAddress} → {storedParams.toAddress}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {searchResults.length} {searchResults.length === 1 ? 'route' : 'routes'} found
                </p>
              </div>
            </div>
          </div>

          {/* Routes List */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {searchResults.map((line, index) => (
              <motion.div key={index} variants={itemVariants}>
                <LineCard line={line} onClick={() => handleLineSelect(line)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

export default BusLinesPage;
