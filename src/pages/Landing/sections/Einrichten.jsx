import { useState } from 'react'
import axios from 'axios'
import { useLang } from '../../../LangContext'
import { branchenLabels } from '../branchen'
import '../Branchen.css'

// Wie in Contact.jsx: eigener Client ohne den Interceptor aus src/api.js.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

const EMPTY = { name: '', shop: '', email: '', phone: '', wish: '', website: '' }

/**
 * "Keine Zeit dafuer? Wir richten deine Karte ein." Kleines Formular, geht
 * als Kontaktanfrage ins Admin (POST /api/public/contact). Telefon und
 * Wunsch stehen in der Nachricht, so braucht das Backend nichts Neues.
 */
export default function Einrichten() {
  const { lang } = useLang()
  const l = branchenLabels(lang)
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState('idle') // idle | sending | ok | error

  const set = field => event => setForm(f => ({ ...f, [field]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending')
    const message = ['[Karte einrichten lassen]',
      form.phone.trim() ? `Telefon: ${form.phone.trim()}` : null,
      form.wish.trim() ? `Wunsch: ${form.wish.trim()}` : null,
    ].filter(Boolean).join('\n')
    try {
      await publicApi.post('/api/public/contact', {
        name: form.name, shop: form.shop, email: form.email, message, website: form.website,
      })
      setState('ok')
      setForm(EMPTY)
    } catch {
      setState('error')
    }
  }

  return (
    <section id="einrichten" className="lp-setup">
      <div className="lp-wrap lp-setup-in">
        <div className="lp-setup-copy">
          <h2>{l.setupTitle}</h2>
          <p>{l.setupText}</p>
        </div>
        <form className="lp-setup-form" onSubmit={submit}>
          <label>{l.setupName}
            <input name="name" value={form.name} onChange={set('name')} required maxLength="200" autoComplete="name" />
          </label>
          <label>{l.setupShop}
            <input name="shop" value={form.shop} onChange={set('shop')} required maxLength="200" autoComplete="organization" />
          </label>
          <label>{l.setupEmail}
            <input name="email" type="email" value={form.email} onChange={set('email')} required maxLength="200" autoComplete="email" />
          </label>
          <label>{l.setupPhone}
            <input name="phone" type="tel" value={form.phone} onChange={set('phone')} maxLength="40" autoComplete="tel" />
          </label>
          <label>{l.setupWish}
            <textarea name="wish" rows="3" value={form.wish} onChange={set('wish')} maxLength="2000" />
          </label>
          {/* Honigtopf wie im Kontaktformular: nur Bots fuellen das Feld. */}
          <input className="lp-honeypot" name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
          <button className="lp-btn lp-btn--primary" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? l.setupSending : l.setupSend}
          </button>
          {state === 'ok' && <div className="lp-setup-msg lp-setup-msg--ok" role="status">{l.setupOk}</div>}
          {state === 'error' && <div className="lp-setup-msg lp-setup-msg--err" role="alert">{l.setupError}</div>}
          <small>{l.setupConsent}</small>
        </form>
      </div>
    </section>
  )
}
