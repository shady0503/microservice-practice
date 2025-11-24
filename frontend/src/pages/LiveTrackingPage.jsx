import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LiveMap } from '@/components/booking/components/LiveMap';
import { useTicketById } from '@/hooks/queries/useTickets';
import { useGPSTracking } from '@/hooks/useGPSTracking';

export function LiveTrackingPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams();

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicketById(ticketId);
  const { location, connected, error: gpsError, isTracking } = useGPSTracking(ticketId);

  const isLoading = ticketLoading;
  const error = ticketError || gpsError;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <InlineSpinner text="Loading tracking information..." />
        </div>
      </PageTransition>
    );
  }

  if (error || !ticket) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            {error && <ErrorBanner error={error} />}
            <div className="text-center mt-6">
              <Button onClick={() => navigate(`/ticket/${ticketId}`)}>
                Back to Ticket
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const busPosition = location
    ? { lat: location.latitude, lon: location.longitude }
    : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/ticket/${ticketId}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ticket
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Live Bus Tracking
                </h1>
                <p className="text-gray-600">
                  Bus {ticket.busNumber || ticket.busId} • Line {ticket.lineRef || ticket.line}
                </p>
              </div>

              <Badge variant={connected ? 'success' : 'danger'}>
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <LiveMap
                busPosition={busPosition}
                route={[]}
                stops={[]}
                className="h-[500px] lg:h-[600px]"
              />

              {!isTracking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Real-time tracking will start once the bus begins its journey.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              {/* Trip Info */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Trip Information</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Route</p>
                      <p className="text-gray-600">
                        {ticket.fromStation || 'Origin'} → {ticket.toStation || 'Destination'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Departure</p>
                      <p className="text-gray-600">
                        {ticket.travelDate || new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Navigation className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Seat Number</p>
                      <p className="text-gray-600">{ticket.seatNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Live Location */}
              {location && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h2 className="text-lg font-semibold mb-4">Current Location</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-mono">{location.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-mono">{location.longitude.toFixed(6)}</span>
                      </div>
                      {location.speed !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span>{location.speed} km/h</span>
                        </div>
                      )}
                      {location.timestamp && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span>{new Date(location.timestamp).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Status */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm">
                    {connected ? 'Receiving live updates' : 'Waiting for connection'}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
