import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { lang, setLang, t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-harvest-950/95 backdrop-blur border-b border-harvest-800/60 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 group">
          <span className="text-2xl">🌿</span>
          <div className="text-left leading-tight">
            <div className="text-white font-bold text-sm tracking-wide">YieldAI</div>
            <div className="text-harvest-400 text-xs">Nyagatare</div>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[['hero','nav_home'],['predict','nav_predict'],['about','nav_about']].map(([id,key]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="px-4 py-2 text-harvest-200 hover:text-white hover:bg-harvest-800/50 rounded-lg text-sm font-medium transition-all"
            >
              {t(key)}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex bg-harvest-900 rounded-full p-0.5 border border-harvest-700">
            {['en','rw'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  lang === l
                    ? 'bg-harvest-500 text-white shadow'
                    : 'text-harvest-400 hover:text-harvest-200'
                }`}
              >
                {l === 'en' ? 'EN' : 'RW'}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-harvest-300 hover:text-white p-1"
            onClick={() => setMenuOpen(v => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
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
            className="md:hidden bg-harvest-950 border-t border-harvest-800/60 px-4 pb-3"
          >
            {[['hero','nav_home'],['predict','nav_predict'],['about','nav_about']].map(([id,key]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left px-3 py-2.5 text-harvest-200 hover:text-white hover:bg-harvest-800/50 rounded-lg text-sm"
              >
                {t(key)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
