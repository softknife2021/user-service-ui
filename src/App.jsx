import { useState, useEffect } from 'react';
import './App.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:8089' : '';

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
        <div className="login-card" data-testid="login-form">
          <h1 data-testid="login-title">User Management</h1>
          <p className="subtitle">Sign in to manage users</p>
          {error && <div className="error" data-testid="login-error">{error}</div>}
          <input data-testid="login-username" placeholder="Username" value={loginForm.username}
            onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input data-testid="login-password" placeholder="Password" type="password" value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && login()} />
          <button data-testid="login-submit" className="btn-primary" onClick={login}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header data-testid="header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button data-testid="create-user-btn" className="btn-primary" onClick={() => setShowCreate(true)}>+ New User</button>
          <button data-testid="logout-btn" className="btn-secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      {error && <div className="error" data-testid="error-message">{error}</div>}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" data-testid="create-user-modal" onClick={e => e.stopPropagation()}>
            <h2>Create User</h2>
            <input data-testid="create-username" placeholder="Username" value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
            <input data-testid="create-email" placeholder="Email" value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <input data-testid="create-password" placeholder="Password" type="password" value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            <select data-testid="create-role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div className="modal-actions">
              <button data-testid="create-submit" className="btn-primary" onClick={createUser}>Create</button>
              <button data-testid="create-cancel" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal" data-testid="edit-user-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit User</h2>
            <input data-testid="edit-username" placeholder="Username" value={editUser.username}
              onChange={e => setEditUser({ ...editUser, username: e.target.value })} />
            <input data-testid="edit-email" placeholder="Email" value={editUser.email}
              onChange={e => setEditUser({ ...editUser, email: e.target.value })} />
            <select data-testid="edit-role" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <label className="checkbox-label">
              <input data-testid="edit-active" type="checkbox" checked={editUser.active}
                onChange={e => setEditUser({ ...editUser, active: e.target.checked })} /> Active
            </label>
            <div className="modal-actions">
              <button data-testid="edit-submit" className="btn-primary" onClick={updateUser}>Save</button>
              <button data-testid="edit-cancel" className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <table data-testid="users-table">
        <thead>
          <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} data-testid={`user-row-${user.id}`}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td><span className={`badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>{user.role}</span></td>
              <td><span className={`badge ${user.active ? 'active' : 'inactive'}`}>{user.active ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button data-testid={`edit-btn-${user.id}`} className="btn-sm" onClick={() => setEditUser({ ...user })}>Edit</button>
                <button data-testid={`delete-btn-${user.id}`} className="btn-sm danger" onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
