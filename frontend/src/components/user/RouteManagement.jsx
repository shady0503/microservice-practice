import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  MapPin, Search, Route, Navigation, Clock,
  AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react'

const RouteManagement = () => {
  const [lines, setLines] = useState([])
  const [filteredLines, setFilteredLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLine, setSelectedLine] = useState(null)
  const [lineDetails, setLineDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchLines()
  }, [])

  useEffect(() => {
    filterLines()
  }, [searchTerm, lines])

  const fetchLines = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8082/api/lines')
      if (!response.ok) throw new Error('Impossible de charger les lignes')

      const data = await response.json()
      setLines(data)
    } catch (err) {
      console.error('Error fetching lines:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLineDetails = async (ref) => {
    try {
      setLoadingDetails(true)
      const response = await fetch(`http://localhost:8082/api/lines/${ref}/complete`)
      if (!response.ok) throw new Error('Impossible de charger les détails')

      const data = await response.json()
      setLineDetails(data)
    } catch (err) {
      console.error('Error fetching line details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const filterLines = () => {
    let filtered = lines

    if (searchTerm) {
      filtered = filtered.filter(line =>
        line.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        line.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLines(filtered)
  }

  const handleLineClick = (line) => {
    setSelectedLine(line)
    fetchLineDetails(line.ref)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-light">Chargement des lignes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={fetchLines}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight">
            Gestion des <span className="font-semibold">Lignes</span>
          </h2>
          <p className="text-sm text-gray-600 font-light mt-1">
            {filteredLines.length} ligne{filteredLines.length > 1 ? 's' : ''} trouvée{filteredLines.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={fetchLines}
          variant="outline"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-300" />
            <Input
              type="text"
              placeholder="Rechercher par référence ou nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-12 rounded-xl font-light transition-all duration-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLines.map((line) => (
          <Card
            key={line.id}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer"
            onClick={() => handleLineClick(line)}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600" />

            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center shadow-lg shadow-green-600/30 group-hover:scale-110 transition-transform duration-300">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                  {line.ref}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {line.name || `Ligne ${line.ref}`}
              </h3>

              <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700 mt-4">
                <span className="text-sm font-medium">Voir les trajets</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLines.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-light">Aucune ligne trouvée</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Line Details Modal */}
      {selectedLine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600" />

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-light text-gray-900 tracking-tight mb-2">
                    Ligne <span className="font-semibold">{selectedLine.ref}</span>
                  </h2>
                  <p className="text-gray-600 font-light">{selectedLine.name}</p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedLine(null)
                    setLineDetails(null)
                  }}
                  variant="outline"
                  className="rounded-full"
                >
                  Fermer
                </Button>
              </div>

              {loadingDetails ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-light">Chargement des détails...</p>
                </div>
              ) : lineDetails ? (
                <div className="space-y-6">
                  {lineDetails.routes && lineDetails.routes.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Trajets ({lineDetails.routes.length})
                      </h3>
                      <div className="grid gap-4">
                        {lineDetails.routes.map((route, idx) => (
                          <Card key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Navigation className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-semibold text-gray-900">{route.name}</p>
                                    {route.stops && (
                                      <p className="text-sm text-gray-600">
                                        {route.stops.length} arrêt{route.stops.length > 1 ? 's' : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {route.direction}
                                </span>
                              </div>

                              {/* Show first few stops */}
                              {route.stops && route.stops.length > 0 && (
                                <div className="mt-3 ml-8 space-y-1">
                                  {route.stops.slice(0, 3).map((stop, stopIdx) => (
                                    <div key={stopIdx} className="flex items-center space-x-2 text-sm text-gray-600">
                                      <MapPin className="w-3 h-3" />
                                      <span>{stop.name}</span>
                                    </div>
                                  ))}
                                  {route.stops.length > 3 && (
                                    <p className="text-xs text-gray-500 ml-5">
                                      ... et {route.stops.length - 3} autre{route.stops.length - 3 > 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">Aucun trajet disponible</p>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RouteManagement
