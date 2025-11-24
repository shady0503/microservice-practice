import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Calendar, MapPin, User, CreditCard } from 'lucide-react';

export function TicketCard({ ticket, showQR = false, children }) {
  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { variant: 'warning', label: 'Pending' },
      CONFIRMED: { variant: 'info', label: 'Confirmed' },
      PAID: { variant: 'success', label: 'Paid' },
      CANCELLED: { variant: 'danger', label: 'Cancelled' },
      EXPIRED: { variant: 'danger', label: 'Expired' },
    };

    const config = statusMap[status] || { variant: 'info', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">E-Ticket</h2>
            {getStatusBadge(ticket.status)}
          </div>
          <p className="text-blue-100 text-sm">Ticket ID: {ticket.id || ticket.ticketId}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Route Info */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Route</p>
              <p className="text-sm text-gray-600">
                {ticket.fromStation || ticket.origin} → {ticket.toStation || ticket.destination}
              </p>
            </div>
          </div>

          {/* Bus Info */}
          <div className="flex items-start gap-3">
            <Bus className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Bus Details</p>
              <p className="text-sm text-gray-600">
                Line: {ticket.lineRef || ticket.line} | Bus: {ticket.busNumber || ticket.busId}
              </p>
              {ticket.seatNumber && (
                <p className="text-sm text-gray-600">Seat: {ticket.seatNumber}</p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Travel Date</p>
              <p className="text-sm text-gray-600">
                {ticket.travelDate || new Date(ticket.createdAt).toLocaleDateString()}
              </p>
              {ticket.departureTime && (
                <p className="text-sm text-gray-600">Departure: {ticket.departureTime}</p>
              )}
            </div>
          </div>

          {/* Passenger Info */}
          {ticket.passengerName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Passenger</p>
                <p className="text-sm text-gray-600">{ticket.passengerName}</p>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Price</p>
              <p className="text-sm text-gray-600">
                {ticket.price || ticket.totalPrice} MAD
              </p>
            </div>
          </div>

          {/* QR Code area */}
          {showQR && children && (
            <div className="pt-4 border-t">
              <div className="flex justify-center">{children}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t">
          <p className="text-xs text-gray-500 text-center">
            Please show this ticket to the driver before boarding
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
