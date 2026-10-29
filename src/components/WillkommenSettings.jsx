/**
 * Willkommensgeschenk einer Stempelkarte ("Erster Kaffee geht auf uns").
 *
 * Wer sich NEU ueber den Aushang anmeldet, bekommt eine gesperrte Karte.
 * Erst wenn das Personal an der Kasse das Geschenk einloest, wird daraus
 * eine normale Stempelkarte mit 0 Stempeln.
 *
 * Gesteuert von aussen wie PointsSettings: gespeichert wird mit dem
 * Speichern-Knopf des Karten-Editors, nicht hier.
 *
 * Die Zaehler zeigen, was der Aushang bringt. Sie sind der einzige Ort, an
 * dem der Laden das sieht - deshalb stehen sie direkt am Schalter.
 */
export default function WillkommenSettings({ value, onChange, t }) {
  const { enabled, text, offen, eingeloest } = value

  return (
    <div style={s.box}>
      <label style={s.titel}>{t('welcome_title')}</label>
      <p style={s.hint}>{t('welcome_hint')}</p>

      <label style={s.switchRow}>
        <input type="checkbox" checked={!!enabled}
               onChange={e => onChange({ ...value, enabled: e.target.checked })} />
        <span style={s.switchLabel}>{t('welcome_switch')}</span>
      </label>

      {enabled && (
        <div style={{ marginTop: 12 }}>
          <label style={s.label}>{t('welcome_text')}</label>
          {/* 60 wie im Backend (Card.WILLKOMMEN_MAX). Leer = Standardtext. */}
          <input style={s.input} maxLength={60} value={text || ''}
                 onChange={e => onChange({ ...value, text: e.target.value })}
                 placeholder={t('welcome_text_ph')} />
        </div>
      )}

      {(offen > 0 || eingeloest > 0) && (
        <div style={s.zaehler}>
          {t('welcome_counts', { offen: offen || 0, eingeloest: eingeloest || 0 })}
        </div>
      )}

      {/* Wer ausschaltet, soll wissen, dass offene Geschenke offen bleiben. */}
      {!enabled && offen > 0 && (
        <div style={s.warn}>{t('welcome_off_note', { n: offen })}</div>
      )}
    </div>
  )
}

const s = {
  box: { marginBottom: 16, padding: 12, borderRadius: 10, background: '#FFF8EC', border: '1px solid #F4D9A6' },
  titel: { fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block' },
  hint: { fontSize: 12, color: '#666', lineHeight: 1.45, margin: '0 0 10px' },
  switchRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  switchLabel: { fontSize: 13, color: '#1a1a1a', fontWeight: 600 },
  label: { fontSize: 12, color: '#555', marginBottom: 6, display: 'block' },
  input: { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  zaehler: { fontSize: 12, color: '#5a4600', marginTop: 10, fontWeight: 600 },
  warn: { fontSize: 11, color: '#B35309', marginTop: 6, lineHeight: 1.45 },
}
