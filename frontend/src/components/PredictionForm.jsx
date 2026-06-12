import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useLang } from '../context/LangContext'
import NPKToggle from './NPKToggle'
import YieldResult from './YieldResult'
import beansImg from '../assets/crops/beans.jpg'
import riceImg from '../assets/crops/rice.jpg'

const LAST_RESULT_KEY = 'yieldwise_last_result'

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

  // Restore the last saved prediction (if any) so it's available offline
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_RESULT_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setResult(saved.data)
        setResultCrop(saved.crop)
        setIsCached(true)
        setCachedAt(saved.savedAt)
      }
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [])

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
    setSector(c === 'bean' ? 'Katabagemu' : 'Nyagatare')
    setPrevCrop(c === 'bean' ? 'Maize' : 'Rice')
    setDays(DEFAULT_GROWING[c])
    setRain(DEFAULT_RAIN[c])
    setTemp(DEFAULT_TEMP[c])
    setMonth(c === 'bean' ? 9 : 7)
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
      const res  = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Prediction failed')
      setResult(data)
      setResultCrop(crop)
      setIsCached(false)
      setCachedAt(null)
      try {
        localStorage.setItem(LAST_RESULT_KEY, JSON.stringify({ data, crop, savedAt: Date.now() }))
      } catch {
        // storage unavailable — last-result caching just won't persist
      }
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
