import { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:8089';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'USER' });
  const [showCreate, setShowCreate] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const login = async () => {
    try {
      setError('');
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.accessToken) {
        setToken(data.accessToken);
        localStorage.setItem('token', data.accessToken);
      } else {
        setError('Invalid credentials');
      }
    } catch (e) {
      setError('Connection failed: ' + e.message);
    }
  };

  const logout = () => { setToken(''); localStorage.removeItem('token'); setUsers([]); };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/users`, { headers });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      setUsers(data.data || []);
    } catch (e) { setError('Failed to fetch users'); }
  };

  const createUser = async () => {
    try {
      await fetch(`${API}/api/users`, { method: 'POST', headers, body: JSON.stringify(newUser) });
      setNewUser({ username: '', email: '', password: '', role: 'USER' });
      setShowCreate(false);
      fetchUsers();
    } catch (e) { setError('Failed to create user'); }
  };

  const updateUser = async () => {
    try {
      await fetch(`${API}/api/users/${editUser.id}`, {
        method: 'PUT', headers, body: JSON.stringify(editUser)
      });
      setEditUser(null);
      fetchUsers();
    } catch (e) { setError('Failed to update user'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await fetch(`${API}/api/users/${id}`, { method: 'DELETE', headers });
      fetchUsers();
    } catch (e) { setError('Failed to delete user'); }
  };

  useEffect(() => { if (token) fetchUsers(); }, [token]);

  if (!token) {
    return (
      <div className="app">
        <div className="login-card">
          <h1>User Management</h1>
          <p className="subtitle">Sign in to manage users</p>
          {error && <div className="error">{error}</div>}
          <input placeholder="Username" value={loginForm.username}
            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input placeholder="Password" type="password" value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button className="btn-primary" onClick={login}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>User Management</h1>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New User</button>
          <button className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create User</h2>
            <input placeholder="Username" value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
            <input placeholder="Email" value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <input placeholder="Password" type="password" value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="modal-actions">
              <button className="btn-primary" onClick={createUser}>Create</button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit User</h2>
            <input placeholder="Username" value={editUser.username}
              onChange={e => setEditUser({ ...editUser, username: e.target.value })} />
            <input placeholder="Email" value={editUser.email}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" checked={editUser.active}
                onChange={e => setEditUser({ ...editUser, active: e.target.checked })} /> Active
            </label>
            <div className="modal-actions">
              <button className="btn-primary" onClick={updateUser}>Save</button>
              <button className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td><span className={`badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>{user.role}</span></td>
              <td><span className={`badge ${user.active ? 'active' : 'inactive'}`}>{user.active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button className="btn-sm" onClick={() => setEditUser({ ...user })}>Edit</button>
                <button className="btn-sm danger" onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
