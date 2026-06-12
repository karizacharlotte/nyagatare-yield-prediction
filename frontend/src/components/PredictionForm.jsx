import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Clock, Trash2, LogIn } from 'lucide-react'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import NPKToggle from './NPKToggle'
import YieldResult from './YieldResult'
import beansImg from '../assets/crops/beans.jpg'
import riceImg from '../assets/crops/rice.jpg'

const HISTORY_KEY = 'yieldwise_history'
const MAX_HISTORY = 10

const BEAN_SECTORS   = ['Katabagemu','Rukomo']
const RICE_SECTORS   = ['Nyagatare','Rukomo','Rwempasha','Tabagwe']
const PREV_CROPS_BEAN = ['Maize','Sorghum','Sweet potato']
const PREV_CROPS_RICE = ['Rice']

const DEFAULT_GROWING = { bean: 97, rice: 145 }
const DEFAULT_RAIN    = { bean: 365, rice: 380 }
const DEFAULT_TEMP    = { bean: 28.1, rice: 28.1 }

function FormLabel({ main, sub }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-100 mb-1.5">
      {main}
      {sub && <span className="ml-1.5 text-gray-400 dark:text-zinc-500 font-normal italic text-xs">{sub}</span>}
    </label>
  )
}

function FormInput({ id, type = 'number', value, onChange, min, max, step = 1, className = '' }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min}
      max={max}
      step={step}
      className={`w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harvest-400 focus:border-harvest-400 transition-all bg-white dark:bg-zinc-800 dark:text-zinc-100 ${className}`}
    />
  )
}

function HistoryItem({ entry, onClick }) {
  const { t } = useLang()
  const { data, crop, savedAt } = entry
  const cropImg = crop === 'bean' ? beansImg : riceImg
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-harvest-50 dark:hover:bg-zinc-800 transition-colors"
    >
      <img src={cropImg} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-harvest-100 dark:ring-zinc-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-harvest-900 dark:text-zinc-100">
          {crop === 'bean' ? t('form_crop_bean') : t('form_crop_rice')} — {data.predicted_yield_t_ha.toFixed(2)} {t('result_unit')}
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">{new Date(savedAt).toLocaleString()}</p>
      </div>
    </button>
  )
}

