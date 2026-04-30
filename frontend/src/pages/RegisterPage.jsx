import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]     = useState({ username:'', email:'', first_name:'', last_name:'', password:'', password2:'' });
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

  const fieldErr = key => errors[key] ? <span style={{ color:'#fca5a5', fontSize:'.78rem' }}>{errors[key]}</span> : null;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ width:'100%', maxWidth:'480px' }}>
        <div className="text-center mb-2">
          <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>🎟️</div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800 }}>Create account</h1>
          <p className="text-muted text-sm">Join UniSports Tickets — free, instant access</p>
        </div>

        <div className="card mt-2">
          <div className="card-body">
            {errors.detail && <div className="alert alert-error">{errors.detail}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">First name</label>
                  <input className="form-control" name="first_name" value={form.first_name} onChange={handleChange} required />
                  {fieldErr('first_name')}
                </div>
                <div className="form-group">
                  <label className="form-label">Last name</label>
                  <input className="form-control" name="last_name" value={form.last_name} onChange={handleChange} required />
                  {fieldErr('last_name')}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-control" name="username" value={form.username} onChange={handleChange} required />
                {fieldErr('username')}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
                {fieldErr('email')}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
                {fieldErr('password')}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <input className="form-control" type="password" name="password2" value={form.password2} onChange={handleChange} required />
                {fieldErr('password2')}
              </div>
              <button className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-muted mt-2">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
