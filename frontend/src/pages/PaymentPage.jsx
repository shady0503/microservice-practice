import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useBooking } from '@/hooks/useBooking';
import { useCreateTicket, usePayTicket } from '@/hooks/queries/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { PAYMENT_METHODS } from '@/config/constants';

export function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedBus,
    selectedLine,
    reservation,
    searchParams,
    setPaymentMethod,
    setTicket,
  } = useBooking();

  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS.CREDIT_CARD);
  const [error, setError] = useState(null);

  const createTicketMutation = useCreateTicket();
  const payTicketMutation = usePayTicket();

  const isProcessing = createTicketMutation.isPending || payTicketMutation.isPending;

  const handlePayment = async () => {
    setError(null);

    if (!reservation.seats || reservation.seats.length === 0) {
      setError({ message: 'No seats selected' });
      return;
    }

    try {
      // Step 1: Create ticket
      const ticketData = {
        userId: user?.id,
        busId: selectedBus.id,
        lineRef: selectedLine?.lineRef || selectedLine?.line,
        fromStation: searchParams.fromAddress || 'Origin',
        toStation: searchParams.toAddress || 'Destination',
        seatNumber: reservation.seats.join(','),
        passengerName: reservation.passengers[0]?.name,
        price: reservation.totalPrice,
        travelDate: searchParams.date || new Date().toISOString().split('T')[0],
      };

      const createdTicket = await createTicketMutation.mutateAsync(ticketData);

      // Step 2: Process payment
      await payTicketMutation.mutateAsync(createdTicket.id || createdTicket.ticketId);

      // Step 3: Store ticket and navigate
      setPaymentMethod(selectedMethod);
      setTicket(createdTicket);
      navigate(`/ticket/${createdTicket.id || createdTicket.ticketId}`);
    } catch (err) {
      setError(err);
    }
  };

  if (!reservation.seats || reservation.seats.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Reservation Found</h2>
            <p className="text-gray-600 mb-6">
              Please complete a reservation before proceeding to payment.
            </p>
            <Button onClick={() => navigate('/search')}>Start Booking</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const paymentMethods = [
    {
      id: PAYMENT_METHODS.CREDIT_CARD,
      name: 'Credit/Debit Card',
      description: 'Pay securely with your card',
      icon: CreditCard,
    },
    {
      id: PAYMENT_METHODS.MOBILE_PAYMENT,
      name: 'Mobile Payment',
      description: 'Pay with mobile wallet',
      icon: CreditCard,
    },
    {
      id: PAYMENT_METHODS.CASH,
      name: 'Pay on Bus',
      description: 'Pay cash when boarding',
      icon: CreditCard,
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
            <p className="text-gray-600">Complete your booking</p>
          </div>

          {error && <ErrorBanner error={error} onClose={() => setError(null)} className="mb-6" />}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Payment Method Selection */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>

              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            selectedMethod === method.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <Check className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium text-right">
                      {searchParams.fromAddress || 'Origin'} →{' '}
                      {searchParams.toAddress || 'Destination'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Bus:</span>
                    <span className="font-medium">
                      {selectedBus.busNumber || selectedBus.id}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats:</span>
                    <span className="font-medium">{reservation.seats.join(', ')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Passenger:</span>
                    <span className="font-medium">{reservation.passengers[0]?.name}</span>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {reservation.totalPrice} MAD
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="small" color="white" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirm & Pay
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By confirming, you agree to our terms and conditions
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default PaymentPage;
