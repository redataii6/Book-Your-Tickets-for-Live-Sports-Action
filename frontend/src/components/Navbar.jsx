import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">🏟️ UniSports Tickets</Link>

        <ul className="navbar-links">
          <li><NavLink to="/">Home</NavLink></li>

          {user && user.role === 'client' && <>
            <li><NavLink to="/my-tickets">My Tickets</NavLink></li>
            <li><NavLink to="/notifications">Notifications</NavLink></li>
            <li><NavLink to="/profile">Profile</NavLink></li>
          </>}

          {user && user.role === 'staff' && <>
            <li><NavLink to="/staff">Dashboard</NavLink></li>
            <li><NavLink to="/notifications">Notifications</NavLink></li>
          </>}

          {(user && (user.role === 'admin' || user.is_superuser)) && <>
            <li><NavLink to="/admin">Admin</NavLink></li>
          </>}

          {user ? (
            <li>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </li>
          ) : <>
            <li><NavLink to="/login">Login</NavLink></li>
            <li>
              <NavLink to="/register" className="btn btn-primary btn-sm">Register</NavLink>
            </li>
          </>}
        </ul>
      </div>
    </nav>
  );
}
