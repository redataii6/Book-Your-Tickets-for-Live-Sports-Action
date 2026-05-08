import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [error,   setError]   = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/profile/').then(r => { setProfile(r.data); setForm(r.data); })
      .finally(() => setLoading(false));
    api.get('/notifications/').then(r => {
      const notifs = r.data.results || r.data;
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    }).catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setMsg(null); setError(null);
    try {
      await api.patch('/profile/', {
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      form.phone,
        bio:        form.bio,
        location:   form.location,
      });
      setMsg('Profile updated successfully!');
    } catch (err) { setError(err.response?.data?.detail || 'Update failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  const rolePillClass = r => {
    if (r === 'admin') return 'status-pill status-cancelled';
    if (r === 'staff') return 'status-pill status-pending';
    return 'status-pill status-published';
  };

  const roleDisplay = r => {
    if (r === 'admin') return 'Administrator';
    if (r === 'staff') return 'Staff Manager';
    return 'Client';
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username;

  return (
    <div className="container py-5" style={{ maxWidth: '680px' }}>

      <h1 className="h3 fw-bold mb-4">
        <i className="bi bi-person-circle me-2" style={{ color: 'var(--accent)' }}></i>
        My Profile
      </h1>

      <div className="card p-4 p-md-5">

        {/* Avatar + username */}
        <div className="d-flex align-items-center gap-4 mb-4 pb-4"
             style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg,var(--primary),#7c3aed)', fontSize: '1.8rem', fontWeight: 800 }}
          >
            {profile?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="h5 fw-bold mb-0">{fullName}</h2>
            <p className="mb-1" style={{ color: 'var(--muted)' }}>@{profile?.username}</p>
            <span className={rolePillClass(profile?.role)}>
              {roleDisplay(profile?.role)}
            </span>
          </div>
        </div>

        {/* Edit form */}
        {msg   && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label">First Name</label>
              <input className="form-control" name="first_name" value={form.first_name || ''} onChange={handleChange} />
            </div>
            <div className="col-6">
              <label className="form-label">Last Name</label>
              <input className="form-control" name="last_name" value={form.last_name || ''} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" name="email" value={form.email || ''} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Phone Number</label>
              <input className="form-control" name="phone" value={form.phone || ''} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">
                <i className="bi bi-geo-alt me-1" style={{ color: 'var(--accent)' }}></i>
                Location
                <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '.82rem', marginLeft: '.4rem' }}>
                  (country / city — used for match recommendations)
                </span>
              </label>
              <input
                className="form-control"
                name="location"
                placeholder="e.g. Morocco"
                value={form.location || ''}
                onChange={handleChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Bio</label>
              <textarea className="form-control" name="bio" value={form.bio || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="d-flex gap-3 mt-4">
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              <i className="bi bi-save me-1"></i> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link to="/" className="btn btn-outline-light">Cancel</Link>
          </div>
        </form>
      </div>

      {/* Quick links */}
      <div className="row g-3 mt-2">
        <div className="col-6">
          <Link to="/my-tickets" className="card p-3 text-decoration-none d-flex flex-row align-items-center gap-3">
            <i className="bi bi-ticket-perforated-fill fs-3" style={{ color: 'var(--accent)' }}></i>
            <div>
              <div className="fw-bold" style={{ fontSize: '.9rem' }}>My Tickets</div>
              <div style={{ color: 'var(--muted)', fontSize: '.78rem' }}>View your bookings</div>
            </div>
          </Link>
        </div>
        <div className="col-6">
          <Link to="/notifications" className="card p-3 text-decoration-none d-flex flex-row align-items-center gap-3">
            <i className="bi bi-bell-fill fs-3" style={{ color: '#818cf8' }}></i>
            <div>
              <div className="fw-bold" style={{ fontSize: '.9rem' }}>Notifications</div>
              <div style={{ color: 'var(--muted)', fontSize: '.78rem' }}>
                {unreadCount > 0
                  ? <span style={{ color: '#f87171' }}>{unreadCount} unread</span>
                  : 'All caught up'
                }
              </div>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}
