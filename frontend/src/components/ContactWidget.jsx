import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, CalendarDays, MessageCircleQuestion, X } from 'lucide-react'
import { useLang } from '../context/LangContext'

const EMAIL = 'charlottekariza@gmail.com'
const WHATSAPP_NUMBER = '250798895020'
const PHONE_DISPLAY = '+250 798 895 020'

export default function ContactWidget() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  const options = [
    {
      key: 'email',
      href: `mailto:${EMAIL}?subject=${encodeURIComponent(t('contact_email_subject'))}`,
      icon: Mail,
      iconClass: 'bg-harvest-100 dark:bg-harvest-900 text-harvest-700 dark:text-harvest-300',
      title: t('contact_email'),
      sub: EMAIL,
    },
    {
      key: 'whatsapp',
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      external: true,
      icon: Phone,
      iconClass: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      title: t('contact_whatsapp'),
      sub: PHONE_DISPLAY,
    },
    {
      key: 'appointment',
      href: `mailto:${EMAIL}?subject=${encodeURIComponent(t('contact_appointment_subject'))}`,
      icon: CalendarDays,
      iconClass: 'bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-300',
      title: t('contact_appointment'),
      sub: t('contact_appointment_desc'),
    },
  ]

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed bottom-24 right-5 sm:right-6 z-50 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-harvest-100 dark:border-zinc-800 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-harvest-700 to-harvest-500 px-4 py-3">
              <p className="text-white font-bold text-sm">{t('contact_title')}</p>
              <p className="text-harvest-100 text-xs mt-0.5">{t('contact_subtitle')}</p>
            </div>
            <div className="p-3 space-y-1.5">
              {options.map(({ key, href, external, icon: Icon, iconClass, title, sub }) => (
                <a
                  key={key}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-harvest-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-800 dark:text-zinc-100">{title}</span>
                    <span className="block text-xs text-gray-400 dark:text-zinc-500">{sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('contact_title')}
        className="fixed bottom-5 right-5 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-harvest-600 to-harvest-500 text-white shadow-xl flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircleQuestion size={26} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
