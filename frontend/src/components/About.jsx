import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

const STEPS = [
  { icon: '📋', title: 'RAB Field Trials', desc: '216 crop trial records from Nyagatare District — beans and rice across two growing seasons with varying NPK fertiliser treatments.' },
  { icon: '🔬', title: 'Feature Engineering', desc: 'Climate data from Meteo Rwanda matched to each growing season. NPK treatments encoded as nutrient presence + application level.' },
  { icon: '🤖', title: 'ML Models', desc: 'Random Forest & Gradient Boosting trained with 5-fold cross-validation. Grid search tuning for optimal hyperparameters.' },
  { icon: '🌐', title: 'Web Application', desc: 'Flask REST API serving predictions. React frontend with bilingual (English/Kinyarwanda) interface optimised for low-connectivity use.' },
]

const METRICS = [
  { crop: 'Rice 🌾', r2: '0.674', rmse: '0.85 t/ha', target: true  },
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
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-harvest-50 rounded-2xl p-5 border border-harvest-100 hover:border-harvest-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-harvest-900 text-sm mb-1">{step.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Model performance */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          <div className="col-span-full text-center mb-2">
            <h3 className="font-bold text-harvest-800 text-lg">Model Performance</h3>
            <p className="text-gray-400 text-xs">5-fold cross-validation results</p>
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
                  ? <span className="bg-harvest-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">✓ Target met</span>
                  : <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">Data ceiling</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">R² score</p>
                  <p className={`text-2xl font-extrabold ${target ? 'text-harvest-600' : 'text-gray-500'}`}>{r2}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">RMSE</p>
                  <p className="text-2xl font-extrabold text-gray-700">{rmse}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Python','scikit-learn','pandas','Flask','React','Tailwind CSS','Render.com','Vite'].map(t => (
              <span key={t} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full border border-gray-200 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
