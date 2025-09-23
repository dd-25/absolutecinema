import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import { RequireAuth, RequireAdmin, PublicOnly } from './components/RouteGuards';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CinemaDetails from './pages/CinemaDetails';
import SeatSelection from './pages/SeatSelection';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public routes */}
          <Route index element={<Home />} />
          <Route path="cinema/:cinemaId" element={<CinemaDetails />} />

          {/* Auth-related pages (public only) */}
          <Route path="login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* Protected routes */}
          <Route path="show/:showId/seats" element={<RequireAuth><SeatSelection /></RequireAuth>} />
          <Route path="booking/:bookingId/confirmation" element={<RequireAuth><BookingConfirmation /></RequireAuth>} />
          <Route path="bookings" element={<RequireAuth><BookingHistory /></RequireAuth>} />

          {/* Admin */}
          <Route path="admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
