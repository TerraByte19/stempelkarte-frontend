import { useLang } from '../LangContext'
import FilialenSection from '../components/FilialenSection'
import TeamSection from '../components/TeamSection'
import StandorteSection from '../components/StandorteSection'
import ScannerSetupSection from '../components/ScannerSetupSection'
import AbPro from '../components/AbPro'

/**
 * Team & Standorte: Filialen-Uebersicht (Zahlen je Standort), die
 * Mitarbeiter-Zugaenge mit Rolle und Filiale, die Standorte selbst.
 * Vorher lagen Team und Orte im Profil. Die QR-Codes zum Einrichten eines
 * Scanner-Geraets stehen direkt unter den Zugaengen (vorher im Dashboard).
 */
export default function Team() {
  const { t } = useLang()
  return (
      <div style={s.page}>
        <h1 style={s.title}>{t('team_title')}</h1>
        <p style={s.subtitle}>{t('team_subtitle')}</p>
        {/* Basic hat einen Standort: keine Filialen-Uebersicht, keine weiteren Orte. */}
        <AbPro funktion="filialen" titel={t('fil_title')}><FilialenSection /></AbPro>
        <TeamSection />
        <ScannerSetupSection />
        <AbPro funktion="filialen" titel={t('orte_title')}><StandorteSection /></AbPro>
      </div>
  )
}

const s = {
  page: { maxWidth: 760, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 24px' },
}
