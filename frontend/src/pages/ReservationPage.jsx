import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBanner } from '@/components/ui/error-banner';
import { SeatSelector } from '@/components/booking/components/SeatSelector';
import { useBooking } from '@/hooks/useBooking';
import { useAuth } from '@/hooks/useAuth';

export function ReservationPage() {
  const navigate = useNavigate();
  const { busId } = useParams();
  const { user } = useAuth();
  const { selectedBus, selectedLine, updateReservation } = useBooking();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerInfo, setPassengerInfo] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });
  const [error, setError] = useState(null);

  // Mock occupied seats (would come from API in real implementation)
  const occupiedSeats = [1, 3, 7, 12, 18, 25];

  const pricePerSeat = selectedLine?.price || selectedLine?.fare || 15;
  const totalPrice = selectedSeats.length * pricePerSeat;

  const handleSeatToggle = (seatNumber, isSelected) => {
    setSelectedSeats((prev) => {
      if (isSelected) {
        return [...prev, seatNumber];
      } else {
        return prev.filter((seat) => seat !== seatNumber);
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPassengerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    // Validation
    if (selectedSeats.length === 0) {
      setError({ message: 'Please select at least one seat' });
      return;
    }

    if (!passengerInfo.name || !passengerInfo.email) {
      setError({ message: 'Please fill in all passenger details' });
      return;
    }

    // Store reservation data
    updateReservation({
      seats: selectedSeats,
      passengers: [passengerInfo],
      totalPrice,
    });

    // Navigate to payment
    navigate('/payment');
  };

  if (!selectedBus) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bus Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a bus to continue with your reservation.
            </p>
            <Button onClick={() => navigate('/search')}>Go to Search</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reserve Your Seat
            </h1>
            <p className="text-gray-600">
              Bus {selectedBus.busNumber || selectedBus.id} • Line {selectedLine?.lineRef || selectedLine?.line}
            </p>
          </div>

          {error && <ErrorBanner error={error} onClose={() => setError(null)} className="mb-6" />}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Seat Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Seats</h2>
                <SeatSelector
                  totalSeats={selectedBus.capacity || 40}
                  occupiedSeats={occupiedSeats}
                  selectedSeats={selectedSeats}
                  onSeatToggle={handleSeatToggle}
                  maxSeats={4}
                />
              </Card>
            </motion.div>

            {/* Passenger Info & Summary */}
            <div className="space-y-6">
              {/* Passenger Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Passenger Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={passengerInfo.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={passengerInfo.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={passengerInfo.phone}
                        onChange={handleInputChange}
                        placeholder="+212 6XX XXX XXX"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Price Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Selected Seats:</span>
                      <span className="font-medium">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per seat:</span>
                      <span className="font-medium">{pricePerSeat} MAD</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {totalPrice} MAD
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={selectedSeats.length === 0}
                    className="w-full mt-6"
                  >
                    Continue to Payment
                  </Button>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default ReservationPage;
