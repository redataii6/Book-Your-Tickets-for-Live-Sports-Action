import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminMatchFormPage() {
  const { id }  = useParams();          // undefined → create, else edit
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const EMPTY = { title:'', sport_type:'football', home_team:'', away_team:'', date:'', time:'',
                  location:'', latitude:'', longitude:'', description:'', price:'', total_seats:'',
                  available_seats:'', status:'pending' };

  const [form,    setForm]    = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/admin/matches/${id}/`).then(r => {
      const m = r.data;
      setForm({
        title: m.title, sport_type: m.sport_type, home_team: m.home_team, away_team: m.away_team,
        date: m.date, time: m.time?.slice(0,5), location: m.location,
        latitude: m.latitude || '', longitude: m.longitude || '',
        description: m.description || '', price: m.price, total_seats: m.total_seats,
        available_seats: m.available_seats, status: m.status,
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      if (isEdit) await api.patch(`/admin/matches/${id}/`, form);
      else         await api.post('/admin/matches/', form);
      navigate('/admin');
    } catch (err) { setErrors(err.response?.data || { detail:'Save failed.' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this match? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/matches/${id}/`);
      navigate('/admin');
    } catch { alert('Delete failed.'); }
  };

  const fieldErr = k => errors[k] ? <span style={{ color:'#fca5a5', fontSize:'.78rem' }}>{errors[k]}</span> : null;

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:'680px' }}>
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Match' : 'New Match'}</h1>
            <p className="page-subtitle">{isEdit ? `Editing match #${id}` : 'Create a new match for clients to book'}</p>
          </div>
          <Link to="/admin" className="btn btn-outline btn-sm">← Back</Link>
        </div>

        <div className="card">
          <div className="card-body">
            {errors.detail && <div className="alert alert-error">{errors.detail}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
                {fieldErr('title')}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sport</label>
                  <select className="form-control" name="sport_type" value={form.sport_type} onChange={handleChange}>
                    <option value="football">⚽ Football</option>
                    <option value="basketball">🏀 Basketball</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                    <option value="pending">Pending</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Home Team</label>
                  <input className="form-control" name="home_team" value={form.home_team} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Away Team</label>
                  <input className="form-control" name="away_team" value={form.away_team} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-control" type="time" name="time" value={form.time} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ gridColumn:'span 2' }}>
                  <label className="form-label">Venue / Location</label>
                  <input className="form-control" name="location" value={form.location} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude (optional)</label>
                  <input className="form-control" name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 33.9716" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude (optional)</label>
                  <input className="form-control" name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. -6.8498" />
                </div>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input className="form-control" type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Seats</label>
                  <input className="form-control" type="number" min="1" name="total_seats" value={form.total_seats} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Seats</label>
                  <input className="form-control" type="number" min="0" name="available_seats" value={form.available_seats} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" name="description" value={form.description} onChange={handleChange} />
              </div>

              <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end' }}>
                {isEdit && (
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>🗑 Delete</button>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '✅ Create Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
