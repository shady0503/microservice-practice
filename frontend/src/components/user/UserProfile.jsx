import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Phone, Calendar, Shield, Save, X, Edit2, Check } from 'lucide-react'

const UserProfile = () => {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await updateProfile(formData)
      setSuccess(true)
      setIsEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
    })
    setIsEditing(false)
    setError('')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-indigo-50/30 py-6 px-4 relative overflow-hidden">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl shadow-blue-600/40 ring-4 ring-white/50">
              <User className="w-10 h-10 text-white" />
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                <Edit2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-2">
            Mon <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Profil</span>
          </h1>
          <p className="text-base text-gray-600 font-light">
            Gérez vos informations personnelles en toute sécurité
          </p>
        </div>

        {/* Enhanced Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/80 rounded-2xl backdrop-blur-sm shadow-lg shadow-green-200/50 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">Profil mis à jour avec succès!</p>
                <p className="text-xs text-green-600 font-light">Vos modifications ont été enregistrées</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Profile Card */}
        <Card className="bg-white/95 backdrop-blur-2xl border border-gray-200/60 shadow-2xl rounded-3xl overflow-hidden relative">
          {/* Enhanced gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-blue-600" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <CardHeader className="pt-8 pb-6 px-8 relative">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl font-light text-gray-900 tracking-tight mb-2">
                  Informations <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Personnelles</span>
                </CardTitle>
                <CardDescription className="text-base text-gray-600 font-light flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Vos données personnelles sont sécurisées et protégées
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl px-7 py-3 shadow-xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 transition-all duration-300 font-semibold"
                >
                  <Edit2 className="w-5 h-5 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-5 text-sm text-red-800 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200/80 rounded-2xl backdrop-blur-sm shadow-lg shadow-red-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 flex-shrink-0" />
                    <p className="flex-1 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Enhanced Email (read-only) */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 tracking-wide flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Adresse email
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <Input
                    type="email"
                    value={user.email}
                    className="pl-14 bg-gray-50/80 border-2 border-gray-200/60 text-gray-600 h-14 rounded-2xl font-light cursor-not-allowed shadow-sm"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 font-light flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  L'adresse email ne peut pas être modifiée pour des raisons de sécurité
                </p>
              </div>

              {/* Enhanced Name Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800 tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Prénom
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isEditing ? 'bg-gradient-to-r from-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100' : ''
                    }`} />
                    <User className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 transition-all duration-300 ${
                      isEditing ? 'text-gray-400 group-focus-within:text-blue-600 group-focus-within:scale-110' : 'text-gray-400'
                    }`} />
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`pl-14 h-14 rounded-2xl font-light transition-all duration-300 relative z-0 ${
                        isEditing 
                          ? 'bg-white/80 border-2 border-gray-200/60 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 shadow-sm hover:shadow-md' 
                          : 'bg-gray-50/80 border-2 border-gray-200/60 text-gray-700 cursor-not-allowed'
                      }`}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800 tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Nom
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                      isEditing ? 'bg-gradient-to-r from-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100' : ''
                    }`} />
                    <User className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 transition-all duration-300 ${
                      isEditing ? 'text-gray-400 group-focus-within:text-indigo-600 group-focus-within:scale-110' : 'text-gray-400'
                    }`} />
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`pl-14 h-14 rounded-2xl font-light transition-all duration-300 relative z-0 ${
                        isEditing 
                          ? 'bg-white/80 border-2 border-gray-200/60 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 shadow-sm hover:shadow-md' 
                          : 'bg-gray-50/80 border-2 border-gray-200/60 text-gray-700 cursor-not-allowed'
                      }`}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Phone Number */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-800 tracking-wide flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-600" />
                  Numéro de téléphone
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    isEditing ? 'bg-gradient-to-r from-purple-50/30 to-pink-50/30 opacity-0 group-hover:opacity-100' : ''
                  }`} />
                  <Phone className={`absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 transition-all duration-300 ${
                    isEditing ? 'text-gray-400 group-focus-within:text-purple-600 group-focus-within:scale-110' : 'text-gray-400'
                  }`} />
                  <Input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+212 6 12 34 56 78"
                    className={`pl-14 h-14 rounded-2xl font-light transition-all duration-300 relative z-0 ${
                      isEditing 
                        ? 'bg-white/80 border-2 border-gray-200/60 text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 shadow-sm hover:shadow-md' 
                        : 'bg-gray-50/80 border-2 border-gray-200/60 text-gray-700 cursor-not-allowed'
                    }`}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Enhanced Account Info (read-only) */}
              <div className="pt-8 border-t-2 border-gray-200/60">
                <h3 className="text-xl font-bold text-gray-900 mb-6 tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Informations du compte
                </h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="group relative overflow-hidden flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-blue-50/80 border-2 border-blue-200/40 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Rôle</p>
                      <p className="text-base text-gray-900 font-bold capitalize">{user.role}</p>
                    </div>
                  </div>
                  <div className="group relative overflow-hidden flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-indigo-50/80 border-2 border-indigo-200/40 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="relative flex-1">
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mb-1">Membre depuis</p>
                      <p className="text-base text-gray-900 font-bold">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-6 h-auto rounded-2xl shadow-xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-[1.02] transition-all duration-300 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        <span>Enregistrer les modifications</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300/80 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold py-6 h-auto rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md group"
                    disabled={loading}
                  >
                    <X className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Annuler</span>
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserProfile

