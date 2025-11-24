import { Routes, Route, Navigate } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { BusLinesPage } from './pages/BusLinesPage';
import { BusListPage } from './pages/BusListPage';
import { ReservationPage } from './pages/ReservationPage';
import { PaymentPage } from './pages/PaymentPage';
import { TicketPage } from './pages/TicketPage';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes with RootLayout */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Booking flow (accessible to all) */}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/lines" element={<BusLinesPage />} />
        <Route path="/lines/:lineId/buses" element={<BusListPage />} />
        <Route path="/buses/:busId/reserve" element={<ReservationPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/ticket/:ticketId" element={<TicketPage />} />
        <Route path="/track/:ticketId" element={<LiveTrackingPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/tickets" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
