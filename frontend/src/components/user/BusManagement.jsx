import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bus, Search, Edit2, Trash2, Plus, Filter,
  MapPin, Activity, AlertCircle, RefreshCw
} from 'lucide-react'

const BusManagement = () => {
  const [buses, setBuses] = useState([])
  const [filteredBuses, setFilteredBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchBuses()
  }, [])

  useEffect(() => {
    filterBuses()
  }, [searchTerm, statusFilter, buses])

  const fetchBuses = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:8080/api/buses')
      if (!response.ok) throw new Error('Impossible de charger les bus')

      const data = await response.json()
      setBuses(data)
    } catch (err) {
      console.error('Error fetching buses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterBuses = () => {
    let filtered = buses

    if (searchTerm) {
      filtered = filtered.filter(bus =>
        bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.lineCode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(bus => bus.status === statusFilter)
    }

    setFilteredBuses(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
      case 'INACTIVE':
        return 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-gray-200'
      case 'MAINTENANCE':
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200'
      case 'OUT_OF_SERVICE':
        return 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-light">Chargement des bus...</p>
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
              onClick={fetchBuses}
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
            Gestion des <span className="font-semibold">Bus</span>
          </h2>
          <p className="text-sm text-gray-600 font-light mt-1">
            {filteredBuses.length} bus trouvé{filteredBuses.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={fetchBuses}
          variant="outline"
          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-4 py-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-300" />
              <Input
                type="text"
                placeholder="Rechercher par numéro de bus ou ligne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-12 rounded-xl font-light transition-all duration-300"
              />
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors duration-300 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 bg-gray-50/50 border border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-12 rounded-xl font-light transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Hors service</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bus List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuses.map((bus) => (
          <Card
            key={bus.id}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 group"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bus.status)}`}>
                  {bus.status}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Bus {bus.busNumber}
              </h3>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-light">
                    Ligne: {bus.lineCode || 'Non assignée'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-light">Capacité: {bus.capacity} places</span>
                </div>
                {bus.latitude && bus.longitude && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span className="font-mono text-xs">
                      {bus.latitude.toFixed(4)}, {bus.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBuses.length === 0 && (
          <div className="col-span-full">
            <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-light">Aucun bus trouvé</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusManagement
