import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications/').then(r => setNotifs(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const typeIconClass = t => {
    if (t === 'booking_conf') return 'bi-check-circle-fill';
    if (t === 'new_match')    return 'bi-trophy-fill';
    if (t === 'match_pub')    return 'bi-broadcast';
    return 'bi-bell-fill';
  };

  const typeIconStyle = t => {
    if (t === 'booking_conf') return { background: 'rgba(16,185,129,.15)', color: '#34d399' };
    if (t === 'new_match')    return { background: 'rgba(245,158,11,.15)', color: '#fbbf24' };
    if (t === 'match_pub')    return { background: 'rgba(79,70,229,.15)',  color: '#818cf8' };
    return { background: 'rgba(148,163,184,.1)', color: '#94a3b8' };
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  return (
    <div className="container py-5" style={{ maxWidth: '760px' }}>

      <h1 className="h3 fw-bold mb-4">
        <i className="bi bi-bell-fill me-2" style={{ color: 'var(--accent)' }}></i>
        Notifications
      </h1>

      {notifs.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {notifs.map(notif => (
            <div key={notif.id} className="card p-4"
                 style={{ borderColor: !notif.is_read ? 'rgba(79,70,229,.4)' : undefined }}>
              <div className="d-flex justify-content-between align-items-start">

                <div className="d-flex gap-3 align-items-start">
                  {/* Icon by type */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '42px', height: '42px', fontSize: '1.2rem', ...typeIconStyle(notif.notif_type) }}
                  >
                    <i className={`bi ${typeIconClass(notif.notif_type)}`}></i>
                  </div>

                  <div>
                    <h6 className="fw-bold mb-1">{notif.title}</h6>
                    <p className="mb-1" style={{ color: 'var(--muted)', fontSize: '.88rem', whiteSpace: 'pre-line' }}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <a href={notif.link} style={{ color: '#818cf8', fontSize: '.82rem' }}>
                        <i className="bi bi-arrow-right me-1"></i>Go to page
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-end flex-shrink-0 ms-3">
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                    {new Date(notif.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {!notif.is_read && (
                    <span className="badge mt-1" style={{ background: 'rgba(79,70,229,.2)', color: '#818cf8' }}>New</span>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <div style={{ fontSize: '5rem', opacity: .3 }}>🔔</div>
          <h4 className="mt-3" style={{ color: 'var(--muted)' }}>No notifications yet</h4>
          <p style={{ color: 'var(--muted)' }}>You'll be notified when new matches are published.</p>
        </div>
      )}

    </div>
  );
}
