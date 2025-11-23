import { useState } from 'react';
import { MapPin, Clock, ArrowRight, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const SearchPage = ({ onSelectRoute }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Mock coordinates for demo (Rabat Center -> Agdal)
  const searchRoutes = async () => {
    setLoading(true);
    try {
      // In real app: use Geocoding API to get lat/lon from text
      // Hardcoded for demo: Rabat Ville -> Agdal
      const params = new URLSearchParams({
        fromLat: '34.020882', fromLon: '-6.841650',
        toLat: '33.995923', toLon: '-6.847930'
      });
      
      const res = await fetch(`http://localhost:8082/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="mb-8 bg-white/90 backdrop-blur shadow-xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-2xl font-light mb-4">Planifier un trajet</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="Départ (Ex: Gare Rabat Ville)" defaultValue="Gare Rabat Ville" />
            <Input placeholder="Arrivée (Ex: Agdal)" defaultValue="Agdal" />
          </div>
          <Button onClick={searchRoutes} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {results.map((route) => (
          <div key={route.routeId} className="bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-sm">{route.lineRef}</span>
                <h3 className="font-semibold">{route.routeName}</h3>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {route.estimatedTimeMinutes} min</span>
                <span className="flex items-center gap-1"><Banknote className="w-4 h-4"/> {route.price} MAD</span>
              </div>
            </div>
            <Button onClick={() => onSelectRoute(route)} variant="outline">
              Choisir <ArrowRight className="w-4 h-4 ml-2"/>
            </Button>
          </div>
        ))}
        {results.length === 0 && !loading && <p className="text-center text-gray-500">Aucun résultat. Essayez la recherche de démo.</p>}
      </div>
    </div>
  );
};

export default SearchPage;