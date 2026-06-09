import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

const LEAVES = ['🌿','🍃','🌱','🌾','🫘','🌿','🍃','🌱']

export default function Hero() {
  const { t } = useLang()

  const scrollToPredict = () =>
    document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" className="hero-bg relative overflow-hidden">

      {/* Floating leaf decorations */}
      {LEAVES.map((leaf, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl select-none pointer-events-none opacity-15"
          style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 3) * 25}%` }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >
          {leaf}
        </motion.span>
      ))}

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">


        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4"
        >
          {t('hero_title')}
          <br />
          <span className="text-harvest-300">Green & Smart</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-harvest-200 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('hero_sub')}
        </motion.p>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={scrollToPredict}
          className="bg-harvest-500 hover:bg-harvest-400 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-harvest-900/60 transition-colors"
        >
          {t('hero_cta')} →
        </motion.button>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto"
        >
          {[
            { val: t('hero_stat1_val'), lbl: t('hero_stat1_lbl'), icon: '📊' },
            { val: t('hero_stat2_val'), lbl: t('hero_stat2_lbl'), icon: '🎯' },
            { val: t('hero_stat3_val'), lbl: t('hero_stat3_lbl'), icon: '🌱' },
          ].map(({ val, lbl, icon }) => (
            <div key={lbl} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-2xl font-extrabold text-white">{val}</div>
              <div className="text-harvest-300 text-xs mt-0.5 leading-snug">{lbl}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-10 sm:h-14 fill-harvest-50">
          <path d="M0,40 C360,0 1080,70 1440,20 L1440,60 L0,60 Z"/>
        </svg>
      </div>
    </section>
  )
}
