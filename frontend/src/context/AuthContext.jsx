import { createContext, useContext, useState, useEffect } from 'react'

const TOKEN_KEY = 'yieldwise_token'
const USER_KEY  = 'yieldwise_user'

const AuthContext = createContext()

async function request(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  })
  // Seed from a cached copy so the header still shows the farmer's phone
  // number (and saved history stays reachable) when offline.
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [authReady, setAuthReady] = useState(false)
  const [authModal, setAuthModal] = useState(null) // null | 'login' | 'signup'

  // Validate any saved token on load, and whenever it changes.
  useEffect(() => {
    if (!token) {
      setUser(null)
      try { localStorage.removeItem(USER_KEY) } catch { /* ignore */ }
      setAuthReady(true)
      return
    }
    fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.ok) {
          return res.json().then(data => {
            setUser(data.user)
            try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)) } catch { /* ignore */ }
          })
        }
        if (res.status === 401) {
          try {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          } catch { /* ignore */ }
          setToken(null)
          setUser(null)
        }
      })
      .catch(() => {
        // Offline — keep the cached token/user so saved history stays visible.
      })
      .finally(() => setAuthReady(true))
  }, [token])

  const applyAuth = (data) => {
    try {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    } catch { /* ignore */ }
    setToken(data.token)
    setUser(data.user)
  }

  const signup = (phone, password) => request('/auth/signup', { phone, password }).then(applyAuth)
  const login  = (phone, password) => request('/auth/login', { phone, password }).then(applyAuth)

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    } catch { /* ignore */ }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      token, user, authReady,
      signup, login, logout,
      authModal, openAuthModal: setAuthModal, closeAuthModal: () => setAuthModal(null),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
