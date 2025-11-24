import { useState, useEffect } from 'react';
import { Bus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BusSelectionPage = ({ route, onSelectBus, onBack }) => {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    // Fetch live buses for this line
    fetch(`http://localhost:8080/api/buses/line/${route.lineRef}`)
      .then(res => res.json())
      .then(data => setBuses(data.filter(b => b.status === 'ACTIVE')))
      .catch(err => console.error(err));
  }, [route]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4">← Retour</Button>
      <h2 className="text-2xl font-light mb-6">Bus disponibles pour <span className="font-bold">{route.lineRef}</span></h2>
      
      <div className="grid gap-4">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white p-5 rounded-xl shadow-sm border flex justify-between items-center group hover:border-blue-400 transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">{bus.busNumber}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> En service • {bus.capacity} places
                </div>
              </div>
            </div>
            <Button onClick={() => onSelectBus(bus)}>Réserver</Button>
          </div>
        ))}
        {buses.length === 0 && <p>Aucun bus en circulation sur cette ligne pour le moment.</p>}
      </div>
    </div>
  );
};

export default BusSelectionPage;