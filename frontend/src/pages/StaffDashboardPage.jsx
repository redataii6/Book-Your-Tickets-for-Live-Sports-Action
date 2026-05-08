import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StaffDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/staff/matches/'),
      api.get('/notifications/')
    ]).then(([matchesRes, notifRes]) => {
      setMatches(matchesRes.data);
      const allNotifs = notifRes.data.results || notifRes.data;
      setNotifications(allNotifs.slice(0, 5));
      setUnreadCount(allNotifs.filter(n => !n.is_read).length);
    }).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const doPublish = async (id) => {
    if (!confirm('Publish this match? All clients will be notified.')) return;
    setAction(a => ({ ...a, [id]:'loading' }));
    try {
      await api.post(`/staff/matches/${id}/publish/`);
      setMatches(ms => ms.map(m => m.id === id ? { ...m, status:'published', status_display:'Published' } : m));
    } catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
    finally { setAction(a => ({ ...a, [id]:null })); }
  };

  const doHide = async (id) => {
    if (!confirm('Hide this match from clients?')) return;
    setAction(a => ({ ...a, [id]:'loading' }));
    try {
      await api.post(`/staff/matches/${id}/hide/`);
      setMatches(ms => ms.map(m => m.id === id ? { ...m, status:'hidden', status_display:'Hidden' } : m));
    } catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
    finally { setAction(a => ({ ...a, [id]:null })); }
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  const pendingCount   = matches.filter(m => m.status === 'pending').length;
  const publishedCount = matches.filter(m => m.status === 'published').length;
  const hiddenCount    = matches.filter(m => m.status === 'hidden').length;

  return (
    <div className="container-fluid">
      <div className="row">

        {/* ── Sidebar ── */}
        <div className="col-auto sidebar" style={{ width: '230px' }}>
          <div className="text-center mb-4 pt-2">
            <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                 style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', fontSize: '1.2rem', fontWeight: 800 }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="fw-bold" style={{ fontSize: '.9rem' }}>{user?.username}</div>
            <span className="status-pill status-pending">Staff Manager</span>
          </div>

          <nav className="nav flex-column">
            <Link to="/staff" className="nav-link active">
              <i className="bi bi-kanban-fill"></i> Dashboard
            </Link>
            <Link to="/notifications" className="nav-link">
              <i className="bi bi-bell-fill"></i> Notifications
              {unreadCount > 0 && (
                <span className="badge ms-auto" style={{ background: 'var(--danger)' }}>{unreadCount}</span>
              )}
            </Link>
            <Link to="/profile" className="nav-link"><i className="bi bi-person-fill"></i> Profile</Link>
            <Link to="/" className="nav-link"><i className="bi bi-globe"></i> View Site</Link>
            <hr style={{ borderColor: 'var(--card-border)' }} />
            <button
              className="nav-link text-start"
              style={{ background: 'none', border: 'none', color: 'var(--danger) !important', cursor: 'pointer' }}
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </nav>
        </div>

        {/* ── Main Content ── */}
        <div className="col py-4 px-4">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 fw-bold mb-0">Staff Dashboard</h1>
            <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
              <i className="bi bi-clock me-1"></i>Match Manager View
            </span>
          </div>

          {/* Summary cards */}
          <div className="row g-3 mb-5">
            <div className="col-4">
              <div className="stat-card">
                <div className="stat-num text-warning">{pendingCount}</div>
                <div className="stat-label"><i className="bi bi-hourglass-split me-1"></i>Pending Approval</div>
              </div>
            </div>
            <div className="col-4">
              <div className="stat-card">
                <div className="stat-num" style={{ color: '#34d399' }}>{publishedCount}</div>
                <div className="stat-label"><i className="bi bi-broadcast me-1"></i>Published</div>
              </div>
            </div>
            <div className="col-4">
              <div className="stat-card">
                <div className="stat-num" style={{ color: '#94a3b8' }}>{hiddenCount}</div>
                <div className="stat-label"><i className="bi bi-eye-slash-fill me-1"></i>Hidden</div>
              </div>
            </div>
          </div>

          {/* Notifications preview */}
          {notifications.length > 0 && (
            <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)' }}>
              <h6 className="fw-bold mb-2" style={{ color: '#fbbf24' }}>
                <i className="bi bi-bell-fill me-1"></i> Recent Notifications
              </h6>
              {notifications.map(n => (
                <div key={n.id} className="d-flex gap-2 align-items-start mb-1" style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
                  <i className="bi bi-chevron-right mt-1 flex-shrink-0" style={{ color: '#fbbf24' }}></i>
                  <span>{n.title}</span>
                </div>
              ))}
              <Link to="/notifications" style={{ color: '#fbbf24', fontSize: '.82rem' }}>
                View all notifications →
              </Link>
            </div>
          )}

          {/* Match management table */}
          <div className="card">
            <div className="card-header px-4 py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2"></i>All Matches
              </h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Sport</th>
                    <th>Date</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map(match => (
                    <tr key={match.id}>
                      <td>
                        <div className="fw-600">{match.title}</div>
                        <small style={{ color: 'var(--muted)' }}>{match.home_team} vs {match.away_team}</small>
                      </td>
                      <td>
                        <span className={`sport-pill sport-${match.sport_type}`}>
                          {match.sport_type === 'football' ? '⚽' : '🏀'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div>{new Date(match.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <small style={{ color: 'var(--muted)' }}>{match.time?.slice(0, 5)}</small>
                      </td>
                      <td>{match.available_seats}/{match.total_seats}</td>
                      <td>
                        <span className={`status-pill status-${match.status}`}>
                          {match.status_display}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          {(match.status === 'pending' || match.status === 'hidden') && (
                            <button
                              className="btn btn-success btn-sm"
                              disabled={action[match.id] === 'loading'}
                              onClick={() => doPublish(match.id)}
                            >
                              <i className="bi bi-broadcast me-1"></i>Publish
                            </button>
                          )}
                          {match.status === 'published' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={action[match.id] === 'loading'}
                              onClick={() => doHide(match.id)}
                            >
                              <i className="bi bi-eye-slash me-1"></i>Hide
                            </button>
                          )}
                          <Link to={`/match/${match.id}`} className="btn btn-outline-light btn-sm">
                            <i className="bi bi-eye"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {matches.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4" style={{ color: 'var(--muted)' }}>
                        No matches found.
                      </td>
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
