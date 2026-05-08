import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const RING_R = 28;
const RING_CIRC = 2 * Math.PI * RING_R;
const REFRESH_MS = 60000;

function QRWidget({ bookingId, bookingRef }) {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const tickRef = useRef(null);

  const fetchQR = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get(`/bookings/${bookingId}/qr/`);
      setFading(true);
      await new Promise(r => setTimeout(r, 400));
      setQrUrl(data.qr_url + '?t=' + Date.now());
      setFading(false);
      setCountdown(Math.min(data.seconds_left, 60));
    } catch { setError('Could not refresh QR. Retrying soon…'); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    fetchQR();
    timerRef.current = setInterval(fetchQR, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchQR]);

  useEffect(() => {
    tickRef.current = setInterval(() => setCountdown(p => p <= 1 ? 60 : p - 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const dashOffset = RING_CIRC * (1 - countdown / 60);

  return (
    <div id="qr-widget-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.6rem' }}>
      {/* QR image frame */}
      <div className="qr-frame">
        {qrUrl
          ? <img className={`qr-img${fading ? ' fading' : ''}`} src={qrUrl} alt={`QR code for ticket ${bookingRef}`} id="qr-live-img" />
          : <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '.8rem' }}>Generating…</div>
        }
        {loading && <div className="qr-spinner-overlay"><div className="qr-spinner" /></div>}
      </div>

      {/* Live badge */}
      <div className="qr-live-badge">
        <div className="qr-live-dot" />
        Live QR
      </div>

      {/* Countdown ring + text */}
      <div className="qr-countdown-wrap">
        <svg className="qr-countdown-svg" width={70} height={70} viewBox="0 0 70 70"
          aria-label={`Refreshes in ${countdown} seconds`}>
          <circle className="qr-ring-bg" cx={35} cy={35} r={RING_R} />
          <circle className="qr-ring-progress" cx={35} cy={35} r={RING_R}
            strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset} />
          <text x={35} y={35} dominantBaseline="middle" textAnchor="middle"
            style={{
              fill: 'var(--text, #e2e8f0)', fontSize: '14px', fontWeight: '700',
              transform: 'rotate(90deg)', transformOrigin: '35px 35px'
            }}>
            {countdown}s
          </text>
        </svg>
        <div className="qr-countdown-text">
          <i className="bi bi-arrow-clockwise me-1" style={{ color: '#818cf8' }}></i>
          Refreshes in <strong>{countdown}s</strong>
        </div>
      </div>

      {/* Booking ref label */}
      <div className="qr-label">
        <i className="bi bi-shield-check me-1" style={{ color: '#10b981' }}></i>
        Scan at stadium gate<br />
        <span style={{ fontFamily: 'monospace', fontSize: '.68rem', color: '#818cf8' }}>{bookingRef}</span>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ color: '#fca5a5', fontSize: '.72rem', textAlign: 'center', maxWidth: '180px' }}>{error}</div>
      )}
    </div>
  );
}

