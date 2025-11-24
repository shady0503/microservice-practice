import { PageTransition } from '@/components/layout/PageTransition';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserTickets } from '@/hooks/queries/useTickets';
import { Ticket, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { InlineSpinner } from '@/components/ui/loading-spinner';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useUserTickets(user?.id);

  const stats = [
    { label: 'Total Trips', value: tickets?.length || 0, icon: TrendingUp, color: 'blue' },
    { label: 'Active Tickets', value: tickets?.filter(t => t.status === 'PAID').length || 0, icon: Ticket, color: 'green' },
    { label: 'Upcoming', value: 0, icon: Clock, color: 'yellow' },
  ];

  return (
    <PageTransition>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Here's an overview of your travel activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Tickets */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>

          {isLoading && <InlineSpinner text="Loading tickets..." />}

          {!isLoading && tickets && tickets.length > 0 && (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/ticket/${ticket.id}`)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {ticket.fromStation || 'Origin'} → {ticket.toStation || 'Destination'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Bus {ticket.busNumber || ticket.busId} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ticket.status === 'PAID' ? 'success' : 'warning'}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!tickets || tickets.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tickets yet. Start by booking a ride!</p>
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}

export default DashboardPage;
