import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import beansImg from '../assets/crops/beans.jpg'
import riceImg from '../assets/crops/rice.jpg'

// Rwanda national averages (t/ha) for comparison
const NATIONAL_AVG = { bean: 1.2, rice: 5.0 }

function GaugeBar({ low, predicted, high, crop }) {
  const { t } = useLang()
  // display range: 0 to max(high * 1.2, nationalAvg * 1.5)
  const max = Math.max(high * 1.25, (NATIONAL_AVG[crop] ?? 5) * 1.6)
  const pctLow  = (low       / max) * 100
  const pctPred = (predicted / max) * 100
  const pctHigh = (high      / max) * 100
  const pctNat  = ((NATIONAL_AVG[crop] ?? 5) / max) * 100

  return (
    <div className="mt-5 space-y-1">
      {/* Track */}
      <div className="relative h-5 bg-gray-100 dark:bg-zinc-950 rounded-full overflow-hidden">
        {/* Range fill */}
        <motion.div
          className="absolute top-0 h-full bg-gradient-to-r from-harvest-200 via-harvest-400 to-harvest-600 rounded-full"
          style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        {/* Predicted marker */}
        <motion.div
          className="absolute top-0 h-full w-1 bg-harvest-800 rounded-full"
          style={{ left: `${pctPred}%`, transform: 'translateX(-50%)' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        />
        {/* National average marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-gold-500 opacity-70"
          style={{ left: `${pctNat}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-400 dark:text-zinc-500 px-0.5">
        <span>0</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gold-500 inline-block opacity-70" />
          <span>{t('gauge_national_avg')} {NATIONAL_AVG[crop]} t/ha</span>
        </div>
        <span>{max.toFixed(1)} t/ha</span>
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-xs font-medium mt-1">
        <span className="text-harvest-600 dark:text-harvest-400">↑ {low.toFixed(2)}</span>
        <span className="text-harvest-900 dark:text-zinc-100 font-bold">● {predicted.toFixed(2)}</span>
        <span className="text-harvest-600 dark:text-harvest-400">{high.toFixed(2)} ↑</span>
      </div>
    </div>
  )
}

function ConfidenceBadge({ r2 }) {
  const { t } = useLang()
  const level = r2 >= 0.65 ? 'high' : r2 >= 0.5 ? 'medium' : 'low'
  const styles = {
    high:   'bg-harvest-100 dark:bg-harvest-900 text-harvest-800 dark:text-harvest-200 border-harvest-300 dark:border-harvest-700',
    medium: 'bg-gold-100 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 border-gold-300 dark:border-gold-700/60',
    low:    'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
  }
  const labels = { high: t('confidence_high'), medium: t('confidence_medium'), low: t('confidence_low') }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === 'high' ? 'bg-harvest-600' : level === 'medium' ? 'bg-gold-600' : 'bg-red-500'}`}/>
      {labels[level]}
    </span>
  )
}

export default function YieldResult({ data, crop }) {
  const { t } = useLang()
  const { predicted_yield_t_ha: pred, low_estimate_t_ha: low,
          high_estimate_t_ha: high, model_r2: r2, model_rmse: rmse } = data

  const avg = NATIONAL_AVG[crop] ?? 5
  const vsNat = ((pred - avg) / avg * 100).toFixed(0)
  const isAbove = pred > avg

  const resultMsg = pred >= avg * 1.15 ? t('result_high')
                  : pred >= avg * 0.85 ? t('result_avg')
                  : t('result_low')

  const cropImg = crop === 'bean' ? beansImg : riceImg

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-harvest-100 dark:border-zinc-800 overflow-hidden transition-colors"
    >
      {/* Top banner */}
      <div className="bg-gradient-to-r from-harvest-700 to-harvest-500 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-harvest-100 text-xs font-semibold uppercase tracking-widest">{t('result_title')}</p>
          <p className="text-white text-sm capitalize">{crop === 'bean' ? t('result_subtitle_bean') : t('result_subtitle_rice')}</p>
        </div>
        <motion.img
          src={cropImg}
          alt=""
          className="w-16 h-12 rounded-xl object-cover ring-2 ring-white/70 shadow-md"
          initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: [0, -5, 0] }}
          transition={{
            default: { type: 'spring', stiffness: 200, delay: 0.3 },
            y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
        />
      </div>

      <div className="p-6 space-y-5">

        {/* Big number */}
        <div className="text-center">
          <motion.div
            key={pred}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-6xl font-extrabold text-harvest-700 dark:text-harvest-300 leading-none"
          >
            {pred.toFixed(2)}
          </motion.div>
          <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">{t('result_unit')} — {t('result_unit_long')}</p>
        </div>

        {/* vs National avg chip */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${
            isAbove ? 'bg-harvest-100 dark:bg-harvest-900 text-harvest-800 dark:text-harvest-200' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
          }`}>
            {isAbove ? '▲' : '▼'} {Math.abs(vsNat)}% {isAbove ? t('result_above') : t('result_below')} {t('result_vs_national')}
          </span>
        </div>

        {/* Gauge */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-2">{t('result_range')}</p>
          <GaugeBar low={low} predicted={pred} high={high} crop={crop} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: t('result_r2'),  value: r2,          suffix: '' },
            { label: t('result_rmse'), value: `±${rmse}`,  suffix: ' t/ha' },
            { label: t('result_confidence'), component: <ConfidenceBadge r2={r2} /> },
          ].map(({ label, value, suffix, component }) => (
            <div key={label} className="bg-harvest-50 dark:bg-zinc-800/60 rounded-2xl p-3 text-center border border-harvest-100 dark:border-zinc-700">
              <p className="text-gray-500 dark:text-zinc-500 text-xs mb-1">{label}</p>
              {component || (
                <p className="text-harvest-800 dark:text-zinc-100 font-bold text-sm">{value}{suffix}</p>
              )}
            </div>
          ))}
        </div>

        {/* Result message */}
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium text-center ${
          pred >= avg * 1.15 ? 'bg-harvest-100 dark:bg-harvest-900 text-harvest-800 dark:text-harvest-200 border border-harvest-200 dark:border-harvest-700'
        : pred >= avg * 0.85 ? 'bg-gold-50 dark:bg-gold-900/30 text-gold-800 dark:text-gold-300 border border-gold-200 dark:border-gold-700/60'
        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/60'
        }`}>
          {resultMsg}
        </div>

        <p className="text-center text-gray-400 dark:text-zinc-500 text-xs">{t('result_note')}</p>
      </div>
    </motion.div>
  )
}
