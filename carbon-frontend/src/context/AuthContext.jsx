import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('token'))

    useEffect(() => {
        const stored = localStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
    }, [])

    const login = (data) => {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }))
        setToken(data.token)
        setUser({ username: data.username, role: data.role })
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
