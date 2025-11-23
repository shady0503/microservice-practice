import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, MapPin, Calendar, Navigation, Clock, Users, Shield, Smartphone, ArrowRight, Bus, Star, Zap, Check, LogIn, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import UserService from '@/components/UserService'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import { useAuth } from '@/contexts/AuthContext'

// ... [Previous useCounter, StatCard, FeatureCard components remain unchanged] ...
// Re-include them here for completeness if this file is fully replaced, 
// or assume they exist above if partial. For safety, I'll include the full file.

const useCounter = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => ref.current && observer.unobserve(ref.current)
  }, [])

  useEffect(() => {
    if (!isVisible) return
    let startTime
    let animationFrameId
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * (end - start) + start))
      if (progress < 1) animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isVisible, end, duration, start])

  return [count, ref]
}

const StatCard = ({ value, label, suffix = '' }) => {
  const numericValue = parseInt(value.replace(/\D/g, ''))
  const [count, ref] = useCounter(numericValue, 2000)
  return (
    <div ref={ref} className="group bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-100/50 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-500">
      <div className="text-5xl font-light text-gray-900 mb-3 tracking-tight">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{label}</div>
    </div>
  )
}

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTimeout(() => setIsVisible(true), index * 100)
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => ref.current && observer.unobserve(ref.current)
  }, [index])

  return (
    <div ref={ref} className={`group bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-100 hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3 tracking-tight">{feature.title}</h3>
      <p className="text-base text-gray-600 leading-relaxed">{feature.description}</p>
    </div>
  )
}

function App() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [currentPage, setCurrentPage] = useState('home') // 'home', 'login', 'register', 'dashboard'
  const { isAuthenticated, user } = useAuth()

  // Automatically redirect to dashboard if logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (currentPage === 'login' || currentPage === 'register') {
        setCurrentPage('dashboard')
      }
    }
  }, [isAuthenticated, currentPage])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          const sections = ['home', 'features', 'about', 'contact']
          const scrollPosition = window.scrollY + 100
          for (const section of sections) {
            const element = document.getElementById(section)
            if (element) {
              const { offsetTop, offsetHeight } = element
              if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                setActiveSection(section)
                break
              }
            }
          }
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = useMemo(() => [
    { icon: Search, title: 'Recherche Intelligente', description: 'Trouvez instantanément les meilleurs trajets disponibles.' },
    { icon: Calendar, title: 'Réservation Intuitive', description: 'Réservez votre place en quelques instants.' },
    { icon: Navigation, title: 'Suivi en Direct', description: 'Localisez votre bus en temps réel avec précision GPS.' },
    { icon: Clock, title: 'Horaires Actualisés', description: 'Consultez les horaires en temps réel de tous les trajets.' },
    { icon: Users, title: 'Abonnements Flexibles', description: 'Formules mensuelles et annuelles personnalisées.' },
    { icon: Smartphone, title: 'Notifications Intelligentes', description: 'Alertes sur les retards et modifications d\'horaires.' }
  ], [])

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // --- ROUTING ---

  if (currentPage === 'dashboard') {
    if (!isAuthenticated) {
      setCurrentPage('login')
      return null
    }
    return <UserService onBack={() => setCurrentPage('home')} />
  }

  if (currentPage === 'login') {
    return (
      <LoginPage 
        onBack={() => setCurrentPage('home')} 
        onNavigateToRegister={() => setCurrentPage('register')}
      />
    )
  }

  if (currentPage === 'register') {
    return (
      <RegisterPage 
        onBack={() => setCurrentPage('home')} 
        onNavigateToLogin={() => setCurrentPage('login')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 group-hover:scale-110 transition-transform duration-300">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-light text-gray-900 tracking-tight">
                Urban<span className="font-semibold">Move</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {['home', 'features', 'about', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-medium tracking-wide ${activeSection === section ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  {section === 'home' ? 'Accueil' : section === 'features' ? 'Fonctionnalités' : section === 'about' ? 'À propos' : 'Contact'}
                </button>
              ))}
            </div>
            <Button 
              onClick={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'login')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-300 flex items-center gap-2"
            >
              {isAuthenticated ? (
                <>
                  <User className="w-4 h-4" />
                  {user?.firstName || 'Mon Compte'}
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Connexion
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-24 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8 border border-blue-100 shadow-sm">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700 font-medium tracking-wide">Transport intelligent de nouvelle génération</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-light mb-6 text-gray-900 leading-tight tracking-tight">
              Votre Transport<br />
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Urbain Intelligent</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-16 leading-relaxed font-light">
              Recherchez, réservez et suivez vos bus en temps réel. Une expérience moderne et fluide pour vos déplacements quotidiens dans la région <span className="font-semibold text-blue-600">Temara · Rabat · Salé</span>
            </p>
          </div>

          {/* Search Card */}
          <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pb-6 pt-10 px-10">
              <CardTitle className="text-3xl font-light text-gray-900 tracking-tight mb-3">Rechercher un trajet</CardTitle>
              <CardDescription className="text-gray-600 text-base font-light">Trouvez le bus qui correspond parfaitement à vos besoins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-10 pb-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 tracking-wide">Départ</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                    <Input placeholder="Temara, Rabat, Salé..." value={from} onChange={(e) => setFrom(e.target.value)} className="pl-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-14 rounded-xl font-light transition-all duration-300" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 tracking-wide">Arrivée</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                    <Input placeholder="Temara, Rabat, Salé..." value={to} onChange={(e) => setTo(e.target.value)} className="pl-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 h-14 rounded-xl font-light transition-all duration-300" />
                  </div>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-7 h-auto rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] transition-all duration-300">
                <Search className="w-5 h-5 mr-3" />
                Rechercher votre trajet
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats, Features, About, Contact Sections (Simplified) */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value="50" label="Bus en Service" suffix="+" />
            <StatCard value="100" label="Trajets Quotidiens" suffix="+" />
            <StatCard value="10000" label="Utilisateurs Actifs" suffix="+" />
            <StatCard value="99" label="Ponctualité" suffix="%" />
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6 border border-blue-100 shadow-sm">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700 font-medium tracking-wide">Excellence & Innovation</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-light mb-6 text-gray-900 tracking-tight">Fonctionnalités <span className="font-semibold">Principales</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">Découvrez l'ensemble de nos outils conçus pour simplifier et optimiser vos déplacements urbains</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <FeatureCard key={`feature-${index}`} feature={feature} index={index} />)}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full mb-6 border border-blue-100 shadow-sm">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700 font-medium tracking-wide">Technologie avancée</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-light mb-6 text-gray-900 tracking-tight">À propos d'<span className="font-semibold">UrbanMove</span></h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-10 font-light">UrbanMoveMS est une plateforme de gestion de transport urbain fondée sur une architecture microservices moderne. Notre système assure une gestion efficace et sécurisée des utilisateurs, trajets, billetterie, abonnements et notifications en temps réel.</p>
              <div className="space-y-5">
                {[
                  { icon: Shield, text: 'Sécurité maximale avec JWT & OAuth2', color: 'from-green-50 to-emerald-50', iconColor: 'text-green-600' },
                  { icon: Navigation, text: 'Géolocalisation GPS haute précision', color: 'from-blue-50 to-indigo-50', iconColor: 'text-blue-600' },
                  { icon: Zap, text: 'Notifications instantanées personnalisées', color: 'from-yellow-50 to-amber-50', iconColor: 'text-yellow-600' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-5 group">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <span className="text-base text-gray-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 p-10 shadow-xl">
              <div className="space-y-8">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bus className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tracking-tight">Architecture</div>
                    <div className="text-base text-gray-500 font-light">Microservices</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {['API Gateway', 'Service Users', 'Service Trajets', 'Service Billetterie', 'Service Abonnements', 'Service Géolocalisation'].map((service, i) => (
                    <div key={i} className="group p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50 text-sm text-gray-700 font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">
                      <Check className="w-4 h-4 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-14 shadow-2xl border border-white/20">
            <h2 className="text-4xl sm:text-5xl font-light mb-5 text-gray-900 tracking-tight">Prêt à <span className="font-semibold">commencer</span> ?</h2>
            <p className="text-xl text-gray-600 mb-10 font-light leading-relaxed">Rejoignez des milliers d'utilisateurs qui simplifient leurs déplacements avec UrbanMove</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Button onClick={() => setCurrentPage('register')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-10 py-7 h-auto rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-105 transition-all duration-300">
                Créer un compte
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
              <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium px-10 py-7 h-auto rounded-xl hover:scale-105 transition-all duration-300">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-light text-white tracking-tight">Urban<span className="font-semibold">Move</span></span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed font-light">Votre solution de transport urbain pour la région Temara-Rabat-Salé</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5 tracking-wide">Services</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-light">
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Recherche de trajets</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Réservation de billets</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Suivi en temps réel</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Abonnements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5 tracking-wide">Région</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-light">
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Temara</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Rabat</li>
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">Salé</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-5 tracking-wide">Contact</h3>
              <ul className="space-y-3 text-sm text-gray-400 font-light">
                <li className="hover:text-blue-400 cursor-pointer transition-colors duration-300">support@urbanmove.ma</li>
                <li className="text-gray-500 leading-relaxed">Projet encadré par<br />Pr. Mahmoud Nassar</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500 font-light">© 2024 UrbanMoveMS. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App