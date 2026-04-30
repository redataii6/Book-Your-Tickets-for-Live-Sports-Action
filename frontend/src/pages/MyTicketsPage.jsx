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

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const statusBadge = s => s === 'confirmed' ? 'badge-success' : s === 'cancelled' ? 'badge-danger' : 'badge-neutral';

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">My Tickets</h1>
          <p className="page-subtitle">All your booked matches in one place</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center mt-3" style={{ color:'var(--muted)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎟️</div>
            <p>You haven't booked any tickets yet.</p>
            <Link to="/" className="btn btn-primary mt-2">Browse Matches</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {bookings.map(b => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
                  <div style={{ fontSize:'2.5rem' }}>
                    {b.match?.sport_type === 'football' ? '⚽' : '🏀'}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, marginBottom:'.2rem' }}>{b.match?.title}</div>
                    <div className="text-muted text-sm">
                      {b.match?.home_team} vs {b.match?.away_team} &nbsp;·&nbsp;
                      {new Date(b.match?.date).toLocaleDateString('en-GB')} &nbsp;·&nbsp;
                      {b.match?.location}
                    </div>
                    <div className="text-sm mt-1">
                      Ref: <span style={{ fontFamily:'monospace', color:'var(--accent)' }}>{b.booking_ref}</span>
                      &nbsp;·&nbsp; {b.quantity} ticket{b.quantity > 1 ? 's' : ''}
                      &nbsp;·&nbsp; <strong style={{ color:'var(--accent)' }}>${b.total_price}</strong>
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.6rem' }}>
                    <span className={`badge ${statusBadge(b.status)}`}>{b.status_display}</span>
                    <Link to={`/my-tickets/${b.id}`} className="btn btn-outline btn-sm">View Ticket →</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
