import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../../../LangContext'

// Eigener, nackter Client statt src/api.js: dessen Interceptor wirft bei 403
// auf /login um. Waere der oeffentliche Endpunkt nicht freigegeben, floege ein
// Besucher beim Absenden aus der Werbeseite. Hier ist kein Token im Spiel.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

export const INSTAGRAM_URL = 'https://www.instagram.com/stampit2026/'

const EMPTY ={ name: '', shop: '', email: '', message: '', website: '' }

export default function Contact() {
  const { t } = useLang()
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState('idle') // idle | sending | ok | error

  const set = field => event => setForm(f => ({ ...f, [field]: event.target.value }))

  // In der verschickbaren Einzeldatei-Fassung gibt es kein Backend. Statt
  // eine rote Fehlermeldung zu zeigen, sagt das Formular offen, dass es eine
  // Vorschau ist. Die Variable wird nur beim Share-Build gesetzt.
  const preview = import.meta.env.VITE_SHARE_PREVIEW === '1'

  async function submit(event) {
    event.preventDefault()
    if (state === 'sending') return
    if (preview) {
      setState('preview')
      return
    }
    setState('sending')
    try {
      await publicApi.post('/api/public/contact', form)
      setState('ok')
      setForm(EMPTY)
    } catch {
      setState('error')
    }
  }

  return (
    <section id="contact" className="lp-contact">
      <div className="lp-wrap lp-contact-in">
        <div className="lp-contact-copy">
          <h2>{t('lp_contact_title')}</h2>
          <p className="lp-lede">{t('lp_contact_body')}</p>
          <p className="lp-contact-alt">{t('lp_contact_insta')}</p>
          <a className="lp-insta" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
            <span dir="ltr">@stampit2026</span>
          </a>
        </div>

        <form className="lp-form" onSubmit={submit} noValidate>
          <label className="lp-field">
            <span>{t('lp_contact_name')}</span>
            <input id="lp-name" name="name" value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
          <label className="lp-field">
            <span>{t('lp_contact_shop')}</span>
            <input id="lp-shop" name="shop" value={form.shop} onChange={set('shop')} required autoComplete="organization" />
          </label>
          <label className="lp-field lp-field--wide">
            <span>{t('lp_contact_email')}</span>
            <input id="lp-email" name="email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </label>
          <label className="lp-field lp-field--wide">
            <span>{t('lp_contact_msg')}</span>
            <textarea id="lp-message" name="message" rows="4" value={form.message} onChange={set('message')} required />
          </label>

          {/* Honigtopf gegen Bots. Aus dem Fluss genommen statt display:none —
              manche Bots ueberspringen versteckte Felder, sichtbar-fuer-Bots
              faengt mehr. */}
          <label className="lp-honeypot" aria-hidden="true">
            Website
            <input id="lp-website" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={set('website')} />
          </label>

          <button className="lp-btn lp-btn--primary" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? t('lp_contact_sending') : t('lp_contact_send')}
          </button>

          {state === 'ok' && <p className="lp-form-msg is-ok" role="status">{t('lp_contact_ok')}</p>}
          {state === 'error' && <p className="lp-form-msg is-err" role="alert">{t('lp_contact_err')}</p>}
          {state === 'preview' && <p className="lp-form-msg" role="status">{t('lp_contact_preview')}</p>}
        </form>
      </div>
    </section>
  )
}
