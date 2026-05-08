import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]     = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const fieldErr = key => errors[key] ? <div className="text-danger small mt-1">{Array.isArray(errors[key]) ? errors[key][0] : errors[key]}</div> : null;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5"
         style={{ background: 'linear-gradient(135deg,#0f0f1a,#1e1b4b,#0f0f1a)' }}>
      <div className="container" style={{ maxWidth: '480px' }}>

        {/* Logo */}
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem' }}>🏆</div>
          <h1 className="h3 fw-bold mt-2"
              style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            UniSports Tickets
          </h1>
          <p style={{ color: 'var(--muted)' }}>Create your free account to start booking</p>
        </div>

        <div className="card p-4 p-md-5">
          <h2 className="h5 fw-bold mb-4 text-center">Create Account</h2>

          {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">First Name</label>
                <input className="form-control" name="first_name" value={form.first_name} onChange={handleChange} required />
                {fieldErr('first_name')}
              </div>
              <div className="col-6">
                <label className="form-label">Last Name</label>
                <input className="form-control" name="last_name" value={form.last_name} onChange={handleChange} required />
                {fieldErr('last_name')}
              </div>
            </div>

            <div className="mt-3">
              <label className="form-label">Username</label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} required />
              {fieldErr('username')}
            </div>

            <div className="mt-3">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
              {fieldErr('email')}
            </div>

            <div className="mt-3">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
              {fieldErr('password')}
            </div>

            <div className="mt-3">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="password2" value={form.password2} onChange={handleChange} required />
              {fieldErr('password2')}
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 mt-4 fw-600" disabled={loading}>
              <i className="bi bi-person-plus-fill me-1"></i>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <hr style={{ borderColor: 'var(--card-border)', margin: '1.5rem 0' }} />
          <p className="text-center mb-0" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600 }}>Login here</Link>
          </p>
        </div>

      </div>
    </div>
  );
}
