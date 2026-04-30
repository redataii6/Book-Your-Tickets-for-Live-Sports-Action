import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/').then(r => setNotifs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const typeIcon = t => ({ new_match:'🏟️', match_pub:'✅', booking_conf:'🎟️', match_update:'✏️', general:'🔔' }[t] || '🔔');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth:'720px' }}>
        <div className="page-header">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</p>
        </div>

        {notifs.length === 0 ? (
          <div className="text-center mt-3" style={{ color:'var(--muted)' }}>
            <div style={{ fontSize:'3rem' }}>🔕</div>
            <p className="mt-1">No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
            {notifs.map(n => (
              <div key={n.id} className="card" style={{ borderLeft: n.is_read ? undefined : '3px solid var(--accent)' }}>
                <div className="card-body" style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'1.6rem', flexShrink:0 }}>{typeIcon(n.notif_type)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, marginBottom:'.2rem' }}>{n.title}</div>
                    <div className="text-muted text-sm" style={{ whiteSpace:'pre-line' }}>{n.message}</div>
                    <div className="text-muted text-sm mt-1">
                      {new Date(n.created_at).toLocaleString('en-GB')}
                    </div>
                  </div>
                  {!n.is_read && <span className="badge badge-info">New</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
