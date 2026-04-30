import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function StaffDashboardPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState({});

  useEffect(() => {
    api.get('/staff/matches/').then(r => setMatches(r.data))
      .finally(() => setLoading(false));
  }, []);

  const doPublish = async (id) => {
    setAction(a => ({ ...a, [id]:'loading' }));
    try {
      await api.post(`/staff/matches/${id}/publish/`);
      setMatches(ms => ms.map(m => m.id === id ? { ...m, status:'published' } : m));
    } catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
    finally { setAction(a => ({ ...a, [id]:null })); }
  };

  const doHide = async (id) => {
    setAction(a => ({ ...a, [id]:'loading' }));
    try {
      await api.post(`/staff/matches/${id}/hide/`);
      setMatches(ms => ms.map(m => m.id === id ? { ...m, status:'hidden' } : m));
    } catch (e) { alert(e.response?.data?.detail || 'Failed.'); }
    finally { setAction(a => ({ ...a, [id]:null })); }
  };

  const statusBadge = s => ({
    published: 'badge-success', pending: 'badge-warning', hidden: 'badge-neutral', cancelled: 'badge-danger'
  }[s] || 'badge-neutral');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const pending   = matches.filter(m => m.status === 'pending').length;
  const published = matches.filter(m => m.status === 'published').length;
  const hidden    = matches.filter(m => m.status === 'hidden').length;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Staff Dashboard</h1>
          <p className="page-subtitle">Manage match visibility</p>
        </div>

        <div className="stat-grid">
          {[['Pending', pending, '#f59e0b'], ['Published', published, '#10b981'], ['Hidden', hidden, '#7c8599']].map(([label, val, color]) => (
            <div key={label} className="stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match</th><th>Teams</th><th>Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight:600 }}>{m.title}</td>
                    <td className="text-muted text-sm">{m.home_team} vs {m.away_team}</td>
                    <td className="text-sm">{new Date(m.date).toLocaleDateString('en-GB')}</td>
                    <td><span className={`badge ${statusBadge(m.status)}`}>{m.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:'.5rem' }}>
                        {m.status !== 'published' && (
                          <button className="btn btn-success btn-sm" disabled={action[m.id] === 'loading'}
                            onClick={() => doPublish(m.id)}>Publish</button>
                        )}
                        {m.status === 'published' && (
                          <button className="btn btn-outline btn-sm" disabled={action[m.id] === 'loading'}
                            onClick={() => doHide(m.id)}>Hide</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
