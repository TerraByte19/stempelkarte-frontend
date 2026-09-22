import { punkteFuer, formatierePunkte } from '../lib/pointsOf'

/**
 * Kurs und Rundung einer Punktekarte.
 *
 * Nach aussen gibt es nur EINE Zahl: pointsPerEuroX100 (Punkte pro Euro,
 * mal 100). Hier drin darf der Laden waehlen, wie er es ausspricht -
 * "5 Punkte pro Euro" und "1 Punkt pro 5 Euro" meinen dasselbe Feld, nur
 * einmal als Kehrwert. Das erspart der Datenbank ein zweites Feld und
 * jedem Rechenweg eine Fallunterscheidung.
 */
export default function PointsSettings({ value, onChange, t }) {
  const { pointsPerEuroX100, pointsRounding } = value

  // Welche Sprechweise steht gerade im Feld? Ab einem Punkt pro Euro
  // aufwaerts liest sich "X Punkte pro Euro" natuerlicher, darunter der
  // Kehrwert.
  const proEuro = pointsPerEuroX100 >= 100
  const angezeigt = proEuro
    ? runde2(pointsPerEuroX100 / 100)
    : runde2(10000 / pointsPerEuroX100)

  function runde2(n) {
    return Math.round(n * 100) / 100
  }

  function setzeRichtung(neuProEuro) {
    if (neuProEuro === proEuro) return
    // Beim Umschalten den Kehrwert bilden, damit die Zahl im Feld stehen
    // bleibt und nicht ploetzlich etwas anderes bedeutet.
    onChange({
      ...value,
      pointsPerEuroX100: neuProEuro
        ? Math.max(1, Math.round(angezeigt * 100))
        : Math.max(1, Math.round(10000 / angezeigt)),
    })
  }

  function setzeZahl(text) {
    const zahl = parseFloat(String(text).replace(',', '.'))
    if (!Number.isFinite(zahl) || zahl <= 0) return
    onChange({
      ...value,
      pointsPerEuroX100: proEuro
        ? Math.max(1, Math.round(zahl * 100))
        : Math.max(1, Math.round(10000 / zahl)),
    })
  }

  // Beispielrechnung mit 10 Euro, damit der Laden sofort sieht, was er
  // eingestellt hat. Genau dieselbe Rechnung, die spaeter im Scanner steht.
  const beispiel = formatierePunkte(
    punkteFuer(1000, pointsPerEuroX100, pointsRounding))

  return (
    <div style={s.block}>
      <label style={s.label}>{t('cards_rate')}</label>
      <div style={s.row}>
        <input
          style={s.zahl}
          type="text"
          inputMode="decimal"
          value={angezeigt}
          onChange={e => setzeZahl(e.target.value)}
        />
        <select
          style={s.select}
          value={proEuro ? 'per_euro' : 'per_point'}
          onChange={e => setzeRichtung(e.target.value === 'per_euro')}
        >
          <option value="per_euro">{t('cards_rate_dir_per_euro')}</option>
          <option value="per_point">{t('cards_rate_dir_per_point')}</option>
        </select>
      </div>
      <div style={s.beispiel}>
        {t('cards_rate_example', { euro: '10', punkte: beispiel })}
      </div>

      <label style={s.label}>{t('cards_rounding')}</label>
      <select
        style={s.select}
        value={pointsRounding}
        onChange={e => onChange({ ...value, pointsRounding: e.target.value })}
      >
        <option value="GENAU">{t('cards_rounding_genau')}</option>
        <option value="ABRUNDEN">{t('cards_rounding_abrunden')}</option>
        <option value="KAUFMAENNISCH">{t('cards_rounding_kaufmaennisch')}</option>
      </select>
    </div>
  )
}

const s = {
  block: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px', textAlign: 'start' },
  row: { display: 'flex', gap: '8px', marginBottom: '6px' },
  zahl: { width: '110px', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' },
  select: { flex: 1, padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', background: 'white', boxSizing: 'border-box' },
  beispiel: { fontSize: '13px', color: '#888', marginBottom: '16px', textAlign: 'start' },
}
