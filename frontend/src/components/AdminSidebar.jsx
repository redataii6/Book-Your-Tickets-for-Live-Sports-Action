import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar({ activeItem }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="col-auto sidebar" style={{ width: '240px' }}>
      <div className="text-center mb-4 pt-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 text-white"
          style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, var(--danger), #b91c1c)',
            fontSize: '1.2rem', fontWeight: 800,
          }}
        >
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="fw-bold" style={{ fontSize: '.9rem', color: 'var(--text)' }}>{user?.username}</div>
        <span className="status-pill status-cancelled">Administrator</span>
      </div>

      <nav className="nav flex-column">
        <Link to="/admin" className={`nav-link${activeItem === 'dashboard' ? ' active' : ''}`}>
          <i className="bi bi-speedometer2"></i> Dashboard
        </Link>
        <Link to="/admin/matches/new" className={`nav-link${activeItem === 'create' ? ' active' : ''}`}>
          <i className="bi bi-plus-circle-fill"></i> Create Match
        </Link>
        <Link to="/admin/users" className={`nav-link${activeItem === 'users' ? ' active' : ''}`}>
          <i className="bi bi-people-fill"></i> Manage Users
        </Link>
        <Link to="/admin/bookings" className={`nav-link${activeItem === 'bookings' ? ' active' : ''}`}>
          <i className="bi bi-ticket-perforated-fill"></i> All Bookings
        </Link>
        <hr style={{ borderColor: 'var(--card-border)' }} />
        <a href="/admin/" className="nav-link" target="_blank">
          <i className="bi bi-gear-fill"></i> Django Admin
        </a>
        <Link to="/" className="nav-link">
          <i className="bi bi-globe"></i> View Site
        </Link>
        <button
          className="nav-link text-start"
          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', width: '100%' }}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </nav>
    </div>
  );
}
