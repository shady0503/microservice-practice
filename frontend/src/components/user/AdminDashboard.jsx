import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, Search, Edit2, Trash2, Shield, UserCog, 
  Filter, MoreVertical, Check, X, AlertCircle 
} from 'lucide-react'

const AdminDashboard = () => {
  const { getAllUsers, updateUserRole, deleteUser, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (newRole) => {
    try {
      setActionLoading(true)
      await updateUserRole(selectedUser.id, newRole)
      await fetchUsers()
      setShowRoleModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true)
      await deleteUser(selectedUser.id)
      await fetchUsers()
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200'
      case 'DRIVER':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (active) => {
    return active 
      ? 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
      : 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(147,51,234,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-light text-gray-900 tracking-tight">
                    Gestion des <span className="font-semibold">Utilisateurs</span>
                  </h1>
                  <p className="text-lg text-gray-600 font-light mt-1">
                    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-3xl overflow-hidden mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors duration-300" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 h-12 rounded-xl font-light transition-all duration-300"
                />
              </div>

              {/* Role Filter */}
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-600 transition-colors duration-300 pointer-events-none" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-12 pr-8 bg-gray-50/50 border border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 h-12 rounded-xl font-light transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="ALL">Tous les rôles</option>
                  <option value="USER">Utilisateurs</option>
                  <option value="DRIVER">Chauffeurs</option>
                  <option value="ADMIN">Administrateurs</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id}
              className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-semibold text-lg">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(user.active)}`}>
                          {user.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <span className="font-medium">Email:</span>
                          <span className="font-light">{user.email}</span>
                        </span>
                        {user.phoneNumber && (
                          <span className="flex items-center space-x-1">
                            <span className="font-medium">Tél:</span>
                            <span className="font-light">{user.phoneNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {currentUser?.id !== user.id && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowRoleModal(true)
                        }}
                        variant="outline"
                        className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl px-4 py-2 transition-all duration-300"
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        Rôle
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeleteModal(true)
                        }}
                        variant="outline"
                        className="border-2 border-red-200 text-red-700 hover:bg-red-50 rounded-xl px-4 py-2 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-light">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600" />
            <CardHeader className="pt-8">
              <CardTitle className="text-2xl font-light text-gray-900 tracking-tight">
                Modifier le <span className="font-semibold">rôle</span>
              </CardTitle>
              <CardDescription className="text-base text-gray-600 font-light">
                {selectedUser.firstName} {selectedUser.lastName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              {['USER', 'DRIVER', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={actionLoading || selectedUser.role === role}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedUser.role === role
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  } ${actionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900 capitalize">{role}</span>
                    </div>
                    {selectedUser.role === role && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}

              <Button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedUser(null)
                }}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-6 transition-all duration-300"
                disabled={actionLoading}
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />
            <CardHeader className="pt-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Confirmer la suppression
                </CardTitle>
              </div>
              <CardDescription className="text-base text-gray-600 font-light">
                Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
                <span className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
                ? Cette action est irréversible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <Button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium py-6 rounded-xl shadow-lg shadow-red-600/30 transition-all duration-300"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Supprimer l'utilisateur
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                variant="outline"
                className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-6 transition-all duration-300"
                disabled={actionLoading}
              >
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard

