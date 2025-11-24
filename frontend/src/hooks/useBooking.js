import { useBookingStore } from '@/stores/bookingStore';

export function useBooking() {
  const {
    searchParams,
    searchResults,
    selectedLine,
    selectedBus,
    reservation,
    payment,
    ticket,
    setSearchParams,
    setSearchResults,
    setSelectedLine,
    setSelectedBus,
    updateReservation,
    setPaymentMethod,
    setPaymentStatus,
    setTicket,
    resetBooking,
  } = useBookingStore();

  return {
    // State
    searchParams,
    searchResults,
    selectedLine,
    selectedBus,
    reservation,
    payment,
    ticket,

    // Actions
    setSearchParams,
    setSearchResults,
    setSelectedLine,
    setSelectedBus,
    updateReservation,
    setPaymentMethod,
    setPaymentStatus,
    setTicket,
    resetBooking,

    // Computed values
    hasSearchParams: !!(searchParams.fromLat && searchParams.toLat),
    hasSelectedLine: !!selectedLine,
    hasSelectedBus: !!selectedBus,
    hasReservation: reservation.passengers.length > 0 && reservation.seats.length > 0,
    isComplete: !!ticket,
  };
}
