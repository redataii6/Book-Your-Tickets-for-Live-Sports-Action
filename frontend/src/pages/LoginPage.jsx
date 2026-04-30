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
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center mb-2">
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🏟️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.25rem' }}>Welcome back</h1>
          <p className="text-muted text-sm">Sign in to your UniSports Tickets account</p>
        </div>

        <div className="card mt-2">
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-control" name="username" value={form.username}
                  onChange={handleChange} required autoFocus placeholder="your_username" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" name="password" value={form.password}
                  onChange={handleChange} required placeholder="••••••••" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-sm text-muted mt-2">
              No account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
