import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useLang } from '../LangContext'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Oeffentliche Demo-Seite: die Karten der Demo-Laeden (Admin: "Demo") mit
 * QR und Link zur Anmeldeseite. Wer sich eine holt, stempelt sich auf der
 * Kartenseite selbst ("Naechster Schritt"). Kein Login noetig.
 */
export default function Demo() {
  const { t } = useLang()
  const [karten, setKarten] = useState(null)

  useEffect(() => {
    api.get('/api/public/demo')
        .then(r => setKarten(Array.isArray(r.data) ? r.data : []))
        .catch(() => setKarten([]))
  }, [])

  return (
      <div style={s.seite}>
        <div style={s.kopf}>
          <Link to="/" style={s.logo}>Stampit</Link>
          <Link to="/login" style={s.login}>{t('lp_nav_login')}</Link>
        </div>
        <h1 style={s.titel}>{t('demo_title')}</h1>
        <p style={s.unter}>{t('demo_subtitle')}</p>

        <ol style={s.schritte}>
          <li>{t('demo_step1')}</li>
          <li>{t('demo_step2')}</li>
          <li>{t('demo_step3')}</li>
        </ol>

        {karten === null && <p style={s.hinweis}>{t('common_loading')}</p>}
        {karten && karten.length === 0 && <p style={s.hinweis}>{t('demo_empty')}</p>}
        {karten && karten.length > 0 && (
            <div style={s.raster}>
              {karten.map(k => (
                  <div key={k.cardId} style={s.karte}>
                    <img src={`${baseUrl}/api/customer/card/${k.cardId}/qr-shop`} alt="" style={s.qr} />
                    <div style={s.kartenName}>{k.name}</div>
                    <div style={s.kartenTyp}>{t(`demo_type_${k.type}`) === `demo_type_${k.type}` ? k.type : t(`demo_type_${k.type}`)} · {k.shopName}</div>
                    <a href={k.url} style={s.btn}>{t('demo_open')}</a>
                  </div>
              ))}
            </div>
        )}
        <p style={s.hinweis}>{t('demo_note')}</p>
      </div>
  )
}

const s = {
  seite: { maxWidth: 820, margin: '0 auto', padding: '24px 16px 48px', fontFamily: 'inherit', color: '#1a1a1a' },
  kopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  logo: { fontSize: 20, fontWeight: 800, color: '#3C3489', textDecoration: 'none' },
  login: { fontSize: 14, color: '#3C3489', textDecoration: 'none', fontWeight: 600 },
  titel: { fontSize: 28, fontWeight: 800, margin: '0 0 6px' },
  unter: { fontSize: 15, color: '#666', margin: '0 0 18px', lineHeight: 1.5 },
  schritte: { fontSize: 14, color: '#444', lineHeight: 1.7, paddingInlineStart: 20, margin: '0 0 24px' },
  raster: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  karte: { background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', textAlign: 'center' },
  qr: { width: 160, height: 160, borderRadius: 8 },
  kartenName: { fontSize: 16, fontWeight: 700, marginTop: 10 },
  kartenTyp: { fontSize: 12, color: '#888', margin: '2px 0 12px' },
  btn: { display: 'inline-block', background: '#3C3489', color: 'white', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  hinweis: { fontSize: 13, color: '#888', marginTop: 20 },
}
