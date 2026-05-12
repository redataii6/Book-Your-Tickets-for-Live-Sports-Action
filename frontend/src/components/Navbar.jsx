import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin  = user && (user.is_superuser || user.role === 'admin');
  const isStaff  = user && user.role === 'staff';
  const isClient = user && user.role === 'client';

  return (
    <nav className="navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-trophy-fill"></i>
          UniSports<span>Tickets</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(o => !o)}
        >
          <i className="bi bi-list" style={{ fontSize: '1.6rem', color: 'var(--text)' }}></i>
        </button>

        <div className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`} id="navMenu">
          <ul className="navbar-nav me-auto ms-3 gap-1">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">
                <i className="bi bi-house-fill"></i> Home
              </NavLink>
            </li>

            {isAdmin && (
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/admin">
                  <i className="bi bi-speedometer2"></i> Admin Panel
                </NavLink>
              </li>
            )}

            {isStaff && (
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/staff">
                  <i className="bi bi-kanban-fill"></i> Staff Dashboard
                </NavLink>
              </li>
            )}

            {isClient && (
              <li className="nav-item">
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/my-tickets">
                  <i className="bi bi-ticket-perforated-fill"></i> My Tickets
                </NavLink>
              </li>
            )}
          </ul>

          <ul className="navbar-nav align-items-center gap-2">
            {user ? (
              <>
                {/* Notification Bell */}
                <li className="nav-item position-relative">
                  <NavLink className="nav-link" to="/notifications" title="Notifications">
                    <i className="bi bi-bell-fill fs-5"></i>
                  </NavLink>
                </li>

                {/* User Dropdown */}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center gap-2"
                    href="#"
                    id="userDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{
                        width: '34px', height: '34px',
                        background: 'linear-gradient(135deg, var(--primary), #1d4ed8)',
                        fontWeight: 700, fontSize: '.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{user.username}</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>Profile
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogout}
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'var(--danger)' }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/login">
                    <i className="bi bi-box-arrow-in-right"></i> Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link btn-nav" to="/register">
                    Sign Up Free
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
