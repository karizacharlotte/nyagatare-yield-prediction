import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, User, LogOut } from 'lucide-react'

export default function Header() {
  const { lang, setLang, t } = useLang()
  const { theme, toggleTheme } = useTheme()
  const { user, authReady, logout, openAuthModal } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-harvest-950/95 dark:bg-zinc-900/95 backdrop-blur border-b border-harvest-800/60 dark:border-zinc-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-3 group">
          {/* Leaf icon badge */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-harvest-600 shadow-lg shadow-harvest-900/50 group-hover:bg-harvest-500 transition-colors">
            <span className="text-lg leading-none">🌿</span>
          </div>
          {/* Brand name */}
          <span
            className="font-extrabold tracking-tight text-2xl"
            style={{
              background: 'linear-gradient(90deg, #ffffff 0%, #86efac 60%, #4ade80 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            Yield<span style={{ WebkitTextFillColor: '#4ade80' }}>Wise</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[['hero','nav_home'],['predict','nav_predict'],['about','nav_about']].map(([id,key]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-4 py-2 text-harvest-200 hover:text-white hover:bg-harvest-800/50 dark:hover:bg-zinc-800 rounded-lg text-sm font-medium transition-all"
            >
              {t(key)}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Account */}
          {authReady && (
            user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-medium text-harvest-200 dark:text-zinc-300 max-w-[100px] truncate" title={user.phone}>
                  {user.name || user.phone}
                </span>
                <button
                  onClick={logout}
                  aria-label={t('auth_logout')}
                  title={t('auth_logout')}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-harvest-900 dark:bg-zinc-800 border border-harvest-700 dark:border-zinc-700 text-harvest-300 hover:text-white hover:border-harvest-500 transition-colors"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-harvest-900 dark:bg-zinc-800 border border-harvest-700 dark:border-zinc-700 text-harvest-200 hover:text-white hover:border-harvest-500 transition-colors"
              >
                <User size={13} />
                {t('auth_account')}
              </button>
            )
          )}

          {/* Language toggle */}
          <div className="flex bg-harvest-900 dark:bg-zinc-800 rounded-full p-0.5 border border-harvest-700 dark:border-zinc-700">
            {['en','rw'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l
                    ? 'bg-harvest-500 text-white shadow'
                    : 'text-harvest-400 hover:text-harvest-200 dark:hover:text-zinc-200'
                }`}
              >
                {l === 'en' ? 'EN' : 'RW'}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-harvest-900 dark:bg-zinc-800 border border-harvest-700 dark:border-zinc-700 text-harvest-300 hover:text-white hover:border-harvest-500 transition-colors overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ y: -16, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 16, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-harvest-300 hover:text-white p-1"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-harvest-950 dark:bg-zinc-900 border-t border-harvest-800/60 dark:border-zinc-800 px-4 pb-3"
          >
            {[['hero','nav_home'],['predict','nav_predict'],['about','nav_about']].map(([id,key]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left px-3 py-2.5 text-harvest-200 hover:text-white hover:bg-harvest-800/50 dark:hover:bg-zinc-800 rounded-lg text-sm"
              >
                {t(key)}
              </button>
            ))}

            {/* Account (mobile) */}
            {authReady && (
              user ? (
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-harvest-200 hover:text-white hover:bg-harvest-800/50 dark:hover:bg-zinc-800 rounded-lg text-sm"
                >
                  <LogOut size={14} />
                  {t('auth_logout')} · {user.name || user.phone}
                </button>
              ) : (
                <button
                  onClick={() => { openAuthModal('login'); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-harvest-200 hover:text-white hover:bg-harvest-800/50 dark:hover:bg-zinc-800 rounded-lg text-sm"
                >
                  <User size={14} />
                  {t('auth_account')}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
