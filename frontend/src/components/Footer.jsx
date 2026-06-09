import { useLang } from '../context/LangContext'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="bg-harvest-950 text-harvest-400 py-8 border-t border-harvest-800/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="text-harvest-300 font-semibold">Yield Wise</span>
        </div>
        <p className="text-harvest-500 text-xs text-center">{t('footer_copy')}</p>
        <div className="flex items-center gap-2 text-harvest-500 text-xs">
          <span className="w-2 h-2 rounded-full bg-harvest-500 inline-block" />
          Supervisor: Emmanuel Adjei
        </div>
      </div>
    </footer>
  )
}
