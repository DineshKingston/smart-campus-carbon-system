import { useAuth } from '../context/AuthContext'

export default function Topbar({ title }) {
    const { user } = useAuth()
    return (
        <div className="topbar">
            <h1 className="topbar-title">{title}</h1>
            <div className="topbar-right">
                <span className="badge badge-green topbar-live">🟢 Live</span>
                <span className="badge badge-blue topbar-role">{user?.role}</span>
                <a
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary topbar-grafana"
                    style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                >
                    📊 <span className="grafana-text">Open Grafana</span>
                </a>
            </div>
        </div>
    )
}
