import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/').then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const statCards = [
    ['Total Matches',  stats.total_matches,  'var(--accent)'],
    ['Total Bookings', stats.total_bookings,  '#06b6d4'],
    ['Total Users',    stats.total_users,     '#10b981'],
    ['Revenue ($)',    Number(stats.total_revenue).toFixed(2), '#f59e0b'],
    ['Pending Approval', stats.pending_matches, '#ef4444'],
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header flex justify-between items-center" style={{ flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">System overview and controls</p>
          </div>
          <div style={{ display:'flex', gap:'.75rem' }}>
            <Link to="/admin/matches/new" className="btn btn-primary btn-sm">+ New Match</Link>
            <Link to="/admin/users"    className="btn btn-outline btn-sm">Users</Link>
            <Link to="/admin/bookings" className="btn btn-outline btn-sm">Bookings</Link>
          </div>
        </div>

        <div className="stat-grid">
          {statCards.map(([label, value, color]) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginTop:'1rem' }}>
          {/* Recent Matches */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize:'.88rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:'1rem' }}>Recent Matches</h2>
              {stats.recent_matches.map(m => (
                <div key={m.id} className="flex justify-between items-center" style={{ padding:'.6rem 0', borderBottom:'1px solid var(--card-border)' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.9rem' }}>{m.title}</div>
                    <div className="text-muted text-sm">{new Date(m.date).toLocaleDateString('en-GB')}</div>
                  </div>
                  <Link to={`/admin/matches/${m.id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize:'.88rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:'1rem' }}>Recent Bookings</h2>
              {stats.recent_bookings.map(b => (
                <div key={b.id} style={{ padding:'.6rem 0', borderBottom:'1px solid var(--card-border)' }}>
                  <div style={{ fontWeight:600, fontSize:'.9rem' }}>{b.booking_ref}</div>
                  <div className="text-muted text-sm">{b.user?.username} — {b.match?.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
