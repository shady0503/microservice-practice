import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  User, Settings, Users, LogOut, Bus, 
  Home, Menu, X
} from 'lucide-react'
import UserProfile from './UserProfile'
import UserSettings from './UserSettings'
import AdminDashboard from './AdminDashboard'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const [activeView, setActiveView] = useState('profile')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  const navigation = [
    { id: 'profile', label: 'Mon Profil', icon: User, requiresAdmin: false },
    { id: 'settings', label: 'Paramètres', icon: Settings, requiresAdmin: false },
    { id: 'admin', label: 'Gestion Utilisateurs', icon: Users, requiresAdmin: true },
  ]

  const filteredNavigation = navigation.filter(item => !item.requiresAdmin || isAdmin)

  const renderView = () => {
    switch (activeView) {
      case 'profile':
        return <UserProfile />
      case 'settings':
        return <UserSettings />
      case 'admin':
        return isAdmin ? <AdminDashboard /> : <UserProfile />
      default:
        return <UserProfile />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-600/30">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-light text-gray-900 tracking-tight hidden sm:block">
                Urban<span className="font-bold">Move</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-medium ${
                      activeView === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/40'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/60 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-xs font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-600 capitalize font-medium">{user?.role?.toLowerCase()}</p>
                </div>
              </div>

              <Button
                onClick={logout}
                variant="outline"
                className="hidden sm:flex border-2 border-gray-300/80 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl px-4 py-2 transition-all duration-300 font-semibold shadow-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              {/* User Info Mobile */}
              <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>

              {/* Navigation Items */}
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      activeView === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}

              {/* Logout Button Mobile */}
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 border-2 border-red-200 transition-all duration-300 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        {renderView()}
      </div>
    </div>
  )
}

export default UserDashboard