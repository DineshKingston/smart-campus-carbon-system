import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Emissions from './pages/Emissions'
import Predictions from './pages/Predictions'
import UserManagement from './pages/UserManagement'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import BottomNav from './components/BottomNav'

function ProtectedLayout({ children, title }) {
    const { isAuthenticated } = useAuth()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title={title} />
                <div className="page-body">{children}</div>
            </div>
            <BottomNav />
        </div>
    )
}

function AdminRoute({ children, title }) {
    const { isAuthenticated, user } = useAuth()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Topbar title={title} />
                <div className="page-body">{children}</div>
            </div>
            <BottomNav />
        </div>
    )
}

function AppRoutes() {
    const { isAuthenticated } = useAuth()
    return (
        <Routes>
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } />
            <Route path="/" element={
                <ProtectedLayout title="Dashboard"><Dashboard /></ProtectedLayout>
            } />
            <Route path="/emissions" element={
                <ProtectedLayout title="Emission Records"><Emissions /></ProtectedLayout>
            } />
            <Route path="/predictions" element={
                <ProtectedLayout title="ML Predictions"><Predictions /></ProtectedLayout>
            } />
            <Route path="/users" element={
                <AdminRoute title="User Management"><UserManagement /></AdminRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    )
}
