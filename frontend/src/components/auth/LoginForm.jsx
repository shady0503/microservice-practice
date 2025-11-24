import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogIn, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

const LoginForm = ({ onSwitchToRegister, onNavigateToRegister, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Call onSuccess callback after successful login
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <Card className="w-full relative bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-2xl rounded-2xl overflow-hidden">
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />
        
        <CardHeader className="text-center pt-5 pb-3 px-6">
          <div className="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full mb-3 mx-auto shadow-sm border border-blue-100/40">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide">Espace Membre</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-light text-gray-900 tracking-tight mb-1.5">
            Bon <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">retour</span>
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 font-light leading-relaxed">
            Connectez-vous pour accéder à votre espace personnel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-6 pb-5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start space-x-1.5">
                  <div className="w-1 h-1 rounded-full bg-red-600 mt-1.5 flex-shrink-0"></div>
                  <p className="flex-1 font-medium">{error}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                Adresse email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors duration-300" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-12 text-sm rounded-lg font-light transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-800 tracking-wide">
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
                >
                  Oublié ?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-600 transition-colors duration-300" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-3 bg-gray-50/80 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 h-12 text-sm rounded-lg font-light transition-all duration-300"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-5 h-auto rounded-lg shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-[1.01] transition-all duration-300 group text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500 font-medium">ou</span>
              </div>
            </div>

            <div className="text-center pt-0.5">
              <p className="text-sm text-gray-600 font-light">
                Pas encore de compte?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister || onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center group transition-colors duration-200 text-sm"
                >
                  Créer un compte
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm