import { useMemo, useState } from 'react'
import axios from 'axios'
import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'
import './Vorfuehrung.css'

// Wie in Einrichten.jsx: eigener Client ohne den Interceptor aus src/api.js.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

const ARTEN = ['IM_LADEN', 'TELEFON', 'VIDEO']
const EMPTY = { art: 'IM_LADEN', date: '', time: '', name: '', shop: '', phone: '', email: '', address: '', message: '', website: '' }

/** Datum als YYYY-MM-DD in Ortszeit, ohne UTC-Sprung um Mitternacht. */
function iso(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 09:00 bis 20:00 in halben Stunden. */
const ZEITEN = (() => {
  const out = []
  for (let h = 9; h <= 20; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) out.push(`${String(h).padStart(2, '0')}:30`)
  }
  return out
})()

/**
 * "Lieber erst live sehen?" 15 Minuten Vorfuehrung im Laden, am Telefon
 * oder per Video. Die Anfrage geht an POST /api/public/termin und landet im
 * Admin; bestaetigt wird von Hand. Kein Kalender-Dienst, kein fremdes Konto.
 */
export default function Vorfuehrung() {
  const { t, lang } = useLang()
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState('idle') // idle | sending | ok | error
  const [fehler, setFehler] = useState('')

  const grenzen = useMemo(() => {
    const morgen = new Date(); morgen.setDate(morgen.getDate() + 1)
    const spaet = new Date(); spaet.setDate(spaet.getDate() + 90)
    return { min: iso(morgen), max: iso(spaet) }
  }, [])

  const set = field => event => setForm(f => ({ ...f, [field]: event.target.value }))
  const imLaden = form.art === 'IM_LADEN'

  async function submit(event) {
    event.preventDefault()
    if (state === 'sending') return
    setFehler('')
    if (!form.phone.trim() && !form.email.trim()) {
      setState('error'); setFehler(t('lp_termin_kontakt_fehlt')); return
    }
    setState('sending')
    try {
      await publicApi.post('/api/public/termin', {
        name: form.name, shop: form.shop, email: form.email, phone: form.phone, art: form.art,
        date: form.date, time: form.time, address: imLaden ? form.address : '', message: form.message,
        language: lang, website: form.website,
      })
      setState('ok')
      setForm(EMPTY)
    } catch (err) {
      setFehler(err.response?.data?.error || '')
      setState('error')
    }
  }

  return (
    <section id="vorfuehrung" className="lp-termin">
      <div className="lp-wrap lp-termin-in">
        <Reveal>
          <div className="lp-termin-copy">
            <h2>{t('lp_termin_title')}</h2>
            <p>{t('lp_termin_body')}</p>
            <ul className="lp-termin-punkte">
              <li>{t('lp_termin_punkt_1')}</li>
              <li>{t('lp_termin_punkt_2')}</li>
              <li>{t('lp_termin_punkt_3')}</li>
            </ul>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <form className="lp-termin-form" onSubmit={submit}>
            <fieldset className="lp-termin-arten">
              <legend>{t('lp_termin_art')}</legend>
              {ARTEN.map(a => (
                <label key={a} className={form.art === a ? 'is-on' : undefined}>
                  <input type="radio" name="art" value={a} checked={form.art === a} onChange={set('art')} />
                  <span>{t(`lp_termin_art_${a.toLowerCase()}`)}</span>
                </label>
              ))}
            </fieldset>

            <div className="lp-termin-row">
              <label>{t('lp_termin_tag')}
                <input name="date" type="date" value={form.date} onChange={set('date')} required
                       min={grenzen.min} max={grenzen.max} />
              </label>
              <label>{t('lp_termin_zeit')}
                <select name="time" value={form.time} onChange={set('time')} required>
                  <option value="" disabled>{t('lp_termin_zeit_ph')}</option>
                  {ZEITEN.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </label>
            </div>

            <div className="lp-termin-row">
              <label>{t('lp_termin_name')}
                <input name="name" value={form.name} onChange={set('name')} required maxLength="200" autoComplete="name" />
              </label>
              <label>{t('lp_termin_laden')}
                <input name="shop" value={form.shop} onChange={set('shop')} required maxLength="200" autoComplete="organization" />
              </label>
            </div>

            <div className="lp-termin-row">
              <label>{t('lp_termin_telefon')}
                <input name="phone" type="tel" value={form.phone} onChange={set('phone')} maxLength="40" autoComplete="tel" />
              </label>
              <label>{t('lp_termin_email')}
                <input name="email" type="email" value={form.email} onChange={set('email')} maxLength="200" autoComplete="email" />
              </label>
            </div>
            <small>{t('lp_termin_kontakt_hint')}</small>

            {imLaden && (
              <label>{t('lp_termin_adresse')}
                <input name="address" value={form.address} onChange={set('address')} required maxLength="300" autoComplete="street-address" />
              </label>
            )}

            <label>{t('lp_termin_nachricht')}
              <textarea name="message" rows="2" value={form.message} onChange={set('message')} maxLength="1000" />
            </label>

            {/* Honigtopf wie im Kontaktformular: nur Bots fuellen das Feld. */}
            <input className="lp-honeypot" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />

            <button className="lp-btn lp-btn--primary" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? t('lp_termin_sending') : t('lp_termin_send')}
            </button>
            {state === 'ok' && <div className="lp-termin-msg lp-termin-msg--ok" role="status">{t('lp_termin_ok')}</div>}
            {state === 'error' && (
              <div className="lp-termin-msg lp-termin-msg--err" role="alert">{fehler || t('lp_termin_error')}</div>
            )}
            <small>{t('lp_termin_consent')}</small>
          </form>
        </Reveal>
      </div>
    </section>
  )
}
