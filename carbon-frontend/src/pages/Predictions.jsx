import { useEffect, useState, useRef } from 'react'
import { predictionAPI } from '../api'

function nextMonth() {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 7)
}

function R2Bar({ score }) {
    const pct = Math.min(Math.max((score ?? 0) * 100, 0), 100).toFixed(1)
    return (
        <div className="r2-bar-wrap">
            <div className="r2-bar-label">
                <span>Model Accuracy (R²)</span>
                <strong style={{ color: 'var(--accent-green)' }}>{pct}%</strong>
            </div>
            <div className="r2-bar-track">
                <div className="r2-bar-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function Predictions() {
    const [history, setHistory] = useState([])
    const [month, setMonth] = useState(nextMonth)
    const [result, setResult] = useState(null)
    const [mlStatus, setMlStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [lastRefresh, setLastRefresh] = useState(null)
    const intervalRef = useRef(null)

    const refreshStatus = () => {
        predictionAPI.health()
            .then(r => { setMlStatus(r.data); setLastRefresh(new Date()) })
            .catch(() => setMlStatus({ status: 'error' }))
    }

    useEffect(() => {
        predictionAPI.history().then(r => setHistory(r.data)).catch(() => { })
        refreshStatus()
        intervalRef.current = setInterval(refreshStatus, 30000)
        return () => clearInterval(intervalRef.current)
    }, [])

    const handleForecast = async () => {
        setLoading(true); setError(''); setResult(null)
        try {
            const res = await predictionAPI.forecast(month)
            setResult(res.data)
            const hist = await predictionAPI.history()
            setHistory(hist.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Prediction failed — check ML service')
        } finally {
            setLoading(false)
        }
    }

    const isOnline = mlStatus?.status === 'ok'

    return (
        <>
            <div className="page-header">
                <h2>🤖 ML Predictions</h2>
                <p>AI-powered CO₂ forecasting — auto-refreshes every 30s</p>
            </div>

            {/* ── ML Health Status ── */}
            <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 12 }}>⚡ ML Service Status</h3>
                        {mlStatus ? (
                            <div className="ml-status-row">
                                <div className={`pulse-dot${isOnline ? '' : ' offline'}`} />
                                <span style={{
                                    fontSize: '0.85rem', fontWeight: 700,
                                    color: isOnline ? 'var(--accent-green)' : 'var(--accent-red)'
                                }}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                                {mlStatus.model_name && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Model: <strong style={{ color: 'var(--text-secondary)' }}>{mlStatus.model_name}</strong>
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="ml-status-row">
                                <div className="pulse-dot" style={{ background: 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Connecting…</span>
                            </div>
                        )}
                    </div>
                    {lastRefresh && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
                            Refreshed {lastRefresh.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                {mlStatus?.r2_score != null && (
                    <R2Bar score={mlStatus.r2_score} />
                )}
            </div>

            {/* ── Forecast Control ── */}
            <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 16 }}>📅 Generate Forecast</h3>
                <div className="forecast-row" style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label>Target Month</label>
                        <input
                            id="forecast-month"
                            type="month"
                            className="form-control"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <button
                        id="forecast-btn"
                        className="btn btn-primary"
                        onClick={handleForecast}
                        disabled={loading || !isOnline}
                        style={{ minWidth: 160 }}
                    >
                        {loading ? (
                            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Predicting…</>
                        ) : '🔮 Run Prediction'}
                    </button>
                </div>
                {!isOnline && mlStatus && (
                    <p style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--accent-red)' }}>
                        ⚠ ML service is offline — predictions unavailable
                    </p>
                )}
                {error && <div className="error-msg" style={{ marginTop: 14 }}>⚠ {error}</div>}

                {result && (
                    <div className="prediction-result">
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                            Predicted CO₂ for <strong style={{ color: 'var(--text-primary)' }}>{result.month}</strong>
                        </div>
                        <div className="co2-big">{result.predicted_co2?.toLocaleString()} <small style={{ fontSize: '1rem' }}>kg</small></div>
                        <span className="model-tag">🤖 {result.model_used}</span>
                        {result.r2_score && (
                            <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                R²: <strong style={{ color: 'var(--accent-green)' }}>{result.r2_score}</strong>
                                {result.mae_kg && <> · MAE: <strong>{result.mae_kg} kg</strong></>}
                            </div>
                        )}
                        <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--accent-teal)' }}>
                            ✅ Stored in DB · Visible in Grafana dashboard
                        </div>
                    </div>
                )}
            </div>

            {/* ── Prediction History ── */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 600 }}>📜 Prediction History</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last {history.length} predictions</span>
                </div>

                {history.length === 0 ? (
                    <div className="empty"><div className="empty-icon">🔮</div>No predictions yet. Run one above.</div>
                ) : (
                    <div className="pred-card-grid">
                        {history.map(p => (
                            <div className="pred-hist-card" key={p.id}>
                                <div className="pred-hist-month">{p.month}</div>
                                <div className="pred-hist-value">{p.predictedCo2?.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>kg CO₂</span></div>
                                <div className="pred-hist-meta">
                                    <span style={{
                                        background: 'rgba(59,130,246,0.12)', color: 'var(--accent-blue)',
                                        padding: '1px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 600
                                    }}>{p.modelUsed}</span>
                                    {' · '}{new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </>
    )
}
