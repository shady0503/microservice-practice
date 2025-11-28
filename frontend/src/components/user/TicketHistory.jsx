import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { userIdToUUID } from '@/lib/uuidHelper'
import {
  Ticket, Calendar, MapPin, CreditCard, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronRight, X, RefreshCw
} from 'lucide-react'

const TicketHistory = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [user])

  const fetchTickets = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Convert user ID to UUID for ticket service
      const userUUID = userIdToUUID(user.id)

      const response = await fetch(`http://localhost:8083/api/v1/tickets?userId=${userUUID}`)

      if (!response.ok) {
        throw new Error('Impossible de charger les billets')
      }

      const data = await response.json()
      setTickets(data)
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'RESERVED':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'EXPIRED':
        return <AlertCircle className="w-5 h-5 text-gray-600" />
      default:
        return <Ticket className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
      case 'RESERVED':
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200'
      case 'CANCELLED':
        return 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
      case 'EXPIRED':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    if (!price) return '0.00'
    return (price.amount / 100).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-light">Chargement de vos billets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4">
        <Card className="max-w-md bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={fetchTickets}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-light text-gray-900 tracking-tight">
                Mes <span className="font-semibold">Billets</span>
              </h1>
              <p className="text-lg text-gray-600 font-light mt-1">
                {tickets.length} billet{tickets.length > 1 ? 's' : ''} trouvé{tickets.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-light">Aucun billet trouvé</p>
              <p className="text-sm text-gray-500 font-light mt-2">
                Réservez votre premier trajet pour voir vos billets ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket)
                  setShowModal(true)
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {getStatusIcon(ticket.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Billet #{ticket.id.split('-')[0]}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-light">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-semibold">{formatPrice(ticket.price)} MAD</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-light">Ligne {ticket.metadata?.lineRef || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">Voir le billet</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            <CardHeader className="pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-light text-gray-900 tracking-tight mb-2">
                    Billet <span className="font-semibold">#{selectedTicket.id.split('-')[0]}</span>
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 font-light flex items-center space-x-2">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="capitalize">{selectedTicket.status.toLowerCase()}</span>
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="rounded-full w-10 h-10 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* QR Code */}
                {selectedTicket.status === 'PAID' && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-300 shadow-inner">
                      <QRCodeSVG value={`UM:${selectedTicket.id}`} size={200} />
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-light">
                      Présentez ce code au contrôleur
                    </p>
                  </div>
                )}

                {/* Ticket Details */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                    <p className="text-xs text-gray-500 font-medium mb-1">ID du Billet</p>
                    <p className="text-sm text-gray-900 font-mono">{selectedTicket.id}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                    <p className="text-xs text-blue-600 font-medium mb-1">Prix</p>
                    <p className="text-2xl text-blue-900 font-semibold">
                      {formatPrice(selectedTicket.price)} MAD
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                    <p className="text-xs text-gray-500 font-medium mb-1">Date de création</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                  </div>

                  {selectedTicket.paidAt && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                      <p className="text-xs text-green-600 font-medium mb-1">Date de paiement</p>
                      <p className="text-sm text-green-900">{formatDate(selectedTicket.paidAt)}</p>
                    </div>
                  )}

                  {selectedTicket.metadata && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50">
                      <p className="text-xs text-indigo-600 font-medium mb-2">Informations du trajet</p>
                      <div className="space-y-1 text-sm text-indigo-900">
                        {selectedTicket.metadata.lineRef && (
                          <p>Ligne: {selectedTicket.metadata.lineRef}</p>
                        )}
                        {selectedTicket.metadata.busNumber && (
                          <p>Bus: {selectedTicket.metadata.busNumber}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TicketHistory
