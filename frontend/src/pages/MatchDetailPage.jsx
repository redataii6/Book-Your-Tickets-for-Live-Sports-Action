import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match,   setMatch]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [booking, setBooking] = useState(false);
  const [error,   setError]   = useState(null);
  const [userBooking, setUserBooking] = useState(null);

  useEffect(() => {
    api.get(`/matches/${id}/`)
      .then(r => {
        setMatch(r.data);
        setUserBooking(r.data.user_booking || null);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleBook = async e => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setBooking(true); setError(null);
    try {
      const { data } = await api.post(`/matches/${id}/book/`, { quantity: qty });
      navigate(`/my-tickets/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. Please try again.');
    } finally { setBooking(false); }
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );
  if (!match) return null;

  const emoji = match.sport_type === 'football' ? '⚽' : '🏀';
  const pct   = match.total_seats > 0 ? Math.round((match.available_seats / match.total_seats) * 100) : 0;

  return (
    <div className="container py-5">

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb" style={{ background: 'none', padding: 0, fontSize: '.85rem' }}>
          <li className="breadcrumb-item"><Link to="/" style={{ color: '#818cf8' }}>Home</Link></li>
          <li className="breadcrumb-item active" style={{ color: 'var(--muted)' }}>Match Detail</li>
        </ol>
      </nav>

      <div className="row g-4">

        {/* ── LEFT: Match Info ── */}
        <div className="col-12 col-lg-8">
          <div className="card">
            {/* Match image / banner */}
            {match.image_url
              ? <img src={match.image_url} className="match-img" alt={match.title}
                     style={{ height: '280px', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
              : <div className="match-img-placeholder" style={{ height: '280px', borderRadius: 'var(--radius) var(--radius) 0 0', fontSize: '6rem' }}>
                  {emoji}
                </div>
            }

            <div className="card-body p-4">
              {/* Sport + Status */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className={`sport-pill sport-${match.sport_type}`}>
                  {emoji} {match.sport_display}
                </span>
                <span className={`status-pill status-${match.status}`}>{match.status_display}</span>
              </div>

              {/* Title */}
              <h1 className="h2 fw-bold mb-1">{match.title}</h1>
              {/* Teams vs */}
              <p className="fs-5 mb-4" style={{ color: 'var(--muted)' }}>
                <strong className="text-light">{match.home_team}</strong>
                <span className="mx-2" style={{ color: '#818cf8' }}>vs</span>
                <strong className="text-light">{match.away_team}</strong>
              </p>

              {/* Info Grid */}
              <div className="row g-3 mb-4">
                {[
                  ['bi-calendar-event', new Date(match.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 'Date'],
                  ['bi-clock',         match.time?.slice(0, 5),                       'Kick-off'],
                  ['bi-geo-alt-fill',  match.full_location || match.location,         'Venue'],
                  ['bi-people-fill',   match.available_seats,                         'Seats Left'],
                ].map(([icon, value, label]) => (
                  <div key={label} className="col-6 col-md-3">
                    <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(79,70,229,.1)' }}>
                      <i className={`bi ${icon} fs-4 mb-1`} style={{ color: '#818cf8' }}></i>
                      <div className="fw-700" style={{ fontSize: '.95rem' }}>{value}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {match.description && (
                <>
                  <h5 className="fw-bold mb-2">About This Match</h5>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{match.description}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Booking Panel ── */}
        <div className="col-12 col-lg-4">
          <div className="card sticky-top" style={{ top: '90px' }}>
            <div className="card-header p-4">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--accent)' }}></i>
                Ticket Booking
              </h5>
            </div>
            <div className="card-body p-4">

              {/* Price */}
              <div className="d-flex justify-content-between align-items-center mb-3 pb-3"
                   style={{ borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--muted)' }}>Price per ticket</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>${match.price}</span>
              </div>

              {/* Available seats bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                  <span>Availability</span>
                  <span>{match.available_seats} / {match.total_seats}</span>
                </div>
                <div className="progress" style={{ height: '8px', background: 'var(--card-border)', borderRadius: '10px' }}>
                  <div className="progress-bar" role="progressbar"
                       style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#818cf8,#c084fc)' }}>
                  </div>
                </div>
              </div>

              {user ? (
                <>
                  {userBooking ? (
                    /* Already booked */
                    <>
                      <div className="alert mb-3" style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#34d399' }}>
                        <i className="bi bi-check-circle-fill me-2"></i>
                        You have booked <strong>{userBooking.quantity}</strong> ticket{userBooking.quantity !== 1 ? 's' : ''} for this match!
                      </div>
                      <Link to="/my-tickets" className="btn btn-success w-100">
                        <i className="bi bi-ticket-perforated-fill me-1"></i> View My Tickets
                      </Link>
                    </>
                  ) : match.available_seats === 0 ? (
                    /* Sold out */
                    <div className="alert" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>
                      <i className="bi bi-x-circle-fill me-2"></i> This match is sold out.
                    </div>
                  ) : (
                    /* Booking form */
                    <form onSubmit={handleBook}>
                      {error && <div className="alert alert-danger" style={{ fontSize: '.83rem' }}>{error}</div>}
                      <div className="mb-3">
                        <label className="form-label">Number of Tickets</label>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          max={Math.min(match.available_seats, 10)}
                          value={qty}
                          onChange={e => setQty(Number(e.target.value))}
                        />
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '.83rem' }} className="mb-3">
                        Max 10 tickets per booking.
                      </p>
                      <button type="submit" className="btn btn-primary w-100 py-2" id="btn-book" disabled={booking}>
                        <i className="bi bi-bag-check-fill me-1"></i>
                        {booking ? 'Booking…' : `Confirm Booking — $${(match.price * qty).toFixed(2)}`}
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* Not logged in */
                <>
                  <p style={{ color: 'var(--muted)' }} className="mb-3">
                    You need an account to book tickets.
                  </p>
                  <Link to={`/login`} className="btn btn-primary w-100 mb-2">
                    <i className="bi bi-box-arrow-in-right me-1"></i> Login to Book
                  </Link>
                  <Link to="/register" className="btn btn-outline-light w-100">
                    Create Free Account
                  </Link>
                </>
              )}

            </div>

            {/* Admin actions */}
            {user && (user.is_superuser || user.role === 'admin') && (
              <div className="card-footer p-3">
                <div className="d-flex gap-2">
                  <Link to={`/admin/matches/${id}/edit`} className="btn btn-warning btn-sm flex-grow-1">
                    <i className="bi bi-pencil-fill me-1"></i> Edit
                  </Link>
                  <button
                    className="btn btn-danger btn-sm flex-grow-1"
                    onClick={() => { if (confirm('Delete this match?')) navigate(`/admin/matches/${id}/delete`); }}
                  >
                    <i className="bi bi-trash-fill me-1"></i> Delete
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
