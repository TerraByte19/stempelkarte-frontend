import { useLang } from '../LangContext'
import TagesangebotSection from '../components/TagesangebotSection'
import KampagnenSection from '../components/KampagnenSection'
import AutoNachrichtenSection from '../components/AutoNachrichtenSection'
import AutomationenSection from '../components/AutomationenSection'
import NewsletterSection from '../components/NewsletterSection'
import AbPro from '../components/AbPro'

/**
 * Alles, was auf den Handys der Kunden landet, auf einer Seite: das
 * Tagesangebot (heute), Kampagnen (einmalig), die festen Automaten und der
 * Baukasten (laufend), der Newsletter (E-Mail). Vorher verteilt auf
 * Dashboard und Profil.
 */
export default function Nachrichten() {
  const { t } = useLang()
  return (
      <div>
        <h1 style={s.title}>{t('nachr_title')}</h1>
        <p style={s.subtitle}>{t('nachr_subtitle')}</p>
        {/* Basic: jede Sektion als Karte "Ab Pro" (Backend sperrt ohnehin). */}
        <AbPro funktion="tagesangebot" titel={t('tag_title')}><TagesangebotSection /></AbPro>
        <AbPro funktion="kampagnen" titel={t('kamp_title')}><KampagnenSection /></AbPro>
        <AbPro funktion="auto_nachrichten" titel={t('auto_title')}><AutoNachrichtenSection /></AbPro>
        <AbPro funktion="automationen" titel={t('autom_title')}><AutomationenSection /></AbPro>
        <AbPro funktion="newsletter" titel={t('newsletter_title')}><NewsletterSection /></AbPro>
      </div>
  )
}

const s = {
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 24px' },
}
