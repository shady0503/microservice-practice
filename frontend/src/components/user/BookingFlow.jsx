import { useState } from 'react'
import SearchPage from '../booking/SearchPage'
import BusSelectionPage from '../booking/BusSelectionPage'
import PaymentPage from '../booking/PaymentPage'
import TicketViewer from '../booking/TicketViewer'
import { Button } from '../ui/button'
import { Home } from 'lucide-react'

const BookingFlow = () => {
  const [step, setStep] = useState('search') // 'search' | 'selectBus' | 'payment' | 'ticket'
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedBus, setSelectedBus] = useState(null)
  const [ticket, setTicket] = useState(null)

  const handleRouteSelection = (route) => {
    setSelectedRoute(route)
    setStep('selectBus')
  }

  const handleBusSelection = (bus) => {
    setSelectedBus(bus)
    setStep('payment')
  }

  const handlePaymentSuccess = (ticketData) => {
    setTicket(ticketData)
    setStep('ticket')
  }

  const handleReset = () => {
    setStep('search')
    setSelectedRoute(null)
    setSelectedBus(null)
    setTicket(null)
  }

  return (
    <div className="relative">
      {/* Reset Button */}
      {step !== 'search' && step !== 'ticket' && (
        <div className="mb-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Nouvelle recherche
          </Button>
        </div>
      )}

      {/* Search Step */}
      {step === 'search' && (
        <SearchPage onSelectRoute={handleRouteSelection} />
      )}

      {/* Bus Selection Step */}
      {step === 'selectBus' && selectedRoute && (
        <BusSelectionPage
          route={selectedRoute}
          onSelectBus={handleBusSelection}
          onBack={() => setStep('search')}
        />
      )}

      {/* Payment Step */}
      {step === 'payment' && selectedRoute && selectedBus && (
        <PaymentPage
          route={selectedRoute}
          bus={selectedBus}
          onPaymentSuccess={handlePaymentSuccess}
          onBack={() => setStep('selectBus')}
        />
      )}

      {/* Ticket Viewer Step */}
      {step === 'ticket' && ticket && selectedBus && (
        <div>
          <div className="mb-6 text-center">
            <Button
              onClick={handleReset}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Réserver un autre trajet
            </Button>
          </div>
          <TicketViewer ticket={ticket} bus={selectedBus} />
        </div>
      )}
    </div>
  )
}

export default BookingFlow
