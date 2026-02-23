import { useEffect, useState } from 'react'
import { dashboardAPI } from '../api'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, Sector,
    BarChart, Bar
} from 'recharts'

const COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6']

const CustomTooltip = ({ active, payload, label, unit }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem'
            }}>
                {label && <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>}
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color || '#10b981', fontWeight: 700 }}>
                        {p.name || 'CO₂'}: {Number(p.value).toLocaleString()} {unit || 'kg'}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percent } = props
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0" style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill={fill} style={{ fontSize: '0.82rem' }}>
                {Number(value).toLocaleString()} kg
            </text>
            <text x={cx} y={cy + 34} textAnchor="middle" fill="#64748b" style={{ fontSize: '0.75rem' }}>
                ({(percent * 100).toFixed(1)}%)
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    )
}

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        dashboardAPI.summary()
            .then(r => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="loading">⏳ Loading dashboard…</div>

    const totalCo2 = data?.total_co2_kg?.toLocaleString() ?? '—'
    const records = data?.total_records ?? '—'
    const preds = data?.total_predictions ?? '—'
    const breakdown = data?.category_breakdown ?? {}
    const monthlyTrend = (data?.monthly_trend ?? []).slice(-12) // last 12 months

    const topCategory = Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—'

    // Pie chart data
    const pieData = Object.entries(breakdown).map(([name, value]) => ({ name, value }))

    // Bar chart: top 5 months
    const barData = [...monthlyTrend].sort((a, b) => b.co2_kg - a.co2_kg).slice(0, 6)

    return (
        <>
            <div className="page-header">
                <h2>Campus Carbon Overview</h2>
                <p>Real-time emission monitoring — AI-powered campus carbon intelligence</p>
            </div>

            {/* KPI Cards */}
            <div className="stat-grid">
                <div className="stat-card green">
                    <div className="stat-label">Total CO₂ Emitted</div>
                    <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{totalCo2}</div>
                    <div className="stat-sub">kg CO₂ • all time</div>
                </div>
                <div className="stat-card teal">
                    <div className="stat-label">Emission Records</div>
                    <div className="stat-value" style={{ color: 'var(--accent-teal)' }}>{records}</div>
                    <div className="stat-sub">total entries logged</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-label">ML Predictions</div>
                    <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{preds}</div>
                    <div className="stat-sub">forecasts stored</div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-label">Top Emission Source</div>
                    <div className="stat-value" style={{ color: 'var(--accent-yellow)', fontSize: '1.3rem' }}>{topCategory}</div>
                    <div className="stat-sub">highest CO₂ category</div>
                </div>
            </div>

            {/* Monthly CO2 Trend — Line Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 20, fontSize: '0.97rem', fontWeight: 600 }}>
                    📈 Monthly CO₂ Trend (Last 12 Months)
                </h3>
                {monthlyTrend.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No trend data yet — add records to see charts</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                            <Tooltip content={<CustomTooltip unit="kg CO₂" />} />
                            <Line
                                type="monotone" dataKey="co2_kg" name="CO₂"
                                stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }}
                                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Donut Pie Chart — Category Breakdown */}
                <div className="card">
                    <h3 style={{ marginBottom: 20, fontSize: '0.97rem', fontWeight: 600 }}>🍩 Category Breakdown</h3>
                    {pieData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No data yet</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={65} outerRadius={95}
                                        dataKey="value"
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                {pieData.map((d, i) => (
                                    <span key={d.name} style={{
                                        fontSize: '0.75rem', color: COLORS[i % COLORS.length],
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                                        {d.name}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Bar Chart — Top 6 months by emission */}
                <div className="card">
                    <h3 style={{ marginBottom: 20, fontSize: '0.97rem', fontWeight: 600 }}>📊 Top Emission Months</h3>
                    {barData.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false}
                                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                <Tooltip content={<CustomTooltip unit="kg CO₂" />} />
                                <Bar dataKey="co2_kg" name="CO₂" radius={[6, 6, 0, 0]}>
                                    {barData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </>
    )
}
