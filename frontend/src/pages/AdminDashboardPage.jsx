import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/').then(r => setStats(r.data))
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

        {/* ── Sidebar ── */}
        <AdminSidebar activeItem="dashboard" />

        {/* ── Main ── */}
        <div className="col py-4 px-4">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 fw-bold mb-0">Admin Dashboard</h1>
            <Link to="/admin/matches/new" className="btn btn-primary">
              <i className="bi bi-plus-lg me-1"></i> New Match
            </Link>
          </div>

          {/* Stat cards */}
          <div className="row g-3 mb-5">
            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-num">{stats.total_matches}</div>
                <div className="stat-label"><i className="bi bi-trophy me-1"></i>Total Matches</div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-num text-warning">{stats.total_bookings}</div>
                <div className="stat-label"><i className="bi bi-ticket-fill me-1"></i>Total Bookings</div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-num" style={{ color: '#34d399' }}>{stats.total_users}</div>
                <div className="stat-label"><i className="bi bi-people-fill me-1"></i>Registered Users</div>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-num" style={{ color: '#fbbf24' }}>${Number(stats.total_revenue).toFixed(2)}</div>
                <div className="stat-label"><i className="bi bi-currency-dollar me-1"></i>Total Revenue</div>
              </div>
            </div>
          </div>

          <div className="row g-4">

            {/* Recent Matches */}
            <div className="col-12 col-xl-7">
              <div className="card">
                <div className="card-header px-4 py-3 d-flex justify-content-between">
                  <h5 className="mb-0 fw-bold"><i className="bi bi-trophy me-2 text-warning"></i>Recent Matches</h5>
                  <Link to="/admin/matches/new" className="btn btn-primary btn-sm">+ Add</Link>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Sport</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_matches?.length > 0 ? stats.recent_matches.map(match => (
                        <tr key={match.id}>
                          <td>
                            <div className="fw-600" style={{ fontSize: '.9rem' }}>{match.title}</div>
                            <small style={{ color: 'var(--muted)' }}>{match.home_team} vs {match.away_team}</small>
                          </td>
                          <td>
                            <span className={`sport-pill sport-${match.sport_type}`}>
                              {match.sport_type === 'football' ? '⚽' : '🏀'}
                            </span>
                          </td>
                          <td style={{ fontSize: '.83rem', whiteSpace: 'nowrap' }}>
                            {new Date(match.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>
                            <span className={`status-pill status-${match.status}`}>{match.status_display}</span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <Link to={`/admin/matches/${match.id}/edit`} className="btn btn-warning btn-sm">
                                <i className="bi bi-pencil-fill"></i>
                              </Link>
                              <Link to={`/admin/matches/${match.id}/delete`} className="btn btn-danger btn-sm">
                                <i className="bi bi-trash-fill"></i>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4" style={{ color: 'var(--muted)' }}>
                            No matches yet. <Link to="/admin/matches/new" style={{ color: '#818cf8' }}>Create one →</Link>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="col-12 col-xl-5">
              <div className="card">
                <div className="card-header px-4 py-3 d-flex justify-content-between">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-ticket-perforated-fill me-2" style={{ color: 'var(--accent)' }}></i>
                    Recent Bookings
                  </h5>
                  <Link to="/admin/bookings" className="btn btn-outline-light btn-sm">View All</Link>
                </div>
                <div className="p-3 d-flex flex-column gap-2">
                  {stats.recent_bookings?.length > 0 ? stats.recent_bookings.map(booking => (
                    <div key={booking.id} className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                         style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--card-border)' }}>
                      <div>
                        <div className="fw-600" style={{ fontSize: '.85rem' }}>{booking.user?.username}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{booking.match?.title}</div>
                        <code style={{ color: '#818cf8', fontSize: '.72rem' }}>{booking.booking_ref}</code>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold" style={{ color: '#fbbf24' }}>${booking.total_price}</div>
                        <span className={`status-pill status-${booking.status}`} style={{ fontSize: '.68rem' }}>
                          {booking.status_display}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4" style={{ color: 'var(--muted)' }}>No bookings yet.</div>
                  )}
                </div>
              </div>
            </div>

          </div>{/* /row */}
        </div>{/* /col */}
      </div>{/* /row */}
    </div>
  );
}
