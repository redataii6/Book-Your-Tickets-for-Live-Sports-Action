import { useState, useEffect } from 'react';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/admin/bookings/').then(r => setBookings(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  return (
    <div className="container-fluid">
      <div className="row">

        {/* Sidebar */}
        <AdminSidebar activeItem="bookings" />

        {/* Main */}
        <div className="col py-4 px-4">
          <h1 className="h3 fw-bold mb-4">
            <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--accent)' }}></i>All Bookings
          </h1>

          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>User</th>
                    <th>Match</th>
                    <th>Sport</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? bookings.map(booking => (
                    <tr key={booking.id}>
                      <td><code style={{ color: '#818cf8', fontSize: '.78rem' }}>{booking.booking_ref}</code></td>
                      <td>
                        <div className="fw-600" style={{ fontSize: '.88rem' }}>{booking.user?.username}</div>
                        <small style={{ color: 'var(--muted)' }}>{booking.user?.email || '—'}</small>
                      </td>
                      <td>
                        <div style={{ fontSize: '.88rem' }}>{booking.match?.title}</div>
                        <small style={{ color: 'var(--muted)' }}>
                          {booking.match?.date ? new Date(booking.match.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </small>
                      </td>
                      <td>
                        <span className={`sport-pill sport-${booking.match?.sport_type}`}>
                          {booking.match?.sport_type === 'football' ? '⚽' : '🏀'}
                        </span>
                      </td>
                      <td className="fw-bold">{booking.quantity}</td>
                      <td className="fw-bold" style={{ color: '#fbbf24' }}>${booking.total_price}</td>
                      <td>
                        <span className={`status-pill status-${booking.status}`}>
                          {booking.status_display}
                        </span>
                      </td>
                      <td style={{ fontSize: '.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(booking.booked_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4" style={{ color: 'var(--muted)' }}>No bookings yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* /col */}
      </div>{/* /row */}
    </div>
  );
}