function FormSelect({ id, value, onChange, children }) {
  return (
    <select
      id={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-harvest-400 focus:border-harvest-400 transition-all appearance-none cursor-pointer"
    >
      {children}
    </select>
  )
}

export default function PredictionForm() {
  const { t, lang } = useLang()
  const { token, openAuthModal } = useAuth()

  const [crop, setCrop]       = useState('bean')
  const [npk, setNpk]         = useState({ N: true, P: true, K: true })
  const [sector, setSector]   = useState('Katabagemu')
  const [prevCrop, setPrevCrop] = useState('Maize')
  const [month, setMonth]     = useState(9)
  const [days, setDays]       = useState(97)
  const [rain, setRain]       = useState(365)
  const [temp, setTemp]       = useState(28.1)

  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [resultCrop, setResultCrop] = useState('bean')
  const [error, setError]     = useState('')
  const [isCached, setIsCached] = useState(false)
  const [cachedAt, setCachedAt] = useState(null)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load prediction history: from the farmer's account when signed in
  // (synced across devices), otherwise from this browser's local storage
  // (guest/offline mode — never sent to a server, so others never see it).
  useEffect(() => {
    setHistory([])
    setResult(null)
    setIsCached(false)
    setCachedAt(null)

    if (token) {
      fetch('/predictions', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => (res.ok ? res.json() : { history: [] }))
        .then(({ history: saved }) => {
          const entries = (saved || []).map(p => ({ data: p.data, crop: p.crop, savedAt: p.saved_at }))
          if (entries.length > 0) {
            setHistory(entries)
            setResult(entries[0].data)
            setResultCrop(entries[0].crop)
            setIsCached(true)
            setCachedAt(entries[0].savedAt)
          }
        })
        .catch(() => {
          // offline or request failed — leave the placeholder shown
        })
      return
    }

    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (Array.isArray(saved) && saved.length > 0) {
          setHistory(saved)
          setResult(saved[0].data)
          setResultCrop(saved[0].crop)
          setIsCached(true)
          setCachedAt(saved[0].savedAt)
        }
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [token])

  // Track connectivity so we can surface an offline indicator
  useEffect(() => {
    const goOnline  = () => setIsOffline(false)
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const handleCropChange = (c) => {
    setCrop(c)
    setResult(null)
    setIsCached(false)
    setShowHistory(false)
    setSector(c === 'bean' ? 'Katabagemu' : 'Nyagatare')
    setPrevCrop(c === 'bean' ? 'Maize' : 'Rice')
    setDays(DEFAULT_GROWING[c])
    setRain(DEFAULT_RAIN[c])
    setTemp(DEFAULT_TEMP[c])
    setMonth(c === 'bean' ? 9 : 7)
  }

  const loadFromHistory = (entry) => {
    setResult(entry.data)
    setResultCrop(entry.crop)
    setIsCached(true)
    setCachedAt(entry.savedAt)
    setShowHistory(false)
    setTimeout(() => document.getElementById('result-card')?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100)
  }

  const handleClearHistory = () => {
    if (token) {
      fetch('/predictions', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    } else {
      try {
        localStorage.removeItem(HISTORY_KEY)
      } catch {
        // ignore
      }
    }
    setHistory([])
    setResult(null)
    setIsCached(false)
    setCachedAt(null)
    setShowHistory(false)
  }

  const handleNpk = (key, val) => setNpk(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      crop,
      has_N: npk.N ? 1 : 0,
      has_P: npk.P ? 1 : 0,
      has_K: npk.K ? 1 : 0,
      N_boost: 0, P_boost: 0, K_boost: 0,
      sector,
      prev_crop: prevCrop,
      planting_month: parseInt(month),
      growing_days: parseInt(days),
      total_rainfall_mm: parseFloat(rain),
      mean_temp_C: parseFloat(temp),
    }

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res  = await fetch('/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prediction failed')
      setResult(data)
      setResultCrop(crop)
      setIsCached(false)
      setCachedAt(null)
      // Signed-in farmers' predictions are already saved server-side by /predict.
      const entry = { data, crop, savedAt: token ? new Date().toISOString() : Date.now() }
      setHistory(prev => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY)
        if (!token) {
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
          } catch {
            // storage unavailable — history just won't persist
          }
        }
        return next
      })
      // Scroll result into view on mobile
      setTimeout(() => document.getElementById('result-card')?.scrollIntoView({ behavior:'smooth', block:'nearest' }), 100)
    } catch (err) {
      if (!navigator.onLine) {
        setError(t('offline_error'))
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const months = t('months')
  const sectors = crop === 'bean' ? BEAN_SECTORS : RICE_SECTORS
  const prevCrops = crop === 'bean' ? PREV_CROPS_BEAN : PREV_CROPS_RICE
  const prevCropLabel = (val) => ({
    'Maize': t('crop_maize'), 'Sorghum': t('crop_sorghum'),
    'Sweet potato': t('crop_sweet_potato'), 'Rice': t('crop_rice_prev'),
  }[val] ?? val)

  return (
    <section id="predict" className="py-16 sm:py-20 bg-harvest-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-harvest-900 dark:text-zinc-100 tracking-tight">
            {t('form_title')}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-zinc-400 text-sm">{t('form_subtitle')}</p>
          <AnimatePresence>
            {isOffline && (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-700/60"
              >
                <WifiOff size={12} />
                {t('offline_badge')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* ── FORM CARD ── */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-harvest-100 dark:border-zinc-800 overflow-hidden transition-colors">

            {/* Crop selector tabs */}
            <div className="flex bg-harvest-50 dark:bg-zinc-950/40 border-b border-harvest-100 dark:border-zinc-800">
              {['bean','rice'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCropChange(c)}
                  className={`flex-1 py-4 flex flex-col items-center gap-1 text-sm font-semibold transition-all ${
                    crop === c
                      ? 'bg-white dark:bg-zinc-800 text-harvest-700 dark:text-harvest-300 border-b-2 border-harvest-500 shadow-sm'
                      : 'text-gray-400 dark:text-zinc-500 hover:text-harvest-600 dark:hover:text-harvest-300'
                  }`}
                >
                  <motion.img
                    src={c === 'bean' ? beansImg : riceImg}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow mb-1"
                    animate={{ y: [0, -4, 0], rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: c === 'bean' ? 0 : 0.4 }}
                  />
                  {c === 'bean' ? t('form_crop_bean') : t('form_crop_rice')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              {/* NPK */}
              <div>
                <FormLabel main={t('form_fertiliser')} />
                <NPKToggle values={npk} onChange={handleNpk} />
              </div>

              {/* Sector + Prev crop */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel main={t('form_sector')} />
                  <FormSelect id="sector" value={sector} onChange={setSector}>
                    {sectors.map(s => <option key={s}>{s}</option>)}
                  </FormSelect>
                </div>
                {crop === 'bean' && (
                  <div>
                    <FormLabel main={t('form_prev_crop')} />
                    <FormSelect id="prev_crop" value={prevCrop} onChange={setPrevCrop}>
                      {prevCrops.map(p => <option key={p} value={p}>{prevCropLabel(p)}</option>)}
                    </FormSelect>
                  </div>
                )}
                {crop === 'rice' && (
                  <div>
                    <FormLabel main={t('form_prev_crop')} />
                    <FormSelect id="prev_crop" value={prevCrop} onChange={setPrevCrop}>
                      {prevCrops.map(p => <option key={p} value={p}>{prevCropLabel(p)}</option>)}
                    </FormSelect>
                  </div>
                )}
              </div>

              {/* Planting month */}
              <div>
                <FormLabel main={t('form_month')} />
                <FormSelect id="month" value={month} onChange={setMonth}>
                  {months.map((m, i) => (
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </FormSelect>
              </div>

              {/* Growing days + Rainfall */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel main={t('form_days')} />
                  <FormInput id="days" value={days} onChange={setDays} min={60} max={200} />
                </div>
                <div>
                  <FormLabel main={t('form_rain')} />
                  <FormInput id="rain" value={rain} onChange={setRain} min={50} max={900} step={0.1} />
                </div>
              </div>

              {/* Temperature */}
              <div>
                <FormLabel main={t('form_temp')} />
                <div className="relative">
                  <FormInput id="temp" value={temp} onChange={setTemp} min={18} max={40} step={0.1} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 text-sm">°C</span>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl px-4 py-3 text-red-700 dark:text-red-300 text-sm"
                  >
                    ⚠ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-2xl font-bold text-base text-white shadow-lg transition-all ${
                  loading
                    ? 'bg-harvest-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-harvest-600 to-harvest-500 hover:from-harvest-700 hover:to-harvest-600 shadow-harvest-200'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {t('form_loading')}
                  </span>
                ) : (
                  `🌾 ${t('form_submit')}`
                )}
              </motion.button>
            </form>
          </div>

          {/* ── RESULT PANEL ── */}
          <div id="result-card">

            {/* History toggle */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => setShowHistory(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-800 text-harvest-700 dark:text-harvest-300 border border-harvest-200 dark:border-zinc-700 hover:bg-harvest-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
              >
                <Clock size={13} />
                {t('history_button')}{history.length > 0 ? ` (${history.length})` : ''}
              </button>
            </div>

            {/* History panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-harvest-100 dark:border-zinc-800 shadow-lg overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-1">
                    <h3 className="text-sm font-bold text-harvest-900 dark:text-zinc-100">{t('history_title')}</h3>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {token ? t('history_signed_in_note') : t('history_private_note')}
                    </p>
                    {!token && (
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-harvest-600 dark:text-harvest-300 hover:underline"
                      >
                        <LogIn size={12} />
                        {t('history_login_cta')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto px-2 py-1">
                    {history.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-gray-400 dark:text-zinc-500">{t('history_empty')}</p>
                    ) : (
                      history.map(entry => (
                        <HistoryItem key={entry.savedAt} entry={entry} onClick={() => loadFromHistory(entry)} />
                      ))
                    )}
                  </div>
                  {history.length > 0 && (
                    <div className="px-2 pb-2">
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={13} />
                        {t('history_clear')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {isCached && (
                    <div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400">
                      <WifiOff size={12} />
                      <span>{t('last_saved_title')}</span>
                      {cachedAt && <span>· {t('last_saved_on', { date: new Date(cachedAt).toLocaleString() })}</span>}
                    </div>
                  )}
                  <YieldResult data={result} crop={resultCrop} />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-harvest-100 dark:border-zinc-800 shadow-lg p-12 text-center transition-colors"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🌱
                  </motion.div>
                  <h3 className="text-harvest-800 dark:text-zinc-100 font-bold text-lg mb-2">{t('ready_title')}</h3>
                  <p className="text-gray-400 dark:text-zinc-400 text-sm">
                    {t('ready_body')}<br/>
                    <span className="text-harvest-600 dark:text-harvest-300 font-semibold">{t('ready_cta_link')}</span> {t('ready_body2')}
                  </p>

                  {/* Feature chips */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['chip_npk','chip_climate','chip_soil','chip_location'].map(key => (
                      <span key={key} className="bg-harvest-50 dark:bg-zinc-800 text-harvest-700 dark:text-harvest-300 text-xs px-3 py-1.5 rounded-full border border-harvest-200 dark:border-zinc-700">
                        ✓ {t(key)}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
