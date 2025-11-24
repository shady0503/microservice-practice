import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookingStore = create(
  persist(
    (set) => ({
      // Search parameters
      searchParams: {
        fromLat: null,
        fromLon: null,
        toLat: null,
        toLon: null,
        fromAddress: '',
        toAddress: '',
        date: null,
      },

      // Search results
      searchResults: [],

      // Selected line
      selectedLine: null,

      // Selected bus
      selectedBus: null,

      // Reservation details
      reservation: {
        passengers: [],
        seats: [],
        totalPrice: 0,
      },

      // Payment info
      payment: {
        method: null,
        status: 'pending',
      },

      // Ticket info
      ticket: null,

      // Actions
      setSearchParams: (params) =>
        set((state) => ({
          searchParams: { ...state.searchParams, ...params },
        })),

      setSearchResults: (results) =>
        set({ searchResults: results }),

      setSelectedLine: (line) =>
        set({ selectedLine: line }),

      setSelectedBus: (bus) =>
        set({ selectedBus: bus }),

      updateReservation: (reservationData) =>
        set((state) => ({
          reservation: { ...state.reservation, ...reservationData },
        })),

      setPaymentMethod: (method) =>
        set((state) => ({
          payment: { ...state.payment, method },
        })),

      setPaymentStatus: (status) =>
        set((state) => ({
          payment: { ...state.payment, status },
        })),

      setTicket: (ticket) =>
        set({ ticket }),

      resetBooking: () =>
        set({
          searchParams: {
            fromLat: null,
            fromLon: null,
            toLat: null,
            toLon: null,
            fromAddress: '',
            toAddress: '',
            date: null,
          },
          searchResults: [],
          selectedLine: null,
          selectedBus: null,
          reservation: {
            passengers: [],
            seats: [],
            totalPrice: 0,
          },
          payment: {
            method: null,
            status: 'pending',
          },
          ticket: null,
        }),
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({
        // Only persist essential data
        searchParams: state.searchParams,
        selectedLine: state.selectedLine,
        selectedBus: state.selectedBus,
        reservation: state.reservation,
      }),
    }
  )
);
