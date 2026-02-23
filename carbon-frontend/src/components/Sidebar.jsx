import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
    const { user, logout } = useAuth()
    const isAdmin = user?.role === 'ADMIN'

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <h2>🌿 Carbon Tracker</h2>
                <span>Smart Campus System</span>
            </div>
            <nav>
                <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">🏠</span>Dashboard
                </NavLink>
                <NavLink to="/emissions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">📋</span>Emission Records
                </NavLink>
                <NavLink to="/predictions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">🤖</span>ML Predictions
                </NavLink>
                {isAdmin && (
                    <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                        <span className="nav-icon">👥</span>User Management
                    </NavLink>
                )}
            </nav>
            <div className="sidebar-footer">
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    Logged in as <strong style={{ color: 'var(--text-secondary)' }}>{user?.username}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    <span style={{
                        background: user?.role === 'ADMIN' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                        color: user?.role === 'ADMIN' ? '#f59e0b' : '#818cf8',
                        padding: '1px 8px', borderRadius: 10, fontWeight: 700, fontSize: '0.7rem'
                    }}>{user?.role}</span>
                </div>
                <button className="logout-btn" onClick={logout}>⏻ Logout</button>
            </div>
        </div>
    )
}
