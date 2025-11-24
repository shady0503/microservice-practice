import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { Bus, MapPin, Clock, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AuthPage = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Mobile: Top-left of form area */}
      {onBack && (
        <div className="lg:hidden absolute top-4 left-4 z-50">
          <Button
            variant="outline"
            onClick={onBack}
            className="group bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-blue-500 shadow-md hover:shadow-lg rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform duration-200 text-gray-700 group-hover:text-blue-600" />
            <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">Retour</span>
          </Button>
        </div>
      )}

      {/* Left Side - Design/Graphics */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 overflow-hidden">
        {/* Desktop: Return Button - Top-left of left panel */}
        {onBack && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              variant="outline"
              onClick={onBack}
              className="group bg-white/90 backdrop-blur-sm hover:bg-white border border-white/30 hover:border-white shadow-md hover:shadow-lg rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform duration-200 text-gray-800 group-hover:text-blue-600" />
              <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-200">Retour</span>
            </Button>
          </div>
        )}
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
        
        {/* Animated Circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-10 xl:px-12 text-white min-h-full py-8">
          <div className="relative min-h-[100px]">
            <div className={`transition-all duration-700 ease-in-out ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute inset-0'
            }`}>
              <div className="mb-3 w-full">
                <h1 className="text-4xl xl:text-5xl font-light mb-2 leading-tight min-h-[3.5rem] flex items-center">
                  Bon <span className="font-bold">retour</span>
                </h1>
                <p className="text-base text-blue-100 leading-relaxed max-w-md font-light">
                  Connectez-vous pour accéder à votre espace personnel et gérer vos déplacements urbains
                </p>
              </div>
            </div>
            
            <div className={`transition-all duration-700 ease-in-out ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 absolute inset-0'
            }`}>
              <div className="mb-3 w-full">
                <h1 className="text-4xl xl:text-5xl font-light mb-2 leading-tight min-h-[3.5rem] flex items-center">
                  Rejoignez <span className="font-bold">UrbanMove</span>
                </h1>
                <p className="text-base text-blue-100 leading-relaxed max-w-md font-light">
                  Créez votre compte en quelques instants et simplifiez vos déplacements quotidiens
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 auto-rows-fr">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                <Bus className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Transport Intelligent</h3>
              <p className="text-xs text-blue-100 leading-snug flex-grow">Gérez vos trajets facilement</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Suivi en Temps Réel</h3>
              <p className="text-xs text-blue-100 leading-snug flex-grow">Localisation GPS précise</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Horaires Actualisés</h3>
              <p className="text-xs text-blue-100 leading-snug flex-grow">Informations en direct</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-2.5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Communauté Active</h3>
              <p className="text-xs text-blue-100 leading-snug flex-grow">Rejoignez des milliers d'utilisateurs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form with sliding to opposite sides */}
      <div className="w-full lg:w-1/2 flex items-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 px-4 sm:px-6 py-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none" />
        
        {/* Full width container for sliding effect */}
        <div className="w-full h-full flex items-center relative">
          {/* Login Form - Slides to the opposite side when inactive */}
          <div
            className={`w-full max-w-md mx-auto transition-all duration-700 ease-out ${
              isLogin 
                ? 'opacity-100 translate-x-0 scale-100 relative z-10' 
                : 'opacity-0 translate-x-[50%] scale-95 pointer-events-none absolute left-0 right-0 z-0'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          </div>
          
          {/* Register Form - Slides to the opposite side when inactive */}
          <div
            className={`w-full max-w-md mx-auto transition-all duration-700 ease-out ${
              !isLogin 
                ? 'opacity-100 translate-x-0 scale-100 relative z-10' 
                : 'opacity-0 -translate-x-[50%] scale-95 pointer-events-none absolute left-0 right-0 z-0'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
