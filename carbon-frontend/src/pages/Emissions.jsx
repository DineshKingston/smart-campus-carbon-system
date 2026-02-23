import { useEffect, useState, useRef } from 'react'
import { emissionAPI } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Emissions() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'

    const [records, setRecords] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ categoryId: '', month: '', value: '' })
    const [submitting, setSubmitting] = useState(false)
    const [msg, setMsg] = useState({ type: '', text: '' })

    // CSV upload state
    const [csvFile, setCsvFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [uploadMsg, setUploadMsg] = useState({ type: '', text: '' })
    const fileInputRef = useRef()

    useEffect(() => {
        const fetches = isAdmin
            ? Promise.all([emissionAPI.getAll(), emissionAPI.categories()])
            : Promise.all([Promise.resolve({ data: [] }), emissionAPI.categories()])

        fetches
            .then(([recs, cats]) => {
                setRecords(recs.data)
                setCategories(cats.data)
                if (cats.data.length > 0) setForm(f => ({ ...f, categoryId: cats.data[0].id }))
            })
            .finally(() => setLoading(false))
    }, [isAdmin])

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

    const handleAdd = async (e) => {
        e.preventDefault()
        setSubmitting(true); setMsg({ type: '', text: '' })
        try {
            const res = await emissionAPI.add({
                categoryId: parseInt(form.categoryId),
                month: form.month,
                value: parseFloat(form.value),
            })
            setRecords(prev => [res.data, ...prev])
            setForm(f => ({ ...f, month: '', value: '' }))
            setMsg({ type: 'success', text: `✅ Added record: ${res.data.co2Kg} kg CO₂` })
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add record' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return
        try {
            await emissionAPI.delete(id)
            setRecords(prev => prev.filter(r => r.id !== id))
        } catch {
            alert('Failed to delete record')
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0] || null
        setCsvFile(file)
    }

    const handleCsvUpload = async () => {
        if (!csvFile) return
        setUploading(true); setUploadMsg({ type: '', text: '' })
        try {
            const res = await emissionAPI.upload(csvFile)
            const { rows_imported, rows_skipped, columns_detected } = res.data
            const cols = columns_detected?.length ? ` Columns: ${columns_detected.join(', ')}.` : ''
            const skip = rows_skipped > 0 ? ` (${rows_skipped} rows skipped)` : ''
            setUploadMsg({ type: 'success', text: `✅ Imported ${rows_imported} records${skip}.${cols}` })
            setCsvFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            if (isAdmin) {
                const updated = await emissionAPI.getAll()
                setRecords(updated.data)
            }
        } catch (err) {
            setUploadMsg({ type: 'error', text: err.response?.data?.error || 'Failed to upload CSV' })
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="loading">⏳ Loading records…</div>

    return (
        <>
            <div className="page-header">
                <h2>Emission Records</h2>
                <p>Log campus energy, fuel, transport, and waste usage. CO₂ is auto-calculated.</p>
            </div>

            {/* Manual Add Form */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 18, fontSize: '0.95rem', fontWeight: 600 }}>➕ Add New Record</h3>
                {msg.text && <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>{msg.text}</div>}
                <form onSubmit={handleAdd} className="add-record-form">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Category</label>
                        <select id="categoryId" className="form-control" value={form.categoryId} onChange={set('categoryId')} required>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Month (YYYY-MM)</label>
                        <input id="month" className="form-control" type="month" value={form.month}
                            onChange={(e) => setForm(f => ({ ...f, month: e.target.value }))} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Value</label>
                        <input id="value" className="form-control" type="number" step="0.01" min="0"
                            value={form.value} onChange={set('value')} placeholder="e.g. 1500" required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ visibility: 'hidden' }}>Add</label>
                        <button id="add-record-btn" className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
                            {submitting ? '⏳' : '+ Add'}
                        </button>
                    </div>
                </form>
            </div>

            {/* CSV Dataset Upload */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 6, fontSize: '0.95rem', fontWeight: 600 }}>📂 Upload Dataset (CSV)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Bulk import records via CSV. Format: <code>category_id,month,value</code> (with header row).
                    Category IDs: 1=Electricity, 2=Diesel, 3=Transport, 4=Waste
                </p>
                {uploadMsg.text && (
                    <div style={{
                        padding: '8px 14px', borderRadius: 8, marginBottom: 14, fontSize: '0.875rem',
                        background: uploadMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${uploadMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        color: uploadMsg.type === 'error' ? '#ef4444' : 'var(--accent-green)'
                    }}>{uploadMsg.text}</div>
                )}
                <div className="csv-upload-row">
                    {/* Styled file chooser button */}
                    <label className="file-choose-btn">
                        📁 Choose File
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <span className="file-name-label">
                        {csvFile ? csvFile.name : 'No file chosen'}
                    </span>
                    <button
                        className="btn btn-primary"
                        onClick={handleCsvUpload}
                        disabled={!csvFile || uploading}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {uploading ? '⏳ Uploading…' : '⬆ Upload CSV'}
                    </button>
                </div>
                {csvFile && (
                    <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Selected: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024).toFixed(1)} KB)
                    </p>
                )}
            </div>

            {/* Records Table — Admin only */}
            {isAdmin && (
                <div className="card">
                    <h3 style={{ marginBottom: 16, fontSize: '0.95rem', fontWeight: 600 }}>
                        📋 Records ({records.length})
                    </h3>
                    {records.length === 0 ? (
                        <div className="empty"><div className="empty-icon">📭</div>No records yet. Add one above or upload a CSV.</div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Month</th>
                                        <th>Category</th>
                                        <th>Value</th>
                                        <th>CO₂ (kg)</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id}>
                                            <td style={{ color: 'var(--text-muted)' }}>{r.id}</td>
                                            <td><span className="month-badge">{r.month}</span></td>
                                            <td>{r.categoryName}</td>
                                            <td>{r.value.toLocaleString()} {r.unit}</td>
                                            <td className="co2-value">{r.co2Kg.toLocaleString()}</td>
                                            <td>
                                                <button className="btn btn-danger" style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                                                    onClick={() => handleDelete(r.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Student: friendly note after upload */}
            {!isAdmin && (
                <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Your records have been submitted. An administrator will review the data in the dashboard.
                    </p>
                </div>
            )}
        </>
    )
}
