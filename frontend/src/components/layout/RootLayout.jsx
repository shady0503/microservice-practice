import { Outlet } from 'react-router-dom';
import { Bus } from 'lucide-react';

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Bus className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold">UrbanMove</span>
            </a>
            <nav className="flex items-center gap-6">
              <a href="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
                Book a Ride
              </a>
              <a href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                Dashboard
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          © 2025 UrbanMove. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default RootLayout;
