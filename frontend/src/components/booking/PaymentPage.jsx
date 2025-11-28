import { useState } from 'react';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { userIdToUUID } from '@/lib/uuidHelper';

const PaymentPage = ({ route, bus, onPaymentSuccess, onBack }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Convert user ID to UUID for ticket service
      const userUUID = userIdToUUID(user.id);

      // 1. Create Ticket with metadata
      const ticketRes = await fetch('http://localhost:8083/api/v1/tickets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          userId: userUUID,
          trajetId: route.routeId,
          quantity: 1,
          metadata: {
            lineRef: route.lineRef,
            lineName: route.routeName,
            busNumber: bus.busNumber,
            busId: bus.id
          }
        })
      });

      if (!ticketRes.ok) {
        const errorData = await ticketRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec de la réservation du billet');
      }

      const ticket = await ticketRes.json();

      // 2. Pay Ticket
      const payRes = await fetch(`http://localhost:8083/api/v1/tickets/${ticket.id}/pay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({
          paymentMethod: 'CREDIT_CARD',
          cardNumber: '4242424242424242' // Mock card for demo
        })
      });

      if (!payRes.ok) {
        const errorData = await payRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec du paiement');
      }

      const paidTicket = await payRes.json();
      onPaymentSuccess(paidTicket);

    } catch (e) {
      console.error('Payment error:', e);
      setError(e.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">← Annuler</Button>
      <Card className="p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Confirmation de Paiement</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Erreur de paiement</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8 border-b pb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Ligne</span>
            <span className="font-semibold">{route.lineRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Trajet</span>
            <span className="font-semibold text-sm">{route.routeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bus</span>
            <span className="font-semibold">{bus.busNumber}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-blue-600 mt-4">
            <span>Total</span>
            <span>{route.price} MAD</span>
          </div>
        </div>

        <Button
          onClick={handlePay}
          disabled={processing}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <><div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Traitement...</>
          ) : (
            <><CreditCard className="mr-2" /> Payer {route.price} MAD</>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Paiement sécurisé • Carte de test: **** 4242
        </p>
      </Card>
    </div>
  );
};

export default PaymentPage;