import { motion } from 'framer-motion';
import { SEAT_STATUS } from '@/config/constants';

export function SeatSelector({ totalSeats = 40, occupiedSeats = [], selectedSeats = [], onSeatToggle, maxSeats = 4 }) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  const getSeatStatus = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return SEAT_STATUS.OCCUPIED;
    if (selectedSeats.includes(seatNumber)) return SEAT_STATUS.SELECTED;
    return SEAT_STATUS.AVAILABLE;
  };

  const getSeatColor = (status) => {
    switch (status) {
      case SEAT_STATUS.OCCUPIED:
        return 'bg-gray-300 cursor-not-allowed';
      case SEAT_STATUS.SELECTED:
        return 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700';
      case SEAT_STATUS.AVAILABLE:
      default:
        return 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200';
    }
  };

  const handleSeatClick = (seatNumber) => {
    const status = getSeatStatus(seatNumber);

    if (status === SEAT_STATUS.OCCUPIED) return;

    if (status === SEAT_STATUS.SELECTED) {
      // Deselect
      onSeatToggle(seatNumber, false);
    } else {
      // Select (if under max limit)
      if (selectedSeats.length < maxSeats) {
        onSeatToggle(seatNumber, true);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
          <span>Occupied</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600">
        <p>
          Selected: <strong>{selectedSeats.length}</strong> / {maxSeats} seats
        </p>
      </div>

      {/* Bus front indicator */}
      <div className="text-center py-2 bg-gray-100 rounded-t-lg border border-b-0">
        <p className="text-xs font-semibold text-gray-600">🚌 FRONT</p>
      </div>

      {/* Seat grid (4 columns for bus layout: 2-2 with aisle) */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 rounded-b-lg border">
        {seats.map((seatNumber) => {
          const status = getSeatStatus(seatNumber);
          const colorClass = getSeatColor(status);

          // Add spacing for aisle (between column 2 and 3)
          const isAisleSeat = seatNumber % 4 === 3;

          return (
            <motion.button
              key={seatNumber}
              whileHover={status !== SEAT_STATUS.OCCUPIED ? { scale: 1.1 } : {}}
              whileTap={status !== SEAT_STATUS.OCCUPIED ? { scale: 0.95 } : {}}
              onClick={() => handleSeatClick(seatNumber)}
              disabled={status === SEAT_STATUS.OCCUPIED}
              className={`
                ${colorClass}
                w-full aspect-square rounded-lg font-semibold text-sm
                border-2 border-transparent
                ${status === SEAT_STATUS.SELECTED ? 'border-blue-800' : ''}
                ${isAisleSeat ? 'mr-2' : ''}
                transition-colors
              `}
            >
              {seatNumber}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
