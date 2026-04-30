import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get('/profile/').then(r => { setProfile(r.data); setForm(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setMsg(null); setError(null);
    try {
      await api.patch('/profile/', { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone, bio: form.bio });
      setMsg('Profile updated successfully!');
    } catch (err) { setError(err.response?.data?.detail || 'Update failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:'540px' }}>
        <div className="page-header">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">@{profile?.username} · <span className="badge badge-info">{profile?.role}</span></p>
        </div>

        <div className="card">
          <div className="card-body">
            {msg   && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">First name</label>
                  <input className="form-control" name="first_name" value={form.first_name || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last name</label>
                  <input className="form-control" name="last_name" value={form.last_name || ''} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" name="email" value={form.email || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" name="phone" value={form.phone || ''} onChange={handleChange} placeholder="+212 6..." />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-control" name="bio" value={form.bio || ''} onChange={handleChange} placeholder="Tell us a bit about yourself…" />
              </div>
              <button className="btn btn-primary" style={{ width:'100%' }} disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
