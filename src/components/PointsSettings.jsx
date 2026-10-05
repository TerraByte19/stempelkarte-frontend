import { useState } from 'react'
import { punkteFuer, formatierePunkte, kursAusPaar, paarAusKurs } from '../lib/pointsOf'

/**
 * Kurs und Rundung einer Punktekarte.
 *
 * Nach aussen gibt es nur EINE Zahl: pointsPerEuroX100 (Punkte pro Euro,
 * mal 100). Im Formular steht sie als Satz mit zwei Zahlen: "Fuer je 5 €
 * gibt es 1 Punkt".
 *
 * Vorher waren das eine Zahl und ein Auswahlfeld ("Punkte pro Euro" /
 * "Euro pro Punkt"). Wer so etwas zum ersten Mal einrichtet, muss dabei im
 * Kopf umdrehen, und ein falsch verstandenes Auswahlfeld faellt erst auf,
 * wenn Kunden schon zu viele Punkte haben. Zwei Zahlen in einem Satz
 * brauchen kein Umdrehen und tragen beide Richtungen.
 */
export default function PointsSettings({ value, onChange, t }) {
  const { pointsPerEuroX100, pointsRounding } = value

  // Die Eingabe ist Text, nicht Zahl: sonst loescht sich das Feld selbst,
  // sobald jemand "2," tippt und die Zwischenstufe keine gueltige Zahl ist.
  const start = paarAusKurs(pointsPerEuroX100)
  const [euroText, setEuroText] = useState(String(start.euro).replace('.', ','))
  const [punkteText, setPunkteText] = useState(String(start.punkte).replace('.', ','))

  function zahl(text) {
    return parseFloat(String(text).replace(',', '.'))
  }

  function uebernimm(neuEuro, neuPunkte) {
    const kurs = kursAusPaar(zahl(neuEuro), zahl(neuPunkte))
    if (kurs !== null) onChange({ ...value, pointsPerEuroX100: kurs })
  }

  function setzeEuro(text) {
    setEuroText(text)
    uebernimm(text, punkteText)
  }

  function setzePunkte(text) {
    setPunkteText(text)
    uebernimm(euroText, text)
  }

  // Beispielrechnung mit 10 Euro - dieselbe Rechnung, die spaeter im
  // Scanner steht.
  const beispiel = formatierePunkte(punkteFuer(1000, pointsPerEuroX100, pointsRounding))

  // Die Rundungsarten mit echten Zahlen beschriften. "Kaufmaennisch" sagt
  // niemandem etwas; "5,20 € ergeben 5 Punkte" schon.
  function rundungsBeispiel(art) {
    return formatierePunkte(punkteFuer(520, pointsPerEuroX100, art))
  }

  return (
    <div style={s.block}>
      <label style={s.label}>{t('cards_rate')}</label>
      <div style={s.satz}>
        <span style={s.wort}>{t('cards_rate_for')}</span>
        <input style={s.zahl} type="text" inputMode="decimal"
               value={euroText} onChange={e => setzeEuro(e.target.value)}
               aria-label={t('cards_rate_euro_label')}/>
        <span style={s.wort}>{t('cards_rate_gives')}</span>
        <input style={s.zahl} type="text" inputMode="decimal"
               value={punkteText} onChange={e => setzePunkte(e.target.value)}
               aria-label={t('cards_rate_points_label')}/>
        <span style={s.wort}>{t(zahl(punkteText) === 1 ? 'cards_rate_point_word' : 'cards_rate_points_word')}</span>
      </div>
      <div style={s.beispiel}>{t('cards_rate_example', { euro: '10', punkte: beispiel })}</div>

      <label style={s.label}>{t('cards_rounding')}</label>
      <div style={s.beispielOben}>{t('cards_rounding_hint')}</div>
      <select
        style={s.select}
        value={pointsRounding}
        onChange={e => onChange({ ...value, pointsRounding: e.target.value })}
      >
        <option value="GENAU">
          {t('cards_rounding_genau')} — {rundungsBeispiel('GENAU')}
        </option>
        <option value="ABRUNDEN">
          {t('cards_rounding_abrunden')} — {rundungsBeispiel('ABRUNDEN')}
        </option>
        <option value="KAUFMAENNISCH">
          {t('cards_rounding_kaufmaennisch')} — {rundungsBeispiel('KAUFMAENNISCH')}
        </option>
      </select>
    </div>
  )
}

const s = {
  block: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px', textAlign: 'start' },
  satz: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' },
  wort: { fontSize: '15px', color: '#333' },
  zahl: { width: '72px', padding: '12px 10px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', textAlign: 'center' },
  select: { width: '100%', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', background: 'white', boxSizing: 'border-box' },
  beispiel: { fontSize: '13px', color: '#888', marginBottom: '16px', textAlign: 'start' },
  beispielOben: { fontSize: '13px', color: '#888', marginBottom: '6px', textAlign: 'start' },
}
