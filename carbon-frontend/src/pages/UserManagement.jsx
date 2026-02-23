import { useState, useEffect } from 'react'
import { adminAPI } from '../api'
import { useAuth } from '../context/AuthContext'

export default function UserManagement() {
    const { user } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'STUDENT' })
    const [creating, setCreating] = useState(false)

    const fetchUsers = () => {
        setLoading(true)
        adminAPI.listUsers()
            .then(r => setUsers(r.data))
            .catch(() => setError('Failed to load users'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchUsers() }, [])

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const handleCreate = async (e) => {
        e.preventDefault()
        setError(''); setSuccess('')
        setCreating(true)
        try {
            await adminAPI.createUser(form)
            setSuccess(`User "${form.username}" created successfully!`)
            setForm({ username: '', email: '', password: '', role: 'STUDENT' })
            fetchUsers()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id, username) => {
        if (username === user?.username) {
            setError("You cannot delete your own account!")
            return
        }
        if (!window.confirm(`Delete user "${username}"?`)) return
        try {
            await adminAPI.deleteUser(id)
            setSuccess(`User "${username}" deleted.`)
            fetchUsers()
        } catch {
            setError('Failed to delete user')
        }
    }

    return (
        <>
            <div className="page-header">
                <h2>👥 User Management</h2>
                <p>Manage all campus system users. Only admins can access this page.</p>
            </div>

            {error && <div className="error-msg" style={{ marginBottom: 16 }}>⚠ {error}</div>}
            {success && (
                <div style={{
                    background: 'rgba(16,185,129,0.12)', border: '1px solid var(--accent-green)',
                    borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: 'var(--accent-green)', fontSize: '0.9rem'
                }}>✅ {success}</div>
            )}

            {/* Create User Form */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>➕ Create New User</h3>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Username</label>
                        <input className="form-control" value={form.username} onChange={set('username')}
                            placeholder="newuser" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Email</label>
                        <input type="email" className="form-control" value={form.email} onChange={set('email')}
                            placeholder="user@campus.edu" required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Password</label>
                        <input type="password" className="form-control" value={form.password} onChange={set('password')}
                            placeholder="Min 6 characters" required minLength={6} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label>Role</label>
                        <select className="form-control" value={form.role} onChange={set('role')}>
                            <option value="STUDENT">Student</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <button className="btn btn-primary" type="submit" disabled={creating}>
                            {creating ? '⏳ Creating…' : '➕ Create User'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Users Table */}
            <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📋 All Users ({users.length})</h3>
                {loading ? (
                    <div className="loading">⏳ Loading users…</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    {['ID', 'Username', 'Email', 'Role', 'Created At', 'Action'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.id}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.username}</td>
                                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                                                background: u.role === 'ADMIN' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                                                color: u.role === 'ADMIN' ? 'var(--accent-yellow)' : '#818cf8'
                                            }}>{u.role}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {u.createdAt ? u.createdAt.split('T')[0] : '—'}
                                        </td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <button
                                                onClick={() => handleDelete(u.id, u.username)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                                    color: '#ef4444', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem'
                                                }}>
                                                🗑 Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}
