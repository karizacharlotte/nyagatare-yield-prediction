import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

export default function AuthModal() {
  const { t } = useLang()
  const { authModal, closeAuthModal, login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authModal) {
      setMode(authModal)
      setPhone('')
      setPassword('')
      setError('')
    }
  }, [authModal])

  if (!authModal) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signup(phone, password)
      } else {
        await login(phone, password)
      }
      closeAuthModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        onClick={closeAuthModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-harvest-100 dark:border-zinc-800 w-full max-w-sm p-6 relative"
        >
          <button
            onClick={closeAuthModal}
            aria-label={t('auth_close')}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <X size={18} />
          </button>

          <h3 className="text-xl font-bold text-harvest-900 dark:text-zinc-100">
            {mode === 'signup' ? t('auth_signup_title') : t('auth_login_title')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {mode === 'signup' ? t('auth_signup_subtitle') : t('auth_login_subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-100 mb-1.5">
                {t('auth_phone')}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t('auth_phone_placeholder')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-harvest-400 focus:border-harvest-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-100 mb-1.5">
                {t('auth_password')}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-harvest-400 focus:border-harvest-400 transition-all"
              />
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">{t('auth_password_hint')}</p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-2.5 text-red-700 dark:text-red-300 text-sm"
                >
                  ⚠ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className={`w-full py-3 rounded-2xl font-bold text-sm text-white shadow transition-all ${
                loading
                  ? 'bg-harvest-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-harvest-600 to-harvest-500 hover:from-harvest-700 hover:to-harvest-600'
              }`}
            >
              {loading ? t('auth_loading') : (mode === 'signup' ? t('auth_submit_signup') : t('auth_submit_login'))}
            </motion.button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(m => (m === 'signup' ? 'login' : 'signup')); setError('') }}
            className="mt-4 w-full text-center text-sm text-harvest-600 dark:text-harvest-300 hover:underline"
          >
            {mode === 'signup' ? t('auth_switch_to_login') : t('auth_switch_to_signup')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
