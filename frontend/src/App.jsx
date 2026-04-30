import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import HomePage           from './pages/HomePage';
import MatchDetailPage    from './pages/MatchDetailPage';
import MyTicketsPage      from './pages/MyTicketsPage';
import TicketDetailPage   from './pages/TicketDetailPage';
import NotificationsPage  from './pages/NotificationsPage';
import ProfilePage        from './pages/ProfilePage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMatchFormPage from './pages/AdminMatchFormPage';
import AdminUsersPage     from './pages/AdminUsersPage';
import AdminBookingsPage  from './pages/AdminBookingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* ── PUBLIC ─────────────────────────────── */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/match/:id" element={<MatchDetailPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />

          {/* ── CLIENT ─────────────────────────────── */}
          <Route path="/my-tickets" element={
            <PrivateRoute roles={['client']}><MyTicketsPage /></PrivateRoute>
          } />
          <Route path="/my-tickets/:id" element={
            <PrivateRoute roles={['client']}><TicketDetailPage /></PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute><NotificationsPage /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePage /></PrivateRoute>
          } />

          {/* ── STAFF ──────────────────────────────── */}
          <Route path="/staff" element={
            <PrivateRoute roles={['staff','admin']}><StaffDashboardPage /></PrivateRoute>
          } />

          {/* ── ADMIN ──────────────────────────────── */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}><AdminDashboardPage /></PrivateRoute>
          } />
          <Route path="/admin/matches/new" element={
            <PrivateRoute roles={['admin']}><AdminMatchFormPage /></PrivateRoute>
          } />
          <Route path="/admin/matches/:id/edit" element={
            <PrivateRoute roles={['admin']}><AdminMatchFormPage /></PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>
          } />
          <Route path="/admin/bookings" element={
            <PrivateRoute roles={['admin']}><AdminBookingsPage /></PrivateRoute>
          } />

          {/* ── 404 ────────────────────────────────── */}
          <Route path="*" element={
            <div className="loading-center" style={{ flexDirection:'column' }}>
              <div style={{ fontSize:'4rem' }}>🏟️</div>
              <h2>404 — Page not found</h2>
              <a href="/" className="btn btn-primary" style={{ marginTop:'1rem' }}>Go Home</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
