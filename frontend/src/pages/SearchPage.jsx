import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageTransition } from '@/components/layout/PageTransition';
import { useSearchRoutes } from '@/hooks/queries/useSearchRoutes';
import { useBooking } from '@/hooks/useBooking';

export function SearchPage() {
  const navigate = useNavigate();
  const { setSearchParams, setSearchResults } = useBooking();
  const { mutate: searchRoutes, isPending, error } = useSearchRoutes();

  const [formData, setFormData] = useState({
    fromLat: '',
    fromLon: '',
    toLat: '',
    toLon: '',
    fromAddress: '',
    toAddress: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseDemoData = () => {
    // Rabat Ville → Agdal
    setFormData({
      fromLat: '33.9716',
      fromLon: '-6.8498',
      toLat: '33.9931',
      toLon: '-6.8579',
      fromAddress: 'Rabat Ville Station',
      toAddress: 'Agdal',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const searchParams = {
      fromLat: parseFloat(formData.fromLat),
      fromLon: parseFloat(formData.fromLon),
      toLat: parseFloat(formData.toLat),
      toLon: parseFloat(formData.toLon),
      date: formData.date,
    };

    // Validate
    if (!searchParams.fromLat || !searchParams.toLat) {
      return;
    }

    searchRoutes(searchParams, {
      onSuccess: (results) => {
        // Store search params and results
        setSearchParams({
          ...searchParams,
          fromAddress: formData.fromAddress,
          toAddress: formData.toAddress,
        });
        setSearchResults(results);

        // Navigate to lines page
        navigate(`/lines?fromLat=${searchParams.fromLat}&fromLon=${searchParams.fromLon}&toLat=${searchParams.toLat}&toLon=${searchParams.toLon}`);
      },
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Ride</h1>
            <p className="text-gray-600">Search for available bus lines and book your ticket</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* From Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    From (Latitude, Longitude)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      name="fromLat"
                      placeholder="Latitude"
                      value={formData.fromLat}
                      onChange={handleInputChange}
                      required
                      step="any"
                    />
                    <Input
                      type="number"
                      name="fromLon"
                      placeholder="Longitude"
                      value={formData.fromLon}
                      onChange={handleInputChange}
                      required
                      step="any"
                    />
                  </div>
                  <Input
                    type="text"
                    name="fromAddress"
                    placeholder="Address (optional)"
                    value={formData.fromAddress}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                {/* To Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    To (Latitude, Longitude)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      name="toLat"
                      placeholder="Latitude"
                      value={formData.toLat}
                      onChange={handleInputChange}
                      required
                      step="any"
                    />
                    <Input
                      type="number"
                      name="toLon"
                      placeholder="Longitude"
                      value={formData.toLon}
                      onChange={handleInputChange}
                      required
                      step="any"
                    />
                  </div>
                  <Input
                    type="text"
                    name="toAddress"
                    placeholder="Address (optional)"
                    value={formData.toAddress}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Travel Date
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Error Display */}
                {error && <ErrorBanner error={error} />}

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <>
                        <LoadingSpinner size="small" color="white" className="mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search Routes
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseDemoData}
                  >
                    Use Demo Data
                  </Button>
                </div>
              </form>
            </Card>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Click "Use Demo Data" to quickly search for routes
                between Rabat Ville and Agdal.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
