import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin = user && (user.is_superuser || user.role === 'admin');
  const isStaff = user && user.role === 'staff';
  const isClient = user && user.role === 'client';

  return (
    <nav className="navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-trophy-fill"></i> UniSports<span style={{ WebkitTextFillColor: '#818cf8' }}>Tickets</span>
        </Link>
        <button
          className="navbar-toggler border-0"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(o => !o)}
        >
          <i className="bi bi-list text-light fs-4"></i>
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
                <NavLink className="nav-link" to="/admin">
                  <i className="bi bi-speedometer2"></i> Admin Panel
                </NavLink>
              </li>
            )}

            {isStaff && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/staff">
                  <i className="bi bi-kanban-fill"></i> Staff Dashboard
                </NavLink>
              </li>
            )}

            {isClient && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/my-tickets">
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
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg,var(--primary),#7c3aed)', fontWeight: 700, fontSize: '.85rem' }}
                    >
                      {user.username?.[0]?.toUpperCase()}
                    </span>
                    <span>{user.username}</span>
                  </a>
                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
                  >
                    <li>
                      <Link className="dropdown-item" to="/profile" style={{ color: 'var(--text)' }}>
                        <i className="bi bi-person me-2"></i>Profile
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" style={{ borderColor: 'var(--card-border)' }} /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
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
