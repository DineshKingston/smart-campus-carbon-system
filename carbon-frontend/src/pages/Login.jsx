import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api'

export default function Login() {
    const { login } = useAuth()
    const [mode, setMode] = useState('login')  // 'login' | 'register'
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            const res = mode === 'login'
                ? await authAPI.login({ username: form.username, password: form.password })
                : await authAPI.register({ username: form.username, email: form.email, password: form.password })
            login(res.data)
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">🌿</div>
                <h1>Carbon Tracker</h1>
                <p className="subtitle">Smart Campus Emission Monitoring</p>

                {error && <div className="error-msg">⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input id="username" className="form-control" value={form.username}
                            onChange={set('username')} placeholder="Enter username" required />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Email</label>
                            <input id="email" type="email" className="form-control" value={form.email}
                                onChange={set('email')} placeholder="user@campus.edu" required />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Password</label>
                        <input id="password" type="password" className="form-control" value={form.password}
                            onChange={set('password')} placeholder="••••••••" required />
                    </div>

                    <button id="submit-btn" className="btn btn-primary" type="submit"
                        style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? '⏳ Please wait…' : mode === 'login' ? '🔑 Login' : '📝 Register'}
                    </button>
                </form>

                {mode === 'register' && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
                        New accounts are registered as <strong>Student</strong> by default.
                    </p>
                )}

                <div className="auth-toggle">
                    {mode === 'login' ? (
                        <>Don't have an account? <span onClick={() => { setMode('register'); setError('') }}>Register</span></>
                    ) : (
                        <>Already have an account? <span onClick={() => { setMode('login'); setError('') }}>Login</span></>
                    )}
                </div>
            </div>
        </div>
    )
}
