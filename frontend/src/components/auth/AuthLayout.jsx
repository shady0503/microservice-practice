import { Bus, MapPin, Clock, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AuthLayout = ({ children, title, subtitle, onBack }) => {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Mobile: Top-left Return Button */}
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
        {/* Desktop: Return Button */}
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
          <div className="mb-8 w-full">
            <h1 className="text-4xl xl:text-5xl font-light mb-2 leading-tight min-h-[3.5rem] flex items-center">
              {title}
            </h1>
            <p className="text-base text-blue-100 leading-relaxed max-w-md font-light">
              {subtitle}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
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

      {/* Right Side - Content */}
      <div className="w-full lg:w-1/2 flex items-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 px-4 sm:px-6 py-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.04),transparent_50%)] pointer-events-none" />
        
        <div className="w-full h-full flex items-center justify-center relative z-10">
          <div className="w-full max-w-md mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout