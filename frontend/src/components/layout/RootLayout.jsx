import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bus, Search, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function RootLayout() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Navbar */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
              >
                <Bus className="w-6 h-6 text-blue-600" />
              </motion.div>
              <span className="text-2xl font-bold text-white">UrbanMove</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/search"
                  className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Book a Ride</span>
                </Link>
              </motion.div>

              {isAuthenticated ? (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="ghost"
                      className="text-white hover:bg-white/20 border-white/30"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => navigate('/register')}
                      className="bg-white text-purple-600 hover:bg-gray-100"
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bus className="w-6 h-6" />
                <span className="text-xl font-bold">UrbanMove</span>
              </div>
              <p className="text-gray-400 text-sm">
                The smartest way to travel around the city.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/search" className="hover:text-white">Book a Ride</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">My Account</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
            © 2025 UrbanMove. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default RootLayout;
