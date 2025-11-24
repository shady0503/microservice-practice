import { useState } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const PaymentPage = ({ route, bus, onPaymentSuccess, onBack }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      // 1. Create Ticket
      const ticketRes = await fetch('http://localhost:8080/api/v1/tickets', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID() 
        },
        body: JSON.stringify({
          userId: user.id, // Using ID from Auth Context
          trajetId: route.routeId,
          busId: bus.id,
          quantity: 1
        })
      });
      
      if (!ticketRes.ok) throw new Error('Failed to reserve');
      const ticket = await ticketRes.json();

      // 2. Pay Ticket
      const payRes = await fetch(`http://localhost:8080/api/v1/tickets/${ticket.id}/pay`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID() 
        },
        body: JSON.stringify({ paymentMethod: 'CARD' })
      });

      if (payRes.ok) {
        onPaymentSuccess(ticket);
      }
    } catch (e) {
      alert('Erreur de paiement: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">← Annuler</Button>
      <Card className="p-6 bg-white shadow-xl rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Confirmation de Paiement</h2>
        
        <div className="space-y-4 mb-8 border-b pb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Ligne</span>
            <span className="font-semibold">{route.lineRef}</span>
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
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg rounded-xl shadow-lg shadow-green-600/20"
        >
          {processing ? 'Traitement...' : (
            <><CreditCard className="mr-2" /> Payer {route.price} MAD</>
          )}
        </Button>
      </Card>
    </div>
  );
};

export default PaymentPage;