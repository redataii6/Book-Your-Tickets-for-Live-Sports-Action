import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      if (user.is_superuser || user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5"
         style={{ background: 'linear-gradient(135deg,#0f0f1a,#1e1b4b,#0f0f1a)' }}>
      <div className="container" style={{ maxWidth: '420px' }}>

        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <h1 className="h3 fw-bold mt-2"
              style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            UniSports Tickets
          </h1>
          <p style={{ color: 'var(--muted)' }}>Sign in to book your seats</p>
        </div>

        <div className="card p-4 p-md-5">
          <h2 className="h5 fw-bold mb-4 text-center">Welcome Back</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
              />
              {error && <div className="text-danger small mt-1">{error}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-600" disabled={loading}>
              <i className="bi bi-box-arrow-in-right me-1"></i>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <hr style={{ borderColor: 'var(--card-border)', margin: '1.5rem 0' }} />
          <p className="text-center mb-0" style={{ color: 'var(--muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600 }}>Register free</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-3 p-3 rounded-3 text-center"
             style={{ background: 'rgba(79,70,229,.1)', border: '1px solid rgba(79,70,229,.2)', fontSize: '.82rem', color: 'var(--muted)' }}>
          <i className="bi bi-info-circle me-1"></i>
          Demo: create an account or ask an admin to assign staff role.
        </div>

      </div>
    </div>
  );
}
