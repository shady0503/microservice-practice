import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Bus, Route } from 'lucide-react'
import AdminDashboard from './AdminDashboard'
import BusManagement from './BusManagement'
import RouteManagement from './RouteManagement'

const AdminDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('users')

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'buses', label: 'Bus', icon: Bus },
    { id: 'routes', label: 'Lignes & Trajets', icon: Route },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <AdminDashboard />
      case 'buses':
        return <BusManagement />
      case 'routes':
        return <RouteManagement />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(147,51,234,0.05),transparent_50%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
            Panneau d'<span className="font-semibold">Administration</span>
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Gérez les utilisateurs, les bus et les lignes de votre système
          </p>
        </div>

        {/* Tabs */}
        <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden mb-8">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </div>
  )
}

export default AdminDashboardTabs
