import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match,    setMatch]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [qty,      setQty]      = useState(1);
  const [booking,  setBooking]  = useState(false);
  const [msg,      setMsg]      = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    api.get(`/matches/${id}/`).then(r => setMatch(r.data)).catch(() => navigate('/'))
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

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!match)  return null;

  const emoji = match.sport_type === 'football' ? '⚽' : '🏀';

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:'860px' }}>
        {/* Banner */}
        <div style={{ background:'linear-gradient(135deg,#4f46e5,#818cf8 50%,#06b6d4)', borderRadius:'1.5rem', padding:'2.5rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'220px', height:'220px', borderRadius:'50%', background:'rgba(255,255,255,.08)' }} />
          <div style={{ fontSize:'.8rem', textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.7)', marginBottom:'.4rem' }}>
            {emoji} {match.sport_display}
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, color:'#fff', marginBottom:'.4rem' }}>{match.title}</h1>
          <div style={{ color:'rgba(255,255,255,.7)', fontSize:'.9rem' }}>{match.home_team} vs {match.away_team}</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'1.5rem', alignItems:'start' }}>
          {/* Match info */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'1rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>Match Details</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.2rem' }}>
                {[
                  ['📅 Date',     new Date(match.date).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})],
                  ['🕐 Time',     match.time?.slice(0,5)],
                  ['📍 Venue',    match.location],
                  ['🎟️ Price',    `$${match.price} / ticket`],
                  ['💺 Available', `${match.available_seats} of ${match.total_seats} seats`],
                  ['🏆 Sport',    match.sport_display],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:'.2rem' }}>{label}</div>
                    <div style={{ fontWeight:700 }}>{value}</div>
                  </div>
                ))}
              </div>
              {match.description && <p style={{ marginTop:'1.2rem', color:'var(--muted)', fontSize:'.9rem', lineHeight:1.7 }}>{match.description}</p>}
            </div>
          </div>

          {/* Booking panel */}
          <div className="card" style={{ minWidth:'220px' }}>
            <div className="card-body">
              <div style={{ fontWeight:800, fontSize:'1.5rem', color:'var(--accent)', marginBottom:'.3rem' }}>${match.price}</div>
              <div className="text-muted text-sm mb-2">per ticket</div>

              {!user && (
                <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => navigate('/login')}>
                  Login to Book
                </button>
              )}

              {user && user.role === 'client' && match.available_seats > 0 && (
                <form onSubmit={handleBook}>
                  {error && <div className="alert alert-error" style={{ fontSize:'.8rem' }}>{error}</div>}
                  {msg   && <div className="alert alert-success" style={{ fontSize:'.8rem' }}>{msg}</div>}
                  <div className="form-group">
                    <label className="form-label">Tickets</label>
                    <input className="form-control" type="number" min="1" max={match.available_seats}
                      value={qty} onChange={e => setQty(Number(e.target.value))} />
                  </div>
                  <div className="text-sm text-muted mb-2">Total: <strong style={{ color:'var(--accent)' }}>${(match.price * qty).toFixed(2)}</strong></div>
                  <button className="btn btn-primary" style={{ width:'100%' }} disabled={booking}>
                    {booking ? 'Booking…' : '🎟️ Book Now'}
                  </button>
                </form>
              )}

              {match.available_seats === 0 && <div className="badge badge-danger" style={{ width:'100%', textAlign:'center', padding:'.5rem' }}>Sold Out</div>}

              {user && user.role !== 'client' && (
                <div className="text-muted text-sm text-center">Only clients can book tickets.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
