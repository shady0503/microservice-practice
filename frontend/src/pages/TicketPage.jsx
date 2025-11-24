import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Share2, MapPin as MapPinIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/layout/PageTransition';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { QRCode } from '@/components/ui/qr-code';
import { TicketCard } from '@/components/booking/components/TicketCard';
import { useTicketById } from '@/hooks/queries/useTickets';

export function TicketPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();

  const { data: ticket, isLoading, error, refetch } = useTicketById(ticketId);

  const handleDownload = () => {
    // In a real implementation, this would generate and download a PDF
    alert('Download functionality would be implemented here');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'UrbanMove E-Ticket',
      text: `My ticket for bus ${ticket.busNumber || ticket.busId}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Ticket link copied to clipboard!');
    }
  };

  const handleTrackBus = () => {
    navigate(`/track/${ticketId}`);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <InlineSpinner text="Loading ticket..." />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <ErrorBanner error={error} onRetry={refetch} />
            <div className="text-center mt-6">
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!ticket) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h2>
            <p className="text-gray-600 mb-6">
              The requested ticket could not be found.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center"
          >
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <motion.svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-green-700">Your ticket has been successfully booked and paid.</p>
          </motion.div>

          {/* Ticket Card with QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TicketCard ticket={ticket} showQR>
              <QRCode value={ticket.id || ticket.ticketId} size={200} />
            </TicketCard>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6"
          >
            <Button variant="outline" onClick={handleDownload} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>

            <Button variant="outline" onClick={handleShare} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button onClick={handleTrackBus} className="w-full">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Track Bus
            </Button>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-white rounded-lg border"
          >
            <h3 className="font-semibold mb-2">Important Information</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Please arrive at the bus stop 10 minutes before departure</li>
              <li>• Show this QR code to the driver when boarding</li>
              <li>• Keep this ticket until the end of your journey</li>
              <li>• Track your bus in real-time using the "Track Bus" button</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
