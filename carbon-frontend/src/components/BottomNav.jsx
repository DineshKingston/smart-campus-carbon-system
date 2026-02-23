import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'

    return (
        <nav className="bottom-nav">
            <NavLink to="/" end className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                <span className="bottom-nav-icon">🏠</span>
                <span className="bottom-nav-label">Dashboard</span>
            </NavLink>
            <NavLink to="/emissions" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                <span className="bottom-nav-icon">📋</span>
                <span className="bottom-nav-label">Records</span>
            </NavLink>
            <NavLink to="/predictions" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                <span className="bottom-nav-icon">🤖</span>
                <span className="bottom-nav-label">AI Predict</span>
            </NavLink>
            {isAdmin && (
                <NavLink to="/users" className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
                    <span className="bottom-nav-icon">👥</span>
                    <span className="bottom-nav-label">Users</span>
                </NavLink>
            )}
        </nav>
    )
}
