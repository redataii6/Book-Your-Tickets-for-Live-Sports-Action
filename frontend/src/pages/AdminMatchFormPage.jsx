import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminMatchFormPage() {
  const { id }  = useParams();          // undefined → create, else edit
  const navigate = useNavigate();
  const isEdit   = Boolean(id);
  const title    = isEdit ? 'Edit Match' : 'Create Match';

  const EMPTY = {
    title: '', sport_type: 'football', home_team: '', away_team: '',
    date: '', time: '', city: '', country: '', latitude: '', longitude: '',
    description: '', price: '', total_seats: '', status: 'pending', image: null
  };

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
        date: m.date, time: m.time?.slice(0, 5),
        city: m.city || '', country: m.country || '',
        latitude: m.latitude || '', longitude: m.longitude || '',
        description: m.description || '', price: m.price, total_seats: m.total_seats,
        status: m.status, imageUrl: m.image
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = e => {
    if (e.target.name === 'image') {
      setForm(f => ({ ...f, image: e.target.files[0] }));
    } else {
      setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const formData = new FormData();
      Object.keys(form).forEach(k => {
        if (k !== 'image' && k !== 'imageUrl') {
          formData.append(k, form[k]);
        }
      });
      if (form.image) {
        formData.append('image', form.image);
      }
      
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (isEdit) await api.patch(`/admin/matches/${id}/`, formData, config);
      else         await api.post('/admin/matches/', formData, config);
      navigate('/admin');
    } catch (err) { setErrors(err.response?.data || { detail: 'Save failed.' }); }
    finally { setSaving(false); }
  };

  const fieldErr = k => errors[k]
    ? <div className="text-danger small mt-1">{Array.isArray(errors[k]) ? errors[k][0] : errors[k]}</div>
    : null;

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  return (
    <div className="container py-5" style={{ maxWidth: '760px' }}>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb" style={{ background: 'none', padding: 0, fontSize: '.85rem' }}>
          <li className="breadcrumb-item"><Link to="/admin" style={{ color: 'var(--primary)' }}>Admin</Link></li>
          <li className="breadcrumb-item active" style={{ color: 'var(--muted)' }}>{title}</li>
        </ol>
      </nav>

      <div className="card p-4 p-md-5">
        <h1 className="h4 fw-bold mb-4">
          <i className={`bi bi-${isEdit ? 'pencil-fill' : 'plus-circle-fill'} me-2`} style={{ color: 'var(--accent)' }}></i>
          {title}
        </h1>

        {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">

            {/* Title */}
            <div className="col-12">
              <label className="form-label">Match Title *</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange} required />
              {fieldErr('title')}
            </div>

            {/* Sport */}
            <div className="col-12 col-md-6">
              <label className="form-label">Sport Type *</label>
              <select className="form-select" name="sport_type" value={form.sport_type} onChange={handleChange}>
                <option value="football">Football</option>
                <option value="basketball">Basketball</option>
              </select>
            </div>

            {/* Teams */}
            <div className="col-12 col-md-6">
              <label className="form-label">Home Team *</label>
              <input className="form-control" name="home_team" value={form.home_team} onChange={handleChange} required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Away Team *</label>
              <input className="form-control" name="away_team" value={form.away_team} onChange={handleChange} required />
            </div>

            {/* Date & Time */}
            <div className="col-12 col-md-6">
              <label className="form-label">Match Date *</label>
              <input className="form-control" type="date" name="date" value={form.date} onChange={handleChange} required />
              {fieldErr('date')}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Kickoff / Tip-off Time *</label>
              <input className="form-control" type="time" name="time" value={form.time} onChange={handleChange} required />
            </div>

            {/* Location: City + Country */}
            <div className="col-12">
              <label className="form-label fw-bold">
                <i className="bi bi-geo-alt-fill me-1" style={{ color: 'var(--primary)' }}></i>
                Venue Location
              </label>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">City *</label>
              <input
                className="form-control"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="e.g. Casablanca"
                required
              />
              {fieldErr('city')}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Country *</label>
              <input
                className="form-control"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="e.g. Morocco"
                required
              />
              {fieldErr('country')}
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>
                Used to match recommendations to users in that country.
              </div>
            </div>

            {/* Stadium Coordinates */}
            <div className="col-12">
              <label className="form-label d-flex align-items-center gap-2">
                📍 Stadium Coordinates
                <span className="badge" style={{ background: 'var(--primary-lt)', color: 'var(--primary)', fontWeight: 500, fontSize: '.7rem' }}>
                  Used for the interactive map on the ticket
                </span>
              </label>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small" style={{ color: 'var(--muted)' }}>Latitude</label>
              <input className="form-control" name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 33.971590" />
              {fieldErr('latitude')}
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>e.g. 33.971590 (Stade Mohammed V, Casablanca)</div>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small" style={{ color: 'var(--muted)' }}>Longitude</label>
              <input className="form-control" name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. -6.849813" />
              {fieldErr('longitude')}
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>e.g. -6.849813</div>
            </div>

            {/* Price & Seats */}
            <div className="col-12 col-md-6">
              <label className="form-label">Ticket Price (USD) *</label>
              <input className="form-control" type="number" step="0.01" min="0" name="price" value={form.price} onChange={handleChange} required />
              {fieldErr('price')}
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Total Seats *</label>
              <input className="form-control" type="number" min="1" name="total_seats" value={form.total_seats} onChange={handleChange} required />
              {fieldErr('total_seats')}
            </div>

            {/* Description */}
            <div className="col-12">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>

            {/* Image */}
            <div className="col-12">
              <label className="form-label">Match Image (optional)</label>
              <input className="form-control" type="file" name="image" accept="image/*" onChange={handleChange} />
              <div className="small mt-1" style={{ color: 'var(--muted)' }}>
                Upload a banner image for this match (JPG/PNG recommended).
              </div>
              {isEdit && form.imageUrl && !form.image && (
                <div className="mt-2">
                  <img src={form.imageUrl} alt="Current image" className="rounded-3" style={{ maxHeight: '120px' }} />
                </div>
              )}
            </div>

          </div>{/* /row */}

          {/* Info box */}
          <div className="mt-4 p-3 rounded-3"
               style={{ background: 'var(--primary-lt)', border: '1px solid rgba(37,99,235,.2)', fontSize: '.83rem', color: 'var(--text-soft)' }}>
            <i className="bi bi-info-circle me-1" style={{ color: 'var(--primary)' }}></i>
            After creating, staff managers will be notified to review and publish the match.
            The match will remain <strong>Pending</strong> until a staff member approves it.
          </div>

          <div className="d-flex gap-3 mt-4">
            <button type="submit" className="btn btn-primary px-4 py-2" disabled={saving}>
              <i className="bi bi-save me-1"></i>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Match'}
            </button>
            <Link to="/admin" className="btn btn-outline-light">Cancel</Link>
          </div>
        </form>
      </div>

    </div>
  );
}
