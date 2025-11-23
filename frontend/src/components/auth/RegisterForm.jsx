import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react'

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      await register(formData)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const hasMinLength = formData.password.length >= 8

  return (
    <div className="w-full">
      <Card className="w-full relative bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-2xl rounded-2xl overflow-hidden">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600" />
        
        <CardHeader className="text-center pt-5 pb-3 px-6">
          <CardTitle className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight mb-1.5">
            Rejoignez <span className="font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">UrbanMove</span>
          </CardTitle>
          <CardDescription className="text-xs text-gray-600 font-light">
            Créez votre compte et simplifiez vos déplacements
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start space-x-1.5">
                  <div className="w-1 h-1 rounded-full bg-red-600 mt-1 flex-shrink-0"></div>
                  <p className="flex-1 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                  Prénom
                </label>
                <div className="relative group">
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-600 transition-colors duration-300" />
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-9 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-10 text-sm rounded-lg font-light transition-all duration-300"
                    required
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                  Nom
                </label>
                <div className="relative group">
                  <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-600 transition-colors duration-300" />
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-9 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-10 text-sm rounded-lg font-light transition-all duration-300"
                    required
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                Adresse email
              </label>
              <div className="relative group">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-600 transition-colors duration-300" />
                <Input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-10 text-sm rounded-lg font-light transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-600 transition-colors duration-300" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-10 text-sm rounded-lg font-light transition-all duration-300"
                  required
                  minLength={8}
                />
              </div>
              
              {/* Compact Password strength indicator */}
              {formData.password && (
                <div className="flex items-center space-x-1.5 pt-0.5">
                  <div className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                    hasMinLength 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gray-200'
                  }`} />
                  <span className={`text-xs font-semibold transition-colors duration-300 ${
                    hasMinLength ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {hasMinLength ? 'Fort' : 'Faible'}
                  </span>
                  {hasMinLength && (
                    <Check className="w-3 h-3 text-green-600" />
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Check className={`w-3 h-3 transition-colors duration-300 ${
                  hasMinLength ? 'text-green-600' : 'text-gray-400'
                }`} />
                <p className={`transition-colors duration-300 ${
                  hasMinLength ? 'text-green-600' : 'text-gray-500'
                }`}>
                  Minimum 8 caractères requis
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                Téléphone <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
              </label>
              <div className="relative group">
                <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-600 transition-colors duration-300" />
                <Input
                  type="tel"
                  name="phoneNumber"
                  placeholder="+212 6 12 34 56 78"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="pl-9 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-10 text-sm rounded-lg font-light transition-all duration-300"
                  maxLength={20}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3.5 h-auto rounded-lg shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-[1.01] transition-all duration-300 group text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer mon compte
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </Button>

            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500 font-medium">ou</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-600 font-light">
                Vous avez déjà un compte?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center group transition-colors duration-200 text-xs"
                >
                  Se connecter
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegisterForm