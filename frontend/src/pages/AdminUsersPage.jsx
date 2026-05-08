import { useState, useEffect } from 'react';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState({});

  useEffect(() => {
    api.get('/admin/users/').then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(s => ({ ...s, [userId]: true }));
    try {
      await api.patch(`/admin/users/${userId}/role/`, { role: newRole });
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch { alert('Role change failed.'); }
    finally { setSaving(s => ({ ...s, [userId]: false })); }
  };

  const rolePillClass = r => {
    if (r === 'admin') return 'status-pill status-cancelled';
    if (r === 'staff') return 'status-pill status-pending';
    return 'status-pill status-published';
  };

  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  return (
    <div className="container-fluid">
      <div className="row">

        {/* Sidebar */}
        <AdminSidebar activeItem="users" />

        {/* Main */}
        <div className="col py-4 px-4">
          <h1 className="h3 fw-bold mb-4">
            <i className="bi bi-people-fill me-2 text-warning"></i>Manage Users
          </h1>

          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="text-end">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(u => (
                    <tr key={u.id}>
                      <td className="text-muted" style={{ fontSize: '.8rem' }}>{u.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '32px', height: '32px', fontSize: '.8rem', fontWeight: 700, background: 'linear-gradient(135deg,var(--primary),#7c3aed)' }}
                          >
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <span className="fw-600">{u.username}</span>
                          {u.is_superuser && <span className="badge bg-danger ms-1">super</span>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '.83rem' }}>{u.email || '—'}</td>
                      <td>
                        <span className={rolePillClass(u.role)}>
                          {u.role === 'admin' ? 'Administrator' : u.role === 'staff' ? 'Staff Manager' : 'Client'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                        {new Date(u.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="text-end">
                        {!u.is_superuser ? (
                          <div className="d-flex gap-1 justify-content-end align-items-center">
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '120px', fontSize: '.8rem' }}
                              value={u.role}
                              disabled={saving[u.id]}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="client">Client</option>
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={saving[u.id]}
                              onClick={() => handleRoleChange(u.id, u.role)}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Superuser</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4" style={{ color: 'var(--muted)' }}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* /col */}
      </div>{/* /row */}
    </div>
  );
}
