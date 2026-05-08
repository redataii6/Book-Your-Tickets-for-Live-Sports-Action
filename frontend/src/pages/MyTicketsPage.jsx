import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/bookings/').then(r => setBookings(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel/`);
      setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status: 'cancelled', status_display: 'Cancelled' } : b));
    } catch (e) { alert(e.response?.data?.detail || 'Cancel failed.'); }
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  return (
    <div className="container py-5">

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold mb-0">
          <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--accent)' }}></i>
          My Tickets
        </h1>
        <Link to="/" className="btn btn-outline-light btn-sm">
          <i className="bi bi-plus me-1"></i> Book More
        </Link>
      </div>

      {bookings.length > 0 ? (
        <div className="row g-4">
          {bookings.map(booking => {
            const emoji = booking.match?.sport_type === 'football' ? '⚽' : '🏀';
            return (
              <div key={booking.id} className="col-12 col-md-6 col-lg-4 fade-up">
                <div className="card h-100 p-4"
                     style={{ opacity: booking.status === 'cancelled' ? 0.6 : 1 }}>

                  {/* Ref + Status */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <code style={{ color: '#818cf8', fontSize: '.8rem' }}>{booking.booking_ref}</code>
                    <span className={`status-pill status-${booking.status}`}>
                      {booking.status_display}
                    </span>
                  </div>

                  {/* Match info */}
                  <div className="mb-1">
                    <span className={`sport-pill sport-${booking.match?.sport_type} mb-2 d-inline-block`}>
                      {emoji} {booking.match?.sport_display}
                    </span>
                  </div>
                  <h5 className="fw-bold mb-1">{booking.match?.title}</h5>
                  <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
                    {booking.match?.home_team} vs {booking.match?.away_team}
                  </p>

                  <div className="d-flex flex-column gap-1 mb-3" style={{ fontSize: '.83rem', color: 'var(--muted)' }}>
                    <span>
                      <i className="bi bi-calendar-event me-1 text-primary"></i>
                      {booking.match?.date ? new Date(booking.match.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'} &bull; {booking.match?.time?.slice(0, 5)}
                    </span>
                    <span>
                      <i className="bi bi-geo-alt-fill me-1 text-primary"></i>
                      {booking.match?.location}
                    </span>
                    <span>
                      <i className="bi bi-ticket-fill me-1 text-primary"></i>
                      {booking.quantity} ticket{booking.quantity !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="mt-auto d-flex justify-content-between align-items-center pt-3"
                       style={{ borderTop: '1px solid var(--card-border)' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8' }}>
                      ${booking.total_price}
                    </span>
                    <div className="d-flex gap-2">
                      <Link to={`/my-tickets/${booking.id}`} className="btn btn-primary btn-sm">
                        <i className="bi bi-qr-code me-1"></i>View Ticket
                      </Link>
                      {booking.status === 'confirmed' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancel(booking.id)}
                        >
                          <i className="bi bi-x-lg me-1"></i>Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2" style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                    Booked: {booking.booked_at ? new Date(booking.booked_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-5">
          <div style={{ fontSize: '5rem', opacity: .3 }}>🎟️</div>
          <h4 className="mt-3" style={{ color: 'var(--muted)' }}>No tickets yet</h4>
          <p style={{ color: 'var(--muted)' }}>Browse available matches and book your first ticket!</p>
          <Link to="/" className="btn btn-primary mt-2">Browse Matches</Link>
        </div>
      )}

    </div>
  );
}
