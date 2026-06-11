import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'
import fieldTrialsImg from '../assets/about/field-trials.svg'
import featureEngineeringImg from '../assets/about/feature-engineering.svg'
import mlModelsImg from '../assets/about/ml-models.svg'
import webAppImg from '../assets/about/web-app.svg'

const STEP_IMAGES = [fieldTrialsImg, featureEngineeringImg, mlModelsImg, webAppImg]
const STEP_KEYS = ['step1', 'step2', 'step3', 'step4']

const METRICS = [
  { cropKey: 'metric_rice',  r2: '0.674', rmse: '0.85 t/ha', target: true  },
  { cropKey: 'metric_beans', r2: '0.494', rmse: '0.32 t/ha', target: false },
]

export default function About() {
  const { t } = useLang()

  return (
    <section id="about" className="py-16 sm:py-20 bg-white dark:bg-zinc-900 border-t border-harvest-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-harvest-900 dark:text-zinc-100 tracking-tight">
            {t('about_title')}
          </h2>
          <p className="mt-3 text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
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
              className="bg-harvest-50 dark:bg-zinc-800/60 rounded-2xl overflow-hidden border border-harvest-100 dark:border-zinc-700 hover:border-harvest-300 dark:hover:border-harvest-600 hover:shadow-md transition-all"
            >
              <div
                className="h-24 bg-cover bg-center"
                style={{ backgroundImage: `url("${STEP_IMAGES[i]}")` }}
              />
              <div className="p-5">
                <h3 className="font-bold text-harvest-900 dark:text-zinc-100 text-sm mb-1">{t(`${key}_title`)}</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-xs leading-relaxed">{t(`${key}_desc`)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Model performance */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <div className="col-span-full text-center mb-2">
            <h3 className="font-bold text-harvest-800 dark:text-zinc-100 text-lg">{t('perf_title')}</h3>
            <p className="text-gray-400 dark:text-zinc-500 text-xs">{t('perf_subtitle')}</p>
          </div>
          {METRICS.map(({ cropKey, r2, rmse, target }) => (
            <div
              key={cropKey}
              className={`rounded-2xl p-5 border transition-colors ${
                target
                  ? 'bg-harvest-50 border-harvest-200 dark:bg-harvest-900/30 dark:border-harvest-700/60'
                  : 'bg-gray-50 border-gray-200 dark:bg-zinc-800/60 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800 dark:text-zinc-100">{t(cropKey)}</span>
                {target
                  ? <span className="bg-harvest-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_target')}</span>
                  : <span className="bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300 text-xs px-2 py-0.5 rounded-full font-semibold">{t('perf_ceiling')}</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{t('perf_r2')}</p>
                  <p className={`text-2xl font-extrabold ${target ? 'text-harvest-600 dark:text-harvest-400' : 'text-gray-500 dark:text-zinc-500'}`}>{r2}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{t('perf_rmse')}</p>
                  <p className="text-2xl font-extrabold text-gray-700 dark:text-zinc-100">{rmse}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-semibold mb-4">{t('stack_label')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Python','scikit-learn','pandas','Flask','React','Tailwind CSS','Render.com','Vite'].map(name => (
              <span key={name} className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 font-medium">
                {name}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
