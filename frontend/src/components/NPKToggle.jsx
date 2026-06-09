import { motion } from 'framer-motion'
import { useLang } from '../context/LangContext'

const NUTRIENTS = [
  { key: 'N', label: 'N', tKey: 'nutrient_n', color: 'bg-blue-500',   ring: 'ring-blue-400'   },
  { key: 'P', label: 'P', tKey: 'nutrient_p', color: 'bg-orange-500', ring: 'ring-orange-400' },
  { key: 'K', label: 'K', tKey: 'nutrient_k', color: 'bg-purple-500', ring: 'ring-purple-400' },
]

export default function NPKToggle({ values, onChange }) {
  const { t } = useLang()
  return (
    <div className="grid grid-cols-3 gap-3">
      {NUTRIENTS.map(({ key, label, tKey, color, ring }) => {
        const active = values[key]
        return (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onChange(key, !active)}
            className={`relative rounded-xl border-2 p-3 text-center transition-all duration-200 ${
              active
                ? `border-harvest-500 bg-harvest-50 ${ring} ring-1`
                : 'border-gray-200 bg-white hover:border-harvest-300'
            }`}
          >
            {active && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-harvest-500 flex items-center justify-center"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6.5-7z"/>
                </svg>
              </motion.span>
            )}
            <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-white font-bold text-sm mb-1 ${color}`}>
              {label}
            </span>
            <div className="text-xs font-semibold text-gray-700">{t(tKey)}</div>
          </motion.button>
        )
      })}
    </div>
  )
}
