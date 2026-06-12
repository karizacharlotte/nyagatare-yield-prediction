import { createContext, useContext, useState, useEffect } from 'react'

const TOKEN_KEY = 'yieldwise_token'
const HISTORY_KEY = 'yieldwise_history'

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

// Migrate a guest's locally-saved history into a brand new account, so
// predictions made before signing up aren't lost from view. Runs before the
// token is committed to state, so the history fetch on the new session
// already sees the imported entries.
async function importLocalHistory(token) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const entries = raw ? JSON.parse(raw) : []
    if (!Array.isArray(entries) || entries.length === 0) return
    await fetch('/predictions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ entries }),
    })
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // best-effort only — local history simply stays as a guest fallback
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  })
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authModal, setAuthModal] = useState(null) // null | 'login' | 'signup'

  // Validate any saved token on load, and whenever it changes.
  useEffect(() => {
    if (!token) {
      setUser(null)
      setAuthReady(true)
      return
    }
    fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('invalid token')
        return res.json()
      })
      .then(data => setUser(data.user))
      .catch(() => {
        try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
        setToken(null)
        setUser(null)
      })
      .finally(() => setAuthReady(true))
  }, [token])

  const applyAuth = (data) => {
    try { localStorage.setItem(TOKEN_KEY, data.token) } catch { /* ignore */ }
    setToken(data.token)
    setUser(data.user)
  }

  const signup = async (phone, password) => {
    const data = await request('/auth/signup', { phone, password })
    await importLocalHistory(data.token)
    applyAuth(data)
  }
  const login = (phone, password) => request('/auth/login', { phone, password }).then(applyAuth)

  const logout = () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
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
