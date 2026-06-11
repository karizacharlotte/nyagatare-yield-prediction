import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

const LEAVES = [
  { e: '🌿', x: 6,  y: 12, dur: 5.2 },
  { e: '🍃', x: 18, y: 65, dur: 4.7 },
  { e: '🌱', x: 30, y: 30, dur: 6.1 },
  { e: '🌾', x: 52, y: 72, dur: 5.5 },
  { e: '🫘', x: 68, y: 18, dur: 4.3 },
  { e: '🍃', x: 80, y: 58, dur: 6.4 },
  { e: '🌿', x: 90, y: 35, dur: 5.0 },
  { e: '🌱', x: 44, y: 10, dur: 4.8 },
]

const STATS = [
  { val: '216',  lblKey: 'hero_stat1_lbl', icon: '📊' },
  { val: '0.67', lblKey: 'hero_stat2_lbl', icon: '🎯' },
  { val: '2',    lblKey: 'hero_stat3_lbl', icon: '🌱' },
]

export default function Hero() {
  const { t } = useLang()
  const scrollToPredict = () =>
    document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" className="hero-bg relative overflow-hidden min-h-[92vh] flex flex-col justify-center">

      {/* Centre radial spotlight */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(74,222,128,0.13) 0%, transparent 70%)' }}
      />

      {/* Dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(134,239,172,0.5) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Floating leaves */}
      {LEAVES.map(({ e, x, y, dur }, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl select-none pointer-events-none opacity-20"
          style={{ left: `${x}%`, top: `${y}%` }}
          animate={{ y: [0, -16, 0], rotate: [0, 10, -10, 0], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: dur, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
        >
          {e}
        </motion.span>
      ))}

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center flex flex-col items-center">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-5xl sm:text-7xl font-extrabold leading-[1.08] tracking-tight mb-5"
        >
          <span className="text-white drop-shadow-lg">{t('hero_title')}</span>
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #86efac 0%, #4ade80 50%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {t('hero_green_smart')}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-harvest-200/90 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed font-light"
        >
          {t('hero_sub')}
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 180 }}
          whileHover={{ scale: 1.06, boxShadow: '0 0 32px rgba(74,222,128,0.45)' }}
          whileTap={{ scale: 0.96 }}
          onClick={scrollToPredict}
          className="relative bg-gradient-to-r from-harvest-500 to-harvest-400 text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-2xl shadow-harvest-900/60 transition-all overflow-hidden group"
        >
          <span className="relative z-10">{t('hero_cta')} →</span>
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
        </motion.button>

        {/* Thin divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="w-24 h-px bg-harvest-500/50 mx-auto mt-14 mb-10"
        />

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 w-full max-w-lg mx-auto"
        >
          {STATS.map(({ val, lblKey, icon }, i) => (
            <motion.div
              key={lblKey}
              whileHover={{ y: -4, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-xl cursor-default"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-3xl font-extrabold text-white tracking-tight">{val}</div>
              <div className="text-harvest-300 text-xs font-medium mt-1 leading-snug">{t(lblKey)}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-12 sm:h-20 fill-harvest-50 dark:fill-zinc-900">
          <path d="M0,50 C240,10 480,70 720,40 C960,10 1200,65 1440,30 L1440,80 L0,80 Z"/>
        </svg>
      </div>
    </section>
  )
}
