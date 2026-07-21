import { useLang } from '../context/LangContext'

const STEP_KEYS = ['step1', 'step2', 'step3', 'step4']

const METRICS = [
  { cropKey: 'metric_rice',  r2: '0.674', rmse: '0.85 t/ha', noteKey: 'perf_target' },
  { cropKey: 'metric_beans', r2: '0.494', rmse: '0.32 t/ha', noteKey: 'perf_ceiling' },
]

export default function About() {
  const { t } = useLang()

  return (
    <section id="about" className="py-16 sm:py-20 bg-white dark:bg-zinc-900 border-t border-harvest-100 dark:border-zinc-800 transition-colors">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        <h2 className="text-2xl sm:text-3xl font-extrabold text-harvest-900 dark:text-zinc-100 tracking-tight">
          {t('about_title')}
        </h2>
        <p className="mt-3 text-gray-600 dark:text-zinc-400 text-sm leading-relaxed">
          {t('about_body')}
        </p>

        {/* Pipeline steps */}
        <ol className="mt-10 space-y-5">
          {STEP_KEYS.map((key, i) => (
            <li key={key} className="flex gap-4">
              <span className="flex-none w-6 h-6 rounded-full bg-harvest-100 dark:bg-zinc-800 text-harvest-700 dark:text-harvest-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-harvest-900 dark:text-zinc-100 text-sm">{t(`${key}_title`)}</h3>
                <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed mt-0.5">{t(`${key}_desc`)}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Model performance */}
        <div className="mt-12">
          <h3 className="font-bold text-harvest-800 dark:text-zinc-100 text-base">{t('perf_title')}</h3>
          <p className="text-gray-500 dark:text-zinc-500 text-xs mt-0.5">{t('perf_subtitle')}</p>

          <table className="w-full mt-4 text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wide">
                <th className="font-semibold pb-2 border-b border-gray-200 dark:border-zinc-700">{t('perf_crop')}</th>
                <th className="font-semibold pb-2 border-b border-gray-200 dark:border-zinc-700">{t('perf_r2')}</th>
                <th className="font-semibold pb-2 border-b border-gray-200 dark:border-zinc-700">{t('perf_rmse')}</th>
                <th className="font-semibold pb-2 border-b border-gray-200 dark:border-zinc-700">{t('perf_note')}</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map(({ cropKey, r2, rmse, noteKey }) => (
                <tr key={cropKey} className="text-gray-700 dark:text-zinc-300">
                  <td className="py-2 border-b border-gray-100 dark:border-zinc-800 font-medium">{t(cropKey)}</td>
                  <td className="py-2 border-b border-gray-100 dark:border-zinc-800">{r2}</td>
                  <td className="py-2 border-b border-gray-100 dark:border-zinc-800">{rmse}</td>
                  <td className="py-2 border-b border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-zinc-500">{t(noteKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tech stack */}
        <p className="mt-10 text-xs text-gray-500 dark:text-zinc-500">
          <span className="font-semibold text-gray-600 dark:text-zinc-400">{t('stack_label')}: </span>
          Python, scikit-learn and pandas for the models; Flask for the API; React, Vite and Tailwind CSS for the frontend; deployed on Render.
        </p>

      </div>
    </section>
  )
}
