import { useRef, useState } from 'react'
import api from '../api'
import BildCropper from './BildCropper'
import { blobZuBase64 } from '../lib/bild'

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
// Farben der gesperrten Karte. Leer = normale Kartenfarbe (standardFarben).
const FARBEN = [
  { key: 'colorBackground', label: 'design_color_bg' },
  { key: 'colorForeground', label: 'design_color_fg' },
  { key: 'colorLabel', label: 'design_color_label' },
]

export default function WillkommenSettings({ value, onChange, t, cardId, standardFarben = {} }) {
  const { enabled, text, offen, eingeloest } = value
  const bildRef = useRef()
  const [cropDatei, setCropDatei] = useState(null)
  const [laedt, setLaedt] = useState(false)

  // Hochladen legt nur das Bild ab. An der Karte gespeichert wird es erst
  // mit dem Speichern-Knopf - wie alles in diesem Abschnitt.
  async function hochladen(blob) {
    setLaedt(true)
    try {
      const res = await api.post(`/api/shop/cards/${cardId}/welcome-image`,
        { base64: await blobZuBase64(blob), extension: 'png' })
      onChange(v => ({ ...v, imageUrl: res.data.welcomeImageUrl }))
    } catch { alert(t('common_upload_failed')) }
    setLaedt(false)
  }

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

      {enabled && cardId && (
        <div style={s.design}>
          <label style={s.titel}>{t('welcome_design')}</label>

          <label style={s.label}>{t('welcome_image')}</label>
          {value.imageUrl ? (
            <img src={value.imageUrl} alt="" style={s.bild}/>
          ) : (
            <div style={s.keinBild}>{t('welcome_image_none')}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" style={s.btn} disabled={laedt} onClick={() => bildRef.current?.click()}>
              {laedt ? t('common_loading') : value.imageUrl ? t('common_change') : t('common_upload')}
            </button>
            {value.imageUrl && (
              <button type="button" style={s.btnWeg} disabled={laedt}
                      onClick={() => onChange({ ...value, imageUrl: '' })}>
                {t('common_remove')}
              </button>
            )}
          </div>
          <input ref={bildRef} type="file" accept="image/*" style={{ display: 'none' }}
                 onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setCropDatei(f) }}/>
          {cropDatei && (
            <BildCropper datei={cropDatei} form="breit" ratio={375 / 144} ausgabe={1125}
                         onFertig={blob => { setCropDatei(null); if (blob) hochladen(blob) }}
                         onAbbrechen={() => setCropDatei(null)}/>
          )}

          {/* Jeder Text ist abschaltbar, Standard aus. 18 und 40 wie im
              Backend (Card.WILLKOMMEN_TITEL_MAX / _HINWEIS_MAX). */}
          <label style={s.switchRow}>
            <input type="checkbox" checked={!!value.showTitle}
                   onChange={e => onChange({ ...value, showTitle: e.target.checked })} />
            <span style={s.label}>{t('welcome_show_title')}</span>
          </label>
          {value.showTitle && (
            <input style={{ ...s.input, margin: '6px 0 12px' }} maxLength={18} value={value.title || ''}
                   onChange={e => onChange({ ...value, title: e.target.value })}
                   placeholder={t('preview_welcome_google')} />
          )}

          <label style={s.switchRow}>
            <input type="checkbox" checked={!!value.showGift}
                   onChange={e => onChange({ ...value, showGift: e.target.checked })} />
            <span style={s.label}>{t('welcome_show_gift')}</span>
          </label>

          <label style={s.switchRow}>
            <input type="checkbox" checked={!!value.showHint}
                   onChange={e => onChange({ ...value, showHint: e.target.checked })} />
            <span style={s.label}>{t('welcome_show_hint')}</span>
          </label>
          {value.showHint && (
            <input style={{ ...s.input, margin: '6px 0 12px' }} maxLength={40} value={value.hint || ''}
                   onChange={e => onChange({ ...value, hint: e.target.value })}
                   placeholder={t('preview_welcome_how_value')} />
          )}
          <div style={{ height: 12 }} />

          <label style={s.label}>{t('welcome_colors')}</label>
          <p style={s.hint}>{t('welcome_colors_iphone')}</p>
          {FARBEN.map(({ key, label }) => (
            <div key={key} style={s.farbZeile}>
              <input type="color" value={value[key] || standardFarben[key] || '#000000'}
                     onChange={e => onChange({ ...value, [key]: e.target.value })}
                     style={s.farbe}/>
              <span style={{ fontSize: 12, color: '#555', flex: 1 }}>{t(label)}</span>
              {value[key] && (
                <button type="button" style={s.btnWeg} onClick={() => onChange({ ...value, [key]: '' })}>
                  {t('welcome_color_reset')}
                </button>
              )}
            </div>
          ))}
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
  design: { marginTop: 14, paddingTop: 12, borderTop: '1px solid #F4D9A6' },
  bild: { width: '100%', aspectRatio: '375 / 144', objectFit: 'cover', borderRadius: 8, marginBottom: 8, display: 'block' },
  keinBild: { width: '100%', height: 50, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 12, color: '#bbb' },
  btn: { padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: 'white', fontSize: 12, cursor: 'pointer' },
  btnWeg: { padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#B35309', fontSize: 12, cursor: 'pointer' },
  farbZeile: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  farbe: { width: 36, height: 28, border: 'none', padding: 0, background: 'none', cursor: 'pointer' },
}
