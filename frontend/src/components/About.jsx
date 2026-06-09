import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

const STEP_ICONS = ['📋', '🔬', '🤖', '🌐']
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4']

const METRICS = [
  { crop: 'Rice 🌾',  r2: '0.674', rmse: '0.85 t/ha', target: true  },
  { crop: 'Beans 🫘', r2: '0.494', rmse: '0.32 t/ha', target: false },
]

export default function About() {
  const { t } = useLang()

  return (
    <section id="about" className="py-16 sm:py-20 bg-white border-t border-harvest-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-harvest-900 tracking-tight">
            {t('about_title')}
          </h2>
          <p className="mt-3 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
            {t('about_body')}
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {STEP_KEYS.map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-harvest-50 rounded-2xl p-5 border border-harvest-100 hover:border-harvest-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-3">{STEP_ICONS[i]}</div>
              <h3 className="font-bold text-harvest-900 text-sm mb-1">{t(`${key}_title`)}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{t(`${key}_desc`)}</p>
            </motion.div>
          ))}
        </div>

        {/* Model performance */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <div className="col-span-full text-center mb-2">
            <h3 className="font-bold text-harvest-800 text-lg">{t('perf_title')}</h3>
            <p className="text-gray-400 text-xs">{t('perf_subtitle')}</p>
          </div>
          {METRICS.map(({ crop, r2, rmse, target }) => (
            <div
              key={crop}
              className={`rounded-2xl p-5 border ${
                target ? 'bg-harvest-50 border-harvest-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">{crop}</span>
                {target
                  ? <span className="bg-harvest-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_target')}</span>
                  : <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_ceiling')}</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">{t('perf_r2')}</p>
                  <p className={`text-2xl font-extrabold ${target ? 'text-harvest-600' : 'text-gray-500'}`}>{r2}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('perf_rmse')}</p>
                  <p className="text-2xl font-extrabold text-gray-700">{rmse}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">{t('stack_label')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Python','scikit-learn','pandas','Flask','React','Tailwind CSS','Render.com','Vite'].map(name => (
              <span key={name} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