function GoogleMapWidget({ lat, lng, title }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      const google = window.google;
      if (!google || !google.maps) return;
      const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const map = new google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
      });
      new google.maps.Marker({
        position,
        map,
        title,
      });
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps API script
      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        // Using callback and loading without API key (will show development warning)
        window.initGoogleMap = initMap;
        script.src = 'https://maps.googleapis.com/maps/api/js?callback=initGoogleMap';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      } else {
        // Script is already in document but maybe not loaded yet
        window.initGoogleMap = initMap;
      }
    }
  }, [lat, lng, title]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '1rem', border: '1px solid var(--card-border)' }} />;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}/`)
      .then(async r => {
        const b = r.data;
        try {
          // BookingSerializer uses MatchListSerializer which omits latitude/longitude.
          // Fetch the full match details to get coordinates.
          const matchRes = await api.get(`/matches/${b.match.id}/`);
          b.match = matchRes.data;
        } catch (e) {
          console.error("Failed to fetch full match details", e);
        }
        setBooking(b);
      })
      .catch(() => navigate('/my-tickets'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${id}/cancel/`);
      setBooking(b => ({ ...b, status: 'cancelled', status_display: 'Cancelled' }));
    } catch (e) { alert(e.response?.data?.detail || 'Cancel failed.'); }
    finally { setCancelling(false); }
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );
  if (!booking) return null;

  const m = booking.match;
  const emoji = m?.sport_type === 'football' ? '⚽' : '🏀';
  const fullName = [booking.user?.first_name, booking.user?.last_name].filter(Boolean).join(' ') || booking.user?.username;

  return (
    <div className="ticket-wrapper">

      {/* Page header */}
      <div className="ticket-header">
        <div>
          <h1 className="h4 fw-bold mb-0">
            <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--accent)' }}></i>
            Ticket Confirmation
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.83rem', marginTop: '.2rem' }}>
            Your booking has been confirmed. Present this QR code at the stadium gate.
          </p>
        </div>
        <Link to="/my-tickets" className="btn btn-outline-light btn-sm">
          <i className="bi bi-arrow-left me-1"></i> All Tickets
        </Link>
      </div>

      {/* ── MAIN TICKET CARD ── */}
      <div className="ticket-card">

        {/* Banner */}
        <div className="ticket-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
            <div>
              <div className="banner-sport">{emoji} {m?.sport_display}</div>
              <div className="banner-title">{m?.title}</div>
              <div className="banner-ref">REF: {booking.booking_ref}</div>
            </div>
            <span className={`banner-status${booking.status === 'cancelled' ? ' cancelled' : ''}`}>
              {booking.status_display}
            </span>
          </div>
        </div>

        {/* Torn edge */}
        <div className="torn-edge">
          <div className="torn-circle left"></div>
          <div className="torn-line"></div>
          <div className="torn-circle right"></div>
        </div>

        {/* Body: Info + QR */}
        <div className="ticket-body">

          {/* Left: match details */}
          <div className="ticket-info">
            <div style={{ fontSize: '.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              Match Details
            </div>
            <div className="info-grid">
              <div className="info-item">
                <div className="label"><i className="bi bi-people-fill me-1"></i>Teams</div>
                <div className="value">{m?.home_team} vs {m?.away_team}</div>
              </div>
              <div className="info-item">
                <div className="label"><i className="bi bi-calendar-event me-1"></i>Date</div>
                <div className="value">
                  {m?.date ? new Date(m.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
              <div className="info-item">
                <div className="label"><i className="bi bi-clock me-1"></i>Time</div>
                <div className="value">{m?.time?.slice(0, 5)}</div>
              </div>
              <div className="info-item">
                <div className="label"><i className="bi bi-geo-alt-fill me-1"></i>Venue</div>
                <div className="value">{m?.location}</div>
              </div>
              <div className="info-item">
                <div className="label"><i className="bi bi-ticket-fill me-1"></i>Tickets</div>
                <div className="value">{booking.quantity} × seat{booking.quantity !== 1 ? 's' : ''}</div>
              </div>
              <div className="info-item">
                <div className="label"><i className="bi bi-cash-stack me-1"></i>Total Paid</div>
                <div className="value accent">${booking.total_price}</div>
              </div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <div className="label"><i className="bi bi-person-fill me-1"></i>Booked By</div>
                <div className="value">{fullName}</div>
              </div>
            </div>
          </div>

          {/* Right: QR Widget */}
          <div className="ticket-qr">
            <QRWidget bookingId={booking.id} bookingRef={booking.booking_ref} />
          </div>

        </div>{/* /ticket-body */}

      {/* Map section */}
        <div className="map-section">
          <h3>
            <i className="bi bi-pin-map-fill" style={{ color: '#f59e0b' }}></i>
            Stadium Location
          </h3>

          {m?.latitude && m?.longitude ? (
            <>
              <div id="stadium-map" aria-label="Stadium location map">
                <GoogleMapWidget lat={m.latitude} lng={m.longitude} title={m.location} />
              </div>
              <div className="mt-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <small style={{ color: 'var(--muted)', fontSize: '.72rem' }}>
                  <i className="bi bi-geo-alt me-1"></i>{m.location} &nbsp;·&nbsp; {m.latitude}, {m.longitude}
                </small>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{ background: '#1a73e8', color: '#fff', fontSize: '.78rem', border: 'none' }}
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>Open in Google Maps
                </a>
              </div>
            </>
          ) : (
            <div className="map-no-coords">
              <i className="bi bi-geo-alt" style={{ fontSize: '1.3rem' }}></i>
              No stadium coordinates set for this match yet.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ticket-actions">
          <Link to="/my-tickets" className="btn btn-outline-light">
            <i className="bi bi-grid me-1"></i> All My Tickets
          </Link>
          {booking.status === 'confirmed' && (
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
              <i className="bi bi-x-lg me-1"></i>
              {cancelling ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          )}
          <button onClick={() => window.print()} className="btn btn-outline-light">
            <i className="bi bi-printer me-1"></i> Print Ticket
          </button>
        </div>

      </div>{/* /ticket-card */}
    </div>
  );
}
