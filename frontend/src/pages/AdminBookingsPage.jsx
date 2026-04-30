import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/admin/bookings/').then(r => setBookings(r.data.results || r.data))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = s => ({ confirmed:'badge-success', cancelled:'badge-danger', pending:'badge-warning' }[s] || 'badge-neutral');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">All Bookings</h1>
          <p className="page-subtitle">{bookings.length} total bookings</p>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Ref</th><th>User</th><th>Match</th><th>Qty</th><th>Total</th><th>Status</th><th>Booked At</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily:'monospace', fontSize:'.82rem', color:'var(--accent)' }}>{b.booking_ref}</td>
                    <td style={{ fontWeight:600 }}>{b.user?.username}</td>
                    <td className="text-sm">{b.match?.title}</td>
                    <td>{b.quantity}</td>
                    <td style={{ fontWeight:700 }}>${b.total_price}</td>
                    <td><span className={`badge ${statusBadge(b.status)}`}>{b.status}</span></td>
                    <td className="text-sm text-muted">{new Date(b.booked_at).toLocaleString('en-GB')}</td>
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
