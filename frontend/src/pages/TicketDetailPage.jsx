import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const RING_R    = 28;
const RING_CIRC = 2 * Math.PI * RING_R;
const REFRESH_MS = 60000;

function QRWidget({ bookingId, initialUrl }) {
  const [qrUrl,     setQrUrl]    = useState(initialUrl || '');
  const [loading,   setLoading]  = useState(false);
  const [fading,    setFading]   = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error,     setError]    = useState(null);
  const timerRef   = useRef(null);
  const tickRef    = useRef(null);

  const fetchQR = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get(`/bookings/${bookingId}/qr/`);
      setFading(true);
      await new Promise(r => setTimeout(r, 400));
      setQrUrl(data.qr_url + '?t=' + Date.now());
      setFading(false);
      setCountdown(Math.min(data.seconds_left, 60));
    } catch { setError('Could not refresh QR. Retrying…'); }
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
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.6rem' }}>
      <div className="qr-frame">
        {qrUrl
          ? <img className={`qr-img${fading ? ' fading' : ''}`} src={qrUrl} alt="Ticket QR code" />
          : <div style={{ width:160, height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', fontSize:'.8rem' }}>Generating…</div>
        }
        {loading && <div className="qr-spinner-overlay"><div className="qr-spinner" /></div>}
      </div>

      <div className="qr-live-badge">
        <div className="qr-live-dot" />
        Live QR
      </div>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.3rem' }}>
        <svg className="qr-countdown-svg" width={70} height={70} viewBox="0 0 70 70" style={{ transform:'rotate(-90deg)' }}>
          <circle className="qr-ring-bg"       cx={35} cy={35} r={RING_R} />
          <circle className="qr-ring-progress" cx={35} cy={35} r={RING_R}
            strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset} />
          <text x={35} y={35} dominantBaseline="middle" textAnchor="middle"
            style={{ fill:'var(--text)', fontSize:14, fontWeight:700,
                     transform:'rotate(90deg)', transformOrigin:'35px 35px' }}>
            {countdown}s
          </text>
        </svg>
        <div style={{ fontSize:'.72rem', color:'var(--muted)', textAlign:'center' }}>
          Refreshes in <strong>{countdown}s</strong>
        </div>
      </div>

      {error && <div style={{ color:'#fca5a5', fontSize:'.72rem', textAlign:'center' }}>{error}</div>}
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}/`).then(r => setBooking(r.data))
      .catch(() => navigate('/my-tickets'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    setCancelling(true);
    try {
      await api.post(`/bookings/${id}/cancel/`);
      setBooking(b => ({ ...b, status:'cancelled', status_display:'Cancelled' }));
    } catch (e) { alert(e.response?.data?.detail || 'Cancel failed.'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!booking) return null;

  const m = booking.match;
  const emoji = m?.sport_type === 'football' ? '⚽' : '🏀';

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:'840px' }}>

        {/* Page header */}
        <div className="flex items-center justify-between mb-2" style={{ flexWrap:'wrap', gap:'.75rem' }}>
          <div>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>🎟️ Ticket Confirmation</h1>
            <p className="text-muted text-sm">Present the QR code at the stadium gate</p>
          </div>
          <Link to="/my-tickets" className="btn btn-outline btn-sm">← All Tickets</Link>
        </div>

        <div className="ticket-card">
          {/* Banner */}
          <div className="ticket-banner">
            <div className="flex justify-between items-center" style={{ flexWrap:'wrap', gap:'.5rem' }}>
              <div>
                <div style={{ fontSize:'.8rem', textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.7)', marginBottom:'.3rem' }}>
                  {emoji} {m?.sport_display}
                </div>
                <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#fff', marginBottom:'.2rem' }}>{m?.title}</div>
                <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.6)', fontFamily:'monospace' }}>REF: {booking.booking_ref}</div>
              </div>
              <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize:'.72rem' }}>
                {booking.status_display}
              </span>
            </div>
          </div>

          {/* Torn edge */}
          <div className="torn-edge">
            <div className="torn-circle left" />
            <div className="torn-line" />
            <div className="torn-circle right" />
          </div>

          {/* Body */}
          <div style={{ padding:'2rem 2.5rem', display:'flex', gap:'2rem', flexWrap:'wrap', alignItems:'flex-start' }}>
            {/* Info grid */}
            <div style={{ flex:1, minWidth:'220px' }}>
              <div style={{ fontSize:'.8rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.8rem' }}>Match Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem 1rem' }}>
                {[
                  ['Teams',      `${m?.home_team} vs ${m?.away_team}`],
                  ['Date',       m?.date ? new Date(m.date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '—'],
                  ['Time',       m?.time?.slice(0,5)],
                  ['Venue',      m?.location],
                  ['Tickets',    `${booking.quantity} seat${booking.quantity > 1 ? 's' : ''}`],
                  ['Total Paid', `$${booking.total_price}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:'.2rem' }}>{label}</div>
                    <div style={{ fontWeight:700, fontSize:'.95rem' }}>{value}</div>
                  </div>
                ))}
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:'.2rem' }}>Booked By</div>
                  <div style={{ fontWeight:700 }}>{booking.user?.first_name} {booking.user?.last_name} ({booking.user?.username})</div>
                </div>
              </div>
            </div>

            {/* QR Widget */}
            <QRWidget bookingId={booking.id} initialUrl={booking.qr_url} />
          </div>

          {/* Actions */}
          <div style={{ padding:'0 2.5rem 2.5rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            <Link to="/my-tickets" className="btn btn-outline">← All Tickets</Link>
            {booking.status === 'confirmed' && (
              <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : '✕ Cancel Booking'}
              </button>
            )}
            <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}
