import { useState, useEffect } from 'react';
import api from '../api/axios';

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

  const roleBadge = r => ({ admin:'badge-danger', staff:'badge-warning', client:'badge-info' }[r] || 'badge-neutral');

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Joined</th><th>Role</th><th>Change Role</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight:600 }}>{u.username}<br /><span className="text-muted text-sm">{u.first_name} {u.last_name}</span></td>
                    <td className="text-muted text-sm">{u.email}</td>
                    <td className="text-sm">{new Date(u.date_joined).toLocaleDateString('en-GB')}</td>
                    <td><span className={`badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                    <td>
                      <select className="form-control" style={{ width:'auto', padding:'.3rem .6rem', fontSize:'.8rem' }}
                        value={u.role} disabled={saving[u.id]}
                        onChange={e => handleRoleChange(u.id, e.target.value)}>
                        <option value="client">client</option>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
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
