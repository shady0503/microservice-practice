import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Bell, Ticket, TrendingUp, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Search,
      title: 'Search Routes',
      description: 'Find the best bus routes to your destination',
    },
    {
      icon: Ticket,
      title: 'Book Tickets',
      description: 'Reserve your seat and pay securely online',
    },
    {
      icon: MapPin,
      title: 'Live Tracking',
      description: 'Track your bus in real-time on the map',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Get notified about delays and updates',
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'View your travel history and statistics',
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Book on the go with our mobile-optimized app',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>

        <div className="relative container mx-auto px-4 py-20 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Your Urban Journey <br />
            Starts Here
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 text-blue-100"
          >
            Book bus tickets, track in real-time, and travel smart
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('/search')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <Search className="w-5 h-5 mr-2" />
              Book a Ride Now
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose UrbanMove?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for a seamless travel experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of travelers using UrbanMove every day
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
          >
            Create Free Account
          </Button>
        </div>
      </div>
    </div>
  );
}
