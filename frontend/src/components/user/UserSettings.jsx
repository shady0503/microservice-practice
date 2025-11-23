import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings, Lock, Bell, Shield, Eye, EyeOff, 
  Check, Save, AlertCircle, Smartphone, Mail 
} from 'lucide-react'

const UserSettings = () => {
  const { user, changePassword, logout } = useAuth()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  })

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (passwordData.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      setSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationToggle = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const passwordStrength = passwordData.newPassword.length >= 8 ? 'Fort' : 'Faible'
  const passwordStrengthColor = passwordData.newPassword.length >= 8 ? 'from-green-500 to-emerald-500' : 'from-gray-200 to-gray-300'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-blue-50/20 py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(79,70,229,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 mb-6 shadow-lg shadow-indigo-600/30">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-3">
            Paramètres du <span className="font-semibold">Compte</span>
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Gérez vos préférences et votre sécurité
          </p>
        </div>

        <div className="space-y-8">
          {/* Security Settings */}
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600" />
            
            <CardHeader className="pt-10 pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-light text-gray-900 tracking-tight">
                    Sécurité du <span className="font-semibold">Compte</span>
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 font-light">
                    Changez votre mot de passe
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="flex-1">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">
                        Mot de passe modifié avec succès!
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                    Mot de passe actuel
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors duration-300" />
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      placeholder="Entrez votre mot de passe actuel"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="pl-12 pr-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 rounded-xl font-light transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                    Nouveau mot de passe
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors duration-300" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      placeholder="Minimum 8 caractères"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="pl-12 pr-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 rounded-xl font-light transition-all duration-300"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className={`flex-1 h-1.5 rounded-full bg-gradient-to-r ${passwordStrengthColor} transition-all duration-300`} />
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {passwordStrength}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 tracking-wide">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors duration-300" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirmez votre mot de passe"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="pl-12 pr-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 rounded-xl font-light transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Les mots de passe ne correspondent pas</span>
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-6 h-auto rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-[1.02] transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Changer le mot de passe
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pt-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-light text-gray-900 tracking-tight">
                    Préférences de <span className="font-semibold">Notification</span>
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 font-light">
                    Gérez comment vous souhaitez être notifié
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Notifications par email</p>
                    <p className="text-sm text-gray-600 font-light">Recevez des emails sur les mises à jour</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('emailNotifications')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    notificationSettings.emailNotifications ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Notifications push</p>
                    <p className="text-sm text-gray-600 font-light">Alertes instantanées sur votre appareil</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('pushNotifications')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    notificationSettings.pushNotifications ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Notifications SMS</p>
                    <p className="text-sm text-gray-600 font-light">Recevez des SMS pour les alertes importantes</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNotificationToggle('smsNotifications')}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    notificationSettings.smsNotifications ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-white/80 backdrop-blur-xl border border-red-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="pt-8 pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-red-50">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-light text-gray-900 tracking-tight">
                    Zone de <span className="font-semibold">Danger</span>
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600 font-light">
                    Actions irréversibles sur votre compte
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Button
                onClick={logout}
                variant="outline"
                className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-medium py-6 h-auto rounded-xl transition-all duration-300"
              >
                <Shield className="w-5 h-5 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UserSettings

