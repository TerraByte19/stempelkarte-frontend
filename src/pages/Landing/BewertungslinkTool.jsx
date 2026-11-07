import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import RechtSeite from './RechtSeite'
import './Tools.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const publicApi = axios.create({ baseURL: API })

/**
 * /tools/bewertungslink: Gratis-Tool fuer Laeden. Name eingeben, Laden bei
 * Google finden, Link "Bewerte uns bei Google" plus QR-Code bekommen.
 * Ohne Google-Schluessel im Backend (aktiv=false) nur die Place-ID von Hand.
 * Darunter der Stampit-Kasten - das ist der Grund, warum es das Tool gibt.
 */
export default function BewertungslinkTool() {
  const [aktiv, setAktiv] = useState(null)       // null = unbekannt, bis zur ersten Antwort
  const [q, setQ] = useState('')
  const [treffer, setTreffer] = useState([])
  const [gewaehlt, setGewaehlt] = useState(null)   // {placeId, name, adresse, link}
  const [placeIdHand, setPlaceIdHand] = useState('')
  const [state, setState] = useState('idle')     // idle | sending | ok | error
  const [fehler, setFehler] = useState('')
  const [kopiert, setKopiert] = useState(false)

  // Einmal fragen, ob die Suche an ist - mit einer harmlosen Anfrage, die am Server nur "aktiv" prueft.
  useEffect(() => {
    publicApi.get('/api/public/bewertungslink', { params: { q: '___' } })
        .then(r => setAktiv(r.data?.aktiv !== false))
        .catch(err => setAktiv(err.response?.status === 400))   // 400 = zu kurz, also an; alles andere: aus
  }, [])

  async function suchen(e) {
    e.preventDefault()
    if (state === 'sending') return
    setFehler(''); setGewaehlt(null); setState('sending')
    try {
      const r = await publicApi.get('/api/public/bewertungslink', { params: { q } })
      setAktiv(r.data?.aktiv !== false)
      setTreffer(r.data?.treffer || [])
      setState('ok')
    } catch (err) {
      setFehler(err.response?.data?.error || 'Das hat nicht geklappt. Bitte gleich noch einmal.')
      setState('error')
    }
  }

  async function vonHand(e) {
    e.preventDefault()
    setFehler('')
    try {
      const r = await publicApi.get('/api/public/bewertungslink/link', { params: { placeId: placeIdHand } })
      setGewaehlt({ placeId: placeIdHand.trim(), name: 'Dein Laden', adresse: '', link: r.data.link })
      setState('ok')
    } catch (err) {
      setFehler(err.response?.data?.error || 'Das ist keine gültige Place-ID.')
      setState('error')
    }
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(gewaehlt.link)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 2500)
    } catch {
      // Kein Zugriff auf die Zwischenablage: der Link steht lesbar im Feld.
    }
  }

  const qrUrl = gewaehlt ? `${API}/api/public/bewertungslink/qr?placeId=${encodeURIComponent(gewaehlt.placeId)}` : null

  return (
    <RechtSeite
      eyebrow="Gratis-Tool"
      titel="Google-Bewertungslink erzeugen"
      beschreibung="Den Link, mit dem Kunden deinen Laden direkt bei Google bewerten, plus QR-Code für den Tresen. Kostenlos, ohne Anmeldung, in 30 Sekunden.">

      <div className="lp-tool">
        {aktiv !== false && (
          <form className="lp-tool-form" onSubmit={suchen}>
            <label htmlFor="tool-q">Name deines Ladens und Ort</label>
            <div className="lp-tool-row">
              <input id="tool-q" value={q} onChange={e => setQ(e.target.value)} placeholder="z. B. Café Nord Berlin Wedding"
                     minLength={3} maxLength={120} required autoComplete="off" />
              <button className="lp-btn lp-btn--primary" type="submit" disabled={state === 'sending'}>
                {state === 'sending' ? 'Suche …' : 'Suchen'}
              </button>
            </div>
          </form>
        )}

        {aktiv === false && (
          <form className="lp-tool-form" onSubmit={vonHand}>
            <p>Die Suche ist gerade nicht verfügbar. Du kannst die Place-ID deines Ladens selbst eingeben:
              Google Maps öffnen, deinen Laden suchen, Link teilen. Die ID steht hinter „placeid=“ oder du
              findest sie im <a href="https://developers.google.com/maps/documentation/places/web-service/place-id#find-id" target="_blank" rel="noopener noreferrer">Place-ID-Finder von Google</a>.</p>
            <label htmlFor="tool-pid">Place-ID</label>
            <div className="lp-tool-row">
              <input id="tool-pid" value={placeIdHand} onChange={e => setPlaceIdHand(e.target.value)} placeholder="ChIJ…" required />
              <button className="lp-btn lp-btn--primary" type="submit">Link erzeugen</button>
            </div>
          </form>
        )}

        {state === 'error' && <div className="lp-tool-msg lp-tool-msg--err" role="alert">{fehler}</div>}

        {state === 'ok' && !gewaehlt && treffer.length === 0 && aktiv !== false && (
          <div className="lp-tool-msg">Nichts gefunden. Probier es mit Name plus Straße oder Stadtteil.</div>
        )}

        {!gewaehlt && treffer.length > 0 && (
          <ul className="lp-tool-treffer" aria-label="Gefundene Läden">
            {treffer.map(t => (
              <li key={t.placeId}>
                <button type="button" onClick={() => setGewaehlt(t)}>
                  <strong>{t.name}</strong>
                  <span>{t.adresse}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {gewaehlt && (
          <div className="lp-tool-ergebnis">
            <div className="lp-tool-ergebnis-text">
              <h2>{gewaehlt.name}</h2>
              {gewaehlt.adresse && <p className="lp-recht-meta">{gewaehlt.adresse}</p>}
              <label htmlFor="tool-link">Dein Bewertungslink</label>
              <div className="lp-tool-row">
                <input id="tool-link" readOnly value={gewaehlt.link} onFocus={e => e.target.select()} />
                <button className="lp-btn lp-btn--primary" type="button" onClick={kopieren}>
                  {kopiert ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
              <p>Den Link in deine Instagram-Bio, auf den Kassenbon oder in eine Nachricht an Stammkunden. Den
                QR-Code ausdrucken und an den Tresen stellen: Handy drauf, Bewertung schreiben.</p>
              <div className="lp-recht-aktionen">
                <a className="lp-btn lp-btn--ghost" href={qrUrl} download="google-bewertung-qr.png">QR-Code herunterladen</a>
                <a className="lp-btn lp-btn--ghost" href={gewaehlt.link} target="_blank" rel="noopener noreferrer">Link testen</a>
                <button className="lp-btn lp-btn--ghost" type="button" onClick={() => { setGewaehlt(null); setKopiert(false) }}>Anderer Laden</button>
              </div>
            </div>
            <div className="lp-tool-qr">
              <img src={qrUrl} alt={`QR-Code zum Bewertungslink von ${gewaehlt.name}`} width="220" height="220" />
              <span>Scannen und bewerten</span>
            </div>
          </div>
        )}
      </div>

      <aside className="lp-tool-cta">
        <h2>Noch mehr Stammkunden?</h2>
        <p>Bewertungen holen neue Gäste. Damit sie wiederkommen, gibt es Stampit: die Stempelkarte im Handy,
          in Apple Wallet und Google Wallet, ohne App. Der Bewertungslink steht dann automatisch auf jeder Karte.</p>
        <div className="lp-recht-aktionen">
          <Link className="lp-btn lp-btn--primary" to="/demo">Karte selbst ausprobieren</Link>
          <Link className="lp-btn lp-btn--ghost" to="/#vorfuehrung">Vorführung buchen</Link>
        </div>
        <p className="lp-recht-meta">14 Tage gratis, ohne Kreditkarte.</p>
      </aside>

      <h2>Warum ein eigener Bewertungslink?</h2>
      <ul>
        <li>Der Link öffnet direkt das Bewertungsfenster bei Google, kein Suchen, kein Scrollen. Je kürzer der Weg, desto mehr Bewertungen.</li>
        <li>Frag am besten direkt nach dem Besuch, wenn der Kunde zufrieden ist: Kassenbon, Tresen-Aufsteller, kurze Nachricht.</li>
        <li>Nicht erlaubt: Bewertungen kaufen, nur zufriedene Kunden fragen („Review Gating“) oder Gegenleistungen versprechen. Google sperrt dafür Profile.</li>
      </ul>
      <p className="lp-recht-meta">Die Suche nutzt Google Places. Deine Eingabe geht von unserem Server an Google, deine IP-Adresse nicht. Wir speichern nichts über dich.</p>
    </RechtSeite>
  )
}
