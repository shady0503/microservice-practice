import { PageTransition } from '@/components/layout/PageTransition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserTickets } from '@/hooks/queries/useTickets';
import { Ticket, MapPin, Clock, TrendingUp, Search, ArrowRight, Bus, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { InlineSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useUserTickets(user?.id);

  const stats = [
    {
      label: 'Total Trips',
      value: tickets?.length || 0,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      label: 'Active Tickets',
      value: tickets?.filter(t => t.status === 'PAID').length || 0,
      icon: Ticket,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      label: 'Upcoming',
      value: 0,
      icon: Clock,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-200/30 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse delay-1000"></div>
        </div>

        <div className="relative">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">Here's an overview of your travel activity</p>
          </motion.div>

          {/* Quick Booking Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 border-0 shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <Bus className="w-7 h-7" />
                      Quick Book a Ride
                    </h2>
                    <p className="text-white/90 mb-4">
                      Find and reserve your next bus trip in seconds
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate('/search')}
                        className="bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search Routes
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      <Button
                        onClick={() => navigate('/lines')}
                        variant="outline"
                        className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm font-semibold transition-all duration-300"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View All Lines
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                    >
                      <Bus className="w-16 h-16 text-white" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 mb-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className={`p-6 relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</p>
                        <p className="text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                      </div>
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Recent Tickets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-gray-200/60 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Recent Tickets
                </h2>
                {tickets && tickets.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/search')}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {isLoading && <InlineSpinner text="Loading tickets..." />}

              {!isLoading && tickets && tickets.length > 0 && (
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket, idx) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => navigate(`/ticket/${ticket.id}`)}
                      className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md"
                        >
                          <Ticket className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {ticket.fromStation || 'Origin'} → {ticket.toStation || 'Destination'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Bus {ticket.busNumber || ticket.busId} • {new Date(ticket.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={ticket.status === 'PAID' ? 'success' : 'warning'}
                        className="group-hover:scale-110 transition-transform"
                      >
                        {ticket.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}

              {!isLoading && (!tickets || tickets.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Ticket className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">No tickets yet. Start your journey today!</p>
                  <Button
                    onClick={() => navigate('/search')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Book Your First Ride
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

export default DashboardPage;
