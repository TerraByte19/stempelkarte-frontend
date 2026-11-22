import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Admin-Panel: Kette eines Ladens. Ueberblick (Filialen, Logins, Geraete) und
 * die Eingriffe, wenn die Zentrale nicht weiterkommt. Jeder Eingriff steht im
 * Zugriffs-Protokoll (Backend). Nur Deutsch, wie das ganze Admin-Panel.
 */
export default function AdminKette({ shop, onChange }) {
  const [stand, setStand] = useState(null)
  const [fehler, setFehler] = useState('')
  const [login, setLogin] = useState({ benutzername: '', passwort: '', ortId: 'HAUPT' })

  async function ruf(pfad, body) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/kette${pfad}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Das hat nicht geklappt')
      setStand(data)
      setFehler('')
      if (body !== undefined) onChange?.()
      return true
    } catch (e) {
      setFehler(e.message)
      return false
    }
  }

  useEffect(() => {
    let aktiv = true
    fetch(`${BASE_URL}/api/admin/shops/${shop.id}/kette`, {
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` },
    })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          if (!aktiv) return
          if (ok) setStand(data)
          else setFehler(data?.error || 'Konnte nicht geladen werden')
        })
        .catch(() => { if (aktiv) setFehler('Server nicht erreichbar') })
    return () => { aktiv = false }
  }, [shop.id])

  async function loginAnlegen(e) {
    e.preventDefault()
    if (await ruf('/logins', login)) setLogin({ benutzername: '', passwort: '', ortId: login.ortId })
  }

  function passwortNeu(l) {
    const neu = prompt(`Neues Passwort für ${l.benutzername} (mindestens 8 Zeichen)`)
    if (neu) ruf(`/logins/${l.id}/passwort`, { passwort: neu })
  }

  if (!stand) return <div style={s.kasten}>{fehler || 'Lädt…'}</div>

  return (
      <div style={s.kasten}>
        <div style={s.kopf}>
          <strong>Kette</strong>
          <span>Filialen aktiv: {stand.filialenAktiv} von {stand.filialen}</span>
          <span>Logins: {stand.logins}</span>
          <span>Mails: {stand.mailsAus ? 'aus' : 'an'}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Geräte je Filiale
            <select value={stand.geraeteJeFiliale} onChange={e => ruf('/geraete-je-filiale', { anzahl: Number(e.target.value) })} style={s.select}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50].concat([stand.geraeteJeFiliale])
                  .filter((n, i, a) => a.indexOf(n) === i).sort((a, b) => a - b)
                  .map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        {!stand.kette && <div style={s.warn}>Dieser Laden hat nicht den Tarif Kette. Filial-Logins und Schalter gibt es erst dort.</div>}
        {fehler && <div style={s.warn}>{fehler}</div>}

        {stand.liste.map(f => (
            <div key={f.id} style={{ ...s.zeile, opacity: f.aktiv ? 1 : 0.6 }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 600 }}>{f.haupt ? 'Hauptstandort' : f.label}</div>
                {f.adresse && <div style={s.klein}>{f.adresse}</div>}
                <div style={s.klein}>Geräte: {f.geraete}</div>
              </div>
              <div style={{ flex: 2, minWidth: 220 }}>
                {f.logins.length === 0 && <span style={s.klein}>kein Login</span>}
                {f.logins.map(l => (
                    <div key={l.id} style={s.login}>
                      <code>{l.benutzername}</code>
                      {l.gesperrt && <span style={s.rot}>gesperrt</span>}
                      <span style={s.klein}>{l.zuletztEingeloggt ? `zuletzt ${new Date(l.zuletztEingeloggt).toLocaleDateString('de-DE')}` : 'nie angemeldet'}</span>
                      <button style={s.btn} onClick={() => passwortNeu(l)}>Passwort neu</button>
                      <button style={s.btn} onClick={() => ruf(`/logins/${l.id}/sperre`, { gesperrt: !l.gesperrt })}>
                        {l.gesperrt ? 'Freigeben' : 'Sperren'}
                      </button>
                    </div>
                ))}
              </div>
              {!f.haupt && (
                  <button style={{ ...s.btn, background: f.aktiv ? '#e6f4ea' : '#f0f0f0' }}
                          onClick={() => ruf(`/filialen/${f.id}/aktiv`, { aktiv: !f.aktiv })}>
                    {f.aktiv ? 'An' : 'Aus'}
                  </button>
              )}
              {f.haupt && <span style={s.klein}>{f.aktiv ? 'zählt als Filiale' : 'nur Zentrale'}</span>}
            </div>
        ))}

        {stand.kette && (
            <form onSubmit={loginAnlegen} style={s.form}>
              <input style={s.input} placeholder="Benutzername" value={login.benutzername}
                     onChange={e => setLogin({ ...login, benutzername: e.target.value })} autoComplete="off" />
              <input style={s.input} placeholder="Passwort (min. 8)" value={login.passwort}
                     onChange={e => setLogin({ ...login, passwort: e.target.value })} autoComplete="off" />
              <select style={s.select} value={login.ortId} onChange={e => setLogin({ ...login, ortId: e.target.value })}>
                {stand.liste.map(f => <option key={f.id} value={f.id}>{f.haupt ? 'Hauptstandort' : f.label}</option>)}
              </select>
              <button style={s.btn} type="submit" disabled={!login.benutzername || login.passwort.length < 8}>Login anlegen</button>
            </form>
        )}
      </div>
  )
}

const s = {
  kasten: { gridColumn: '1 / -1', background: '#fffaf2', border: '1px solid #f0d9b0', borderRadius: 10, padding: 14, margin: '6px 0 12px', fontSize: 13 },
  kopf: { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 10 },
  warn: { background: '#fce8e6', color: '#c5221f', padding: '8px 10px', borderRadius: 8, marginBottom: 8 },
  zeile: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '8px 0', borderTop: '1px solid #f0e6d2' },
  klein: { fontSize: 11, color: '#888' },
  rot: { fontSize: 11, color: '#c5221f', fontWeight: 600 },
  login: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '2px 0' },
  btn: { fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: 'pointer' },
  select: { fontSize: 12, padding: '3px 4px', borderRadius: 6, border: '1px solid #ddd', background: 'white' },
  input: { fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid #ddd' },
  form: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0e6d2' },
}
