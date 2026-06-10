import { motion } from 'framer-motion'
import { ClipboardList, FlaskConical, Cpu, Globe } from 'lucide-react'
import { useLang } from '../context/LangContext'

const STEP_ICONS = [ClipboardList, FlaskConical, Cpu, Globe]
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4']

const METRICS = [
  { cropKey: 'metric_rice',  r2: '0.674', rmse: '0.85 t/ha', target: true  },
  { cropKey: 'metric_beans', r2: '0.494', rmse: '0.32 t/ha', target: false },
]

export default function About() {
  const { t } = useLang()

  return (
    <section id="about" className="py-16 sm:py-20 bg-white dark:bg-harvest-950 border-t border-harvest-100 dark:border-harvest-800/60 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-harvest-900 dark:text-harvest-50 tracking-tight">
            {t('about_title')}
          </h2>
          <p className="mt-3 text-gray-500 dark:text-harvest-300/80 max-w-2xl mx-auto text-sm leading-relaxed">
            {t('about_body')}
          </p>
        </div>

        {/* Pipeline steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {STEP_KEYS.map((key, i) => {
            const Icon = STEP_ICONS[i]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-harvest-50 dark:bg-harvest-900/60 rounded-2xl p-5 border border-harvest-100 dark:border-harvest-800 hover:border-harvest-300 dark:hover:border-harvest-600 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-harvest-100 dark:bg-harvest-800 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-harvest-600 dark:text-harvest-300" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-harvest-900 dark:text-harvest-50 text-sm mb-1">{t(`${key}_title`)}</h3>
                <p className="text-gray-500 dark:text-harvest-300/70 text-xs leading-relaxed">{t(`${key}_desc`)}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Model performance */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <div className="col-span-full text-center mb-2">
            <h3 className="font-bold text-harvest-800 dark:text-harvest-100 text-lg">{t('perf_title')}</h3>
            <p className="text-gray-400 dark:text-harvest-400/70 text-xs">{t('perf_subtitle')}</p>
          </div>
          {METRICS.map(({ cropKey, r2, rmse, target }) => (
            <div
              key={cropKey}
              className={`rounded-2xl p-5 border transition-colors ${
                target
                  ? 'bg-harvest-50 border-harvest-200 dark:bg-harvest-900/60 dark:border-harvest-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-harvest-900/30 dark:border-harvest-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800 dark:text-harvest-50">{t(cropKey)}</span>
                {target
                  ? <span className="bg-harvest-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_target')}</span>
                  : <span className="bg-gray-200 text-gray-600 dark:bg-harvest-800 dark:text-harvest-300 text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_ceiling')}</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-harvest-400/70">{t('perf_r2')}</p>
                  <p className={`text-2xl font-extrabold ${target ? 'text-harvest-600 dark:text-harvest-400' : 'text-gray-500 dark:text-harvest-300/70'}`}>{r2}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-harvest-400/70">{t('perf_rmse')}</p>
                  <p className="text-2xl font-extrabold text-gray-700 dark:text-harvest-100">{rmse}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 dark:text-harvest-400/70 uppercase tracking-widest font-semibold mb-4">{t('stack_label')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Python','scikit-learn','pandas','Flask','React','Tailwind CSS','Render.com','Vite'].map(name => (
              <span key={name} className="bg-gray-100 dark:bg-harvest-900 text-gray-700 dark:text-harvest-200 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-harvest-700 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
