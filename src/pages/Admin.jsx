import { useState, useEffect, Fragment } from 'react'
import StatsView from '../components/StatsView'
import { LogoZeichen } from '../components/Logo'
import { ALLE, OHNE, auswahlOrdner, benutzteOrdner, imOrdner } from '../lib/adminOrdner'
import { supportStarten } from '../lib/supportZugang'
import AdminKette from '../components/AdminKette'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Admin() {
  const [secret, setSecret] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [changingPasswordFor, setChangingPasswordFor] = useState(null)
  const [changingEmailFor, setChangingEmailFor] = useState(null)
  const [verwaltenId, setVerwaltenId] = useState(null)   // Laden, dessen Kasten "Verwalten" offen ist
  const [statistikId, setStatistikId] = useState(null)   // Statistik im Kasten aufgeklappt
  const [draggedId, setDraggedId] = useState(null)   // Laden am Haken
  const [dragOverId, setDragOverId] = useState(null) // Zeile unter dem Zeiger
  // Eigener Zustand: das allgemeine `error` wird nur auf dem Login-Bildschirm
  // gezeigt. Wer eingeloggt sortiert, saehe sonst nur die zurueckspringende
  // Zeile und keinen Grund.
  const [sortError, setSortError] = useState('')
  // Scans, die nicht am Laden passiert sind. Nur eine Liste - gesperrt wird
  // nichts, siehe GeoPruefung im Backend.
  const [geoVorfaelle, setGeoVorfaelle] = useState([])
  // Anfragen aus dem Kontaktformular der Landing-Page.
  const [anfragen, setAnfragen] = useState([])
  const [offeneAnfrage, setOffeneAnfrage] = useState(null)
  // Zitate der Laeden fuer die Startseite - erst nach Freigabe hier live.
  const [stimmen, setStimmen] = useState([])
  // Neue Filialen von Ketten, die auf meine Bestaetigung warten.
  const [filialAnfragen, setFilialAnfragen] = useState([])
  // Terminanfragen fuer Vorfuehrungen von der Startseite.
  const [termine, setTermine] = useState([])
  // Reiter oben und Ordner-Filter im Reiter Laeden. Bleibt beim Neuladen der Seite.
  const [reiter, setReiterState] = useState(() => sessionStorage.getItem('adminReiter') || 'laeden')
  const [ordnerFilter, setOrdnerFilterState] = useState(() => sessionStorage.getItem('adminOrdner') || ALLE)
  const [neuerLadenOffen, setNeuerLadenOffen] = useState(false)
  function setReiter(r) { setReiterState(r); sessionStorage.setItem('adminReiter', r) }
  function setOrdnerFilter(o) { setOrdnerFilterState(o); sessionStorage.setItem('adminOrdner', o) }

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken')
    if (token) {
      setLoggedIn(true)
      loadShops(token)
    }
  }, [])

  async function login() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: secret })
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.setItem('adminToken', data.token)
        setLoggedIn(true)
        loadShops(data.token)
      } else {
        setError(data.error || 'Fehler beim Login')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  async function loadGeoVorfaelle(token) {
    const t = token || sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/geo-vorfaelle`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setGeoVorfaelle(Array.isArray(data) ? data : [])
    } catch (e) {
      // Kein Grund, das Panel scheitern zu lassen - die Liste ist Beiwerk.
    }
  }

  async function loadAnfragen(token) {
    const t = token || sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/kontaktanfragen`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setAnfragen(Array.isArray(data) ? data : [])
    } catch (e) {
      // Wie bei den Geo-Vorfaellen: Beiwerk, das Panel laeuft weiter.
    }
  }

  async function toggleAnfrageErledigt(id) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/kontaktanfragen/${id}/erledigt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) loadAnfragen()
    } catch (e) {
      alert('Fehler beim Abhaken')
    }
  }

  async function deleteAnfrage(id, name) {
    if (!confirm(`Anfrage von "${name}" löschen?`)) return
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/kontaktanfragen/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) loadAnfragen()
    } catch (e) {
      alert('Fehler beim Löschen')
    }
  }

  async function loadStimmen(token) {
    const t = token || sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/stimmen`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setStimmen(Array.isArray(data) ? data : [])
    } catch {
      // Beiwerk wie die Kontaktanfragen.
    }
  }

  // aktion: 'freigeben' | 'ablehnen'. Der Wortlaut wird nie geaendert - passt
  // etwas nicht, ablehnen; der Laden sieht das in der App und reicht neu ein.
  async function entscheideStimme(id, aktion) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/stimmen/${id}/${aktion}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) loadStimmen()
      else alert('Das hat nicht geklappt')
    } catch {
      alert('Das hat nicht geklappt')
    }
  }

  async function loadFilialAnfragen(token) {
    const t = token || sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/kette/anfragen`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setFilialAnfragen(Array.isArray(data) ? data : [])
    } catch {
      // Beiwerk, das Panel laeuft weiter.
    }
  }

  // aktion: 'bestaetigen' | 'ablehnen'
  async function entscheideFiliale(a, aktion) {
    if (aktion === 'ablehnen' && !confirm(`Filiale "${a.label}" von "${a.shopName}" ablehnen?\n\nSie wird entfernt, ihre Logins auch.`)) return
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${a.shopId}/kette/filialen/${a.ortId}/${aktion}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: '{}'
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '')
      }
      loadFilialAnfragen()
      loadShops()
    } catch (e) {
      alert('Das hat nicht geklappt. ' + (e.message || ''))
    }
  }

  async function loadTermine(token) {
    const t = token || sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/termine`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setTermine(Array.isArray(data) ? data : [])
    } catch {
      // Beiwerk, das Panel laeuft weiter.
    }
  }

  async function setzeTerminStatus(id, status) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/termine/${id}/status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) loadTermine()
      else alert('Das hat nicht geklappt')
    } catch {
      alert('Das hat nicht geklappt')
    }
  }

  async function loescheTermin(id, laden) {
    if (!confirm(`Terminanfrage von "${laden}" löschen?`)) return
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/termine/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) loadTermine()
    } catch {
      alert('Fehler beim Löschen')
    }
  }

  async function loadShops(token) {
    const t = token || sessionStorage.getItem('adminToken')
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.status === 401) { logout(); return }
      const data = await res.json()
      setShops(Array.isArray(data) ? data : [])
      loadGeoVorfaelle(t)
      loadAnfragen(t)
      loadStimmen(t)
      loadTermine(t)
      loadFilialAnfragen(t)
    } catch (e) {
      setError('Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verschiebt einen Laden vor die Zeile, auf der er fallen gelassen wurde.
   *
   * Sortiert wird die GESAMTE Liste, obwohl die Tabelle nach Sprache
   * getrennt angezeigt wird: eine Zeile zu verschieben laesst die
   * Reihenfolge aller anderen unberuehrt, also stimmt auch die Ansicht
   * der jeweils anderen Tabelle weiterhin.
   */
  function verschiebeShop(vonId, aufId) {
    if (!vonId || vonId === aufId) return
    const von = shops.findIndex(s => s.id === vonId)
    const auf = shops.findIndex(s => s.id === aufId)
    if (von < 0 || auf < 0) return

    const neu = [...shops]
    const [bewegt] = neu.splice(von, 1)
    neu.splice(auf, 0, bewegt)

    const vorher = shops
    setShops(neu)                       // sofort sichtbar
    speichereReihenfolge(neu, vorher)   // danach sichern
  }

  async function speichereReihenfolge(neu, vorher) {
    const t = sessionStorage.getItem('adminToken')
    setSortError('')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ shopIds: neu.map(s => s.id) })
      })
      if (res.status === 401) { logout(); return }
      if (!res.ok) {
        // 404 heisst fast immer: der Server laeuft noch mit einem aelteren
        // Stand als dieses Panel. Das ist etwas anderes als ein echter
        // Fehler und soll auch anders dastehen.
        throw new Error(res.status === 404
            ? 'Der Server kennt das Sortieren noch nicht (404). Das Backend-Deploy ist noch nicht durch.'
            : `Server antwortet mit ${res.status}.`)
      }
    } catch (e) {
      // Nicht gespeichert: alte Reihenfolge zuruecknehmen, sonst zeigt das
      // Panel eine Sortierung, die nach dem naechsten Laden wieder weg ist.
      setShops(vorher)
      setSortError('Reihenfolge nicht gespeichert, Liste zurueckgesetzt. '
          + (e.message || 'Server nicht erreichbar.'))
    }
  }

  async function toggleShop(shopId) {
    const t = sessionStorage.getItem('adminToken')
    try {
      await fetch(`${BASE_URL}/api/admin/shops/${shopId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      loadShops()
    } catch (e) {
      alert('Fehler beim Sperren/Entsperren')
    }
  }

  // Standort-Pflicht pro Laden: befreite Laeden scannen ohne Standort.
  async function toggleGeoPflicht(shopId) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}/geo-pflicht`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Umstellen der Standort-Pflicht')
    }
  }

  // Weitere Orte je nach Tarif: 0 = Funktion aus, hoechstens 9 (Apple: zehn pro Karte).
  async function setMaxOrte(shopId, max) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}/max-orte`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ max })
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Setzen der weiteren Orte')
    }
  }

  // Schnittstelle (API-Schluessel, Webhooks) je Laden freischalten - Tarif.
  async function setApi(shopId, freigeschaltet) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}/api`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ freigeschaltet })
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Umstellen der Schnittstelle')
    }
  }

  // Newsletter je Laden: aus = der Laden kann keinen Newsletter senden. Alle
  // anderen Mails und die Anmeldung der Kunden bleiben. Feld heisst noch mailsAus.
  async function setMails(shop, aus) {
    if (aus && !confirm(`Newsletter für "${shop.name}" ausschalten?

Der Newsletter ist dann im Dashboard weg. Anmeldung und Bestätigungsmail der Kunden bleiben wie bisher.`)) return
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/mails`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ aus })
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Umstellen des Newsletters')
    }
  }

  // Tarif: BASIC, PRO oder KETTE. Ohne Eintrag liefert das Backend PRO.
  // Basic sperrt Kampagnen, Auto-Nachrichten, Tagesangebot, Newsletter, API, Filialen.
  async function setTarif(shop, tarif) {
    if (tarif === 'BASIC' && !confirm(`"${shop.name}" auf Basic stellen?\n\nDann gibt es dort keine Kampagnen, automatischen Nachrichten, Tagesangebot, Newsletter, API und Filialen mehr. Die Einstellungen bleiben gespeichert und laufen bei Pro wieder.`)) {
      return
    }
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/tarif`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarif })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.hinweis) alert(data.hinweis)
      loadShops()
    } catch {
      alert('Fehler beim Setzen des Tarifs')
    }
  }

  // Sprache der Kundenseiten und Mails (de, en, ar, tr). Gilt fuer neue
  // Kunden; wer sich schon angemeldet hat, behaelt seine Sprache.
  async function setSprache(shop, language) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/sprache`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Setzen der Sprache')
    }
  }

  // Testphase: 0 = bezahlt (Testphase weg), sonst ab heute noch so viele Tage.
  // Nach Ablauf wird nichts gesperrt, der Laden sieht nur einen Hinweis.
  // bis (JJJJ-MM-TT): freies Enddatum; dann zaehlt tage nicht.
  async function setTest(shop, tage, bis) {
    if (tage === 0 && !confirm(`"${shop.name}" als bezahlt markieren? Die Testphase ist dann vorbei.`)) return
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(bis ? { tage: 0, bis } : { tage })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '')
      }
      loadShops()
    } catch (e) {
      alert('Fehler beim Setzen der Testphase. ' + (e.message || ''))
    }
  }

  // Demo-Laden fuer die Website: Besucher holen sich eine Karte und stempeln sich selbst.
  // Ordner setzen: sofort anzeigen, bei Fehler zuruecknehmen.
  async function setOrdner(shop, ordner) {
    const t = sessionStorage.getItem('adminToken')
    const vorher = shop.ordner ?? null
    setShops(list => list.map(s => s.id === shop.id ? { ...s, ordner } : s))
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/ordner`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordner })
      })
      if (res.status === 401) { logout(); return }
      if (!res.ok) throw new Error(res.status === 404 ? 'Server kennt Ordner noch nicht (Backend-Deploy fehlt).' : '')
      const data = await res.json()
      setShops(list => list.map(s => s.id === shop.id ? { ...s, ordner: data.ordner ?? null } : s))
    } catch (e) {
      setShops(list => list.map(s => s.id === shop.id ? { ...s, ordner: vorher } : s))
      alert('Ordner nicht gespeichert. ' + (e.message || ''))
    }
  }

  function waehleOrdner(shop, wert) {
    if (wert === '__neu') {
      const name = (prompt('Name des neuen Ordners:') || '').trim()
      if (name) setOrdner(shop, name.slice(0, 40))
      return
    }
    setOrdner(shop, wert || null)
  }

  async function setDemo(shopId, demo) {
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}/demo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo })
      })
      if (!res.ok) throw new Error()
      loadShops()
    } catch {
      alert('Fehler beim Umstellen des Demo-Ladens')
    }
  }

  // Sprache wird beim Erstellen festgelegt und ist danach fix - kein Umschalten.

  async function deleteShop(shopId, shopName) {
    if (!confirm(`ACHTUNG - Shop "${shopName}" wirklich KOMPLETT löschen?\n\nDas löscht:\n- Den Shop-Account\n- Alle Stempelkarten\n- Alle Kundendaten\n- Alle Staff-Tokens\n\nDas kann NICHT rückgängig gemacht werden!`)) return
    if (!confirm(`Letzter Check: "${shopName}" endgültig löschen?`)) return

    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (res.ok) {
        loadShops()
      } else {
        const data = await res.json()
        alert('Fehler: ' + (data.error || 'Unbekannter Fehler'))
      }
    } catch (e) {
      alert('Fehler beim Löschen')
    }
  }

  /**
   * Support-Zugang: oeffnet das Dashboard eines Ladens in einem neuen Tab.
   * Das Backend schreibt den Zugriff ins Protokoll und gibt einen Laden-Token
   * fuer eine Stunde heraus. Das Passwort des Ladens bleibt unberuehrt.
   *
   * Der Tab wird VOR der Anfrage geoeffnet: nach einem await blockt der
   * Browser neue Fenster.
   */
  async function oeffneLaden(shop) {
    if (!confirm(`Laden "${shop.name}" öffnen?\n\n- Du siehst und änderst den ECHTEN Laden.\n- Der Zugriff wird protokolliert.\n- Gilt 1 Stunde.\n- Ein Laden-Login in diesem Browser wird ersetzt.`)) return

    const tab = window.open('', '_blank')
    const t = sessionStorage.getItem('adminToken')
    let res
    try {
      res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/zugang`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${t}` }
      })
    } catch {
      tab?.close()
      alert('Server nicht erreichbar')
      return
    }
    if (res.status === 401) { tab?.close(); logout(); return }
    const data = await res.json().catch(() => ({}))
    try {
      if (!res.ok) throw new Error(data.error || 'Laden konnte nicht geöffnet werden')
      supportStarten(localStorage, data)
    } catch (e) {
      tab?.close()
      alert('Fehler: ' + e.message)
      return
    }
    if (tab) {
      // Der neue Tab erbt eine Kopie des Admin-Logins. Im Laden-Tab hat der
      // Admin-Token nichts verloren.
      try { tab.sessionStorage.removeItem('adminToken') } catch { /* dann bleibt die Kopie */ }
      tab.location.href = '/'
    } else {
      window.location.href = '/'   // Fenster geblockt: im selben Tab oeffnen
    }
  }

  function logout() {
    sessionStorage.removeItem('adminToken')
    setLoggedIn(false)
    setSecret('')
    setShops([])
  }

  if (!loggedIn) {
    return (
        <div style={styles.loginContainer}>
          <div style={styles.loginCard}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><LogoZeichen size={52} /></div>
            <h1 style={styles.loginTitle}>Admin-Panel</h1>
            <p style={styles.loginSubtitle}>Nur fur Betreiber</p>
            {error && <div style={styles.loginError}>{error}</div>}
            <div style={styles.field}>
              <label style={styles.label}>Admin-Passwort</label>
              <input
                  style={styles.input}
                  type="password"
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  placeholder="••••••••"
              />
            </div>
            <button style={styles.btnLogin} onClick={login} disabled={loading}>
              {loading ? 'Einloggen...' : 'Einloggen'}
            </button>
          </div>
        </div>
    )
  }

  const ordner = benutzteOrdner(shops)
  // Gespeicherter Ordner kann inzwischen leer sein - dann alle zeigen.
  const aktiverOrdner = ordnerFilter === ALLE || ordnerFilter === OHNE || ordner.includes(ordnerFilter) ? ordnerFilter : ALLE
  const sichtbar = imOrdner(shops, aktiverOrdner)
  const ordnerAuswahl = auswahlOrdner(shops)

  return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Admin-Panel</h1>
            <p style={styles.subtitle}>{shops.length} Laden registriert</p>
          </div>
          <button style={styles.btnLogout} onClick={logout}>Ausloggen</button>
        </div>

        <div style={styles.reiterLeiste}>
          {[
            ['laeden', filialAnfragen.length > 0 ? `Läden · ${filialAnfragen.length} Filial-Anfrage${filialAnfragen.length === 1 ? '' : 'n'}` : 'Läden', shops.length],
            ['anfragen', 'Anfragen', anfragen.filter(a => !a.erledigt).length],
            ['vorfuehrungen', 'Vorführungen', termine.filter(x => x.status === 'OFFEN').length],
            ['stimmen', 'Stimmen', stimmen.filter(x => x.status === 'OFFEN').length],
            ['technik', 'Technik', geoVorfaelle.length],
          ].map(([id, label, n]) => (
            <button key={id} onClick={() => setReiter(id)}
                    style={{ ...styles.reiter, ...(reiter === id ? styles.reiterAktiv : {}) }}>
              {label}
              {n > 0 && <span style={{ ...styles.reiterZahl, ...(id !== 'laeden' ? styles.reiterZahlOffen : {}),
                                        ...(reiter === id ? styles.reiterZahlAktiv : {}) }}>{n}</span>}
            </button>
          ))}
        </div>

        {reiter === 'laeden' && (
          <>
            {filialAnfragen.length > 0 && (
              <div style={{ background: '#FBF3E2', border: '1px solid #E3B77E', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  Neue Filialen warten auf deine Bestätigung ({filialAnfragen.length})
                </div>
                <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
                  Bis du bestätigst, kann dort nicht gestempelt werden und das Filial-Login geht nicht. Bestätigt = sofort eingeschaltet.
                </div>
                {filialAnfragen.map(a => (
                  <div key={a.ortId} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline',
                                              padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13 }}>
                    <span style={{ fontWeight: 700, minWidth: 140 }}>{a.shopName}</span>
                    <span style={{ fontWeight: 600 }}>{a.label}</span>
                    {a.adresse && <span style={{ color: '#6B6678' }}>{a.adresse}</span>}
                    <span style={{ color: '#9A94A8', marginLeft: 'auto' }}>
                      {new Date(a.angelegt).toLocaleString('de-DE')}
                    </span>
                    <button onClick={() => entscheideFiliale(a, 'bestaetigen')}
                            style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                                     border: '1px solid #BFE0C5', background: '#EAF3EA', color: '#2C5F2E' }}>
                      Bestätigen
                    </button>
                    <button onClick={() => entscheideFiliale(a, 'ablehnen')}
                            style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                     border: '1px solid #E8C4BE', background: '#FBEDEB', color: '#A32015' }}>
                      Ablehnen
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.stats}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{shops.length}</div>
                <div style={styles.statLabel}>Gesamt Laden</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{shops.filter(s => s.active).length}</div>
                <div style={styles.statLabel}>Aktive Laden</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{shops.reduce((sum, s) => sum + s.customerCount, 0)}</div>
                <div style={styles.statLabel}>Gesamt Kunden</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{shops.reduce((sum, s) => sum + s.cardCount, 0)}</div>
                <div style={styles.statLabel}>Gesamt Karten</div>
              </div>
            </div>

            <div style={styles.ordnerLeiste}>
              {[[ALLE, 'Alle', shops.length],
                ...ordner.map(o => [o, o, shops.filter(s => s.ordner === o).length]),
                [OHNE, 'Ohne Ordner', shops.filter(s => !s.ordner).length],
              ].map(([id, label, n]) => (
                <button key={id} onClick={() => setOrdnerFilter(id)}
                        style={{ ...styles.ordner, ...(aktiverOrdner === id ? styles.ordnerAktiv : {}) }}>
                  {label} <span style={{ opacity: 0.6 }}>{n}</span>
                </button>
              ))}
              <button onClick={() => setNeuerLadenOffen(o => !o)} style={styles.btnNeuerLaden}>
                {neuerLadenOffen ? 'Schließen' : '+ Neuer Laden'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#9A94A8', margin: '-8px 0 14px' }}>
              Einordnen über die Auswahl unter dem Ladennamen. Ordner sind nur für dich, am Laden ändert sich nichts. Tarif, Schalter und Konto stehen unter „Verwalten“.
            </div>

            {neuerLadenOffen && <CreateShop onCreated={loadShops} />}


            {sortError && (
                <div style={styles.sortError}>
                  {sortError}
                  <button style={styles.sortErrorClose} onClick={() => setSortError('')}>✕</button>
                </div>
            )}

            {sichtbar.length === 0 && (
                <div style={{ fontSize: 13, color: '#9A94A8', padding: '16px 0' }}>In diesem Ordner liegt noch kein Laden.</div>
            )}

            {sichtbar.some(s => (s.language || 'de') !== 'ar') && renderShopTable(sichtbar.filter(s => (s.language || 'de') !== 'ar'))}

            {sichtbar.some(s => (s.language || 'de') === 'ar') && (
                <>
                  <h2 style={styles.sectionTitle}>Arabische Läden (RTL)</h2>
                  {renderShopTable(sichtbar.filter(s => (s.language || 'de') === 'ar'))}
                </>
            )}
          </>
        )}

        {reiter === 'anfragen' && (
          <>
            <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Kontaktanfragen ({anfragen.filter(a => !a.erledigt).length} offen)
              </div>
              <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
                Aus dem Formular auf der Startseite. Antworten per Mail an die angegebene Adresse.
              </div>
              {anfragen.length === 0 && (
                <div style={{ fontSize: 13, color: '#9A94A8' }}>Noch keine Anfragen.</div>
              )}
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {anfragen.map(a => (
                  <div key={a.id} style={{ padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13,
                                           opacity: a.erledigt ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                      <button
                        onClick={() => setOffeneAnfrage(offeneAnfrage === a.id ? null : a.id)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                 font: 'inherit', fontWeight: 600, textAlign: 'start', minWidth: 140 }}>
                        {a.laden} · {a.name}
                      </button>
                      <a href={`mailto:${a.email}?subject=${encodeURIComponent('Deine Anfrage bei Stampit')}`}
                         style={{ color: '#3C3489' }}>{a.email}</a>
                      <span style={{ color: '#9A94A8', marginLeft: 'auto' }}>
                        {new Date(a.eingegangenAm).toLocaleString('de-DE')}
                      </span>
                      <button onClick={() => toggleAnfrageErledigt(a.id)}
                              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                       border: '1px solid #DDD9EE', background: a.erledigt ? '#F3F1FA' : '#EAF3EA' }}>
                        {a.erledigt ? 'Wieder öffnen' : 'Erledigt'}
                      </button>
                      <button onClick={() => deleteAnfrage(a.id, a.name)}
                              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                       border: '1px solid #E8C4BE', background: '#FBEDEB', color: '#A32015' }}>
                        Löschen
                      </button>
                    </div>
                    {offeneAnfrage === a.id && (
                      <div style={{ whiteSpace: 'pre-line', marginTop: 8, padding: '8px 12px',
                                    borderInlineStart: '3px solid #3C3489', background: '#F7F6FB', borderRadius: 6 }}>
                        {a.nachricht}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {reiter === 'vorfuehrungen' && (
          <>
            <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Vorführungen ({termine.filter(x => x.status === 'OFFEN').length} offen)
              </div>
              <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
                Terminanfragen von der Startseite. Bestätigen per WhatsApp, Anruf oder Mail, dann hier auf „Bestätigt“.
              </div>
              {termine.length === 0 && (
                <div style={{ fontSize: 13, color: '#9A94A8' }}>Noch keine Anfragen.</div>
              )}
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {termine.map(x => (
                  <div key={x.id} style={{ padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13,
                                           opacity: x.status === 'ERLEDIGT' ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, minWidth: 150 }}>
                        {new Date(x.wunschAm + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} · {x.wunschZeit}
                      </span>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: '#F3F1FA' }}>
                        {x.art === 'IM_LADEN' ? 'Im Laden' : x.art === 'TELEFON' ? 'Telefon' : 'Video'}
                      </span>
                      <span style={{ fontWeight: 600 }}>{x.laden} · {x.name}</span>
                      {x.telefon && <a href={`tel:${x.telefon.replace(/\s+/g, '')}`} style={{ color: '#3C3489' }}>{x.telefon}</a>}
                      {x.email && <a href={`mailto:${x.email}?subject=${encodeURIComponent('Deine Stampit-Vorführung')}`} style={{ color: '#3C3489' }}>{x.email}</a>}
                      <span style={{ color: '#9A94A8', marginLeft: 'auto' }}>
                        {new Date(x.eingegangenAm).toLocaleString('de-DE')}{x.sprache && x.sprache !== 'de' ? ` · ${x.sprache.toUpperCase()}` : ''}
                      </span>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6,
                                     background: x.status === 'BESTAETIGT' ? '#EAF3EA' : x.status === 'ERLEDIGT' ? '#F3F1FA' : '#FBF3E2' }}>
                        {x.status === 'BESTAETIGT' ? 'bestätigt' : x.status === 'ERLEDIGT' ? 'erledigt' : 'offen'}
                      </span>
                      {x.status !== 'BESTAETIGT' && (
                        <button onClick={() => setzeTerminStatus(x.id, 'BESTAETIGT')}
                                style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                         border: '1px solid #DDD9EE', background: '#EAF3EA' }}>
                          Bestätigt
                        </button>
                      )}
                      {x.status !== 'ERLEDIGT' && (
                        <button onClick={() => setzeTerminStatus(x.id, 'ERLEDIGT')}
                                style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                         border: '1px solid #DDD9EE', background: '#F3F1FA' }}>
                          Erledigt
                        </button>
                      )}
                      <button onClick={() => loescheTermin(x.id, x.laden)}
                              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                       border: '1px solid #E8C4BE', background: '#FBEDEB', color: '#A32015' }}>
                        Löschen
                      </button>
                    </div>
                    {(x.adresse || x.nachricht) && (
                      <div style={{ marginTop: 8, padding: '8px 12px', borderInlineStart: '3px solid #3C3489',
                                    background: '#F7F6FB', borderRadius: 6, whiteSpace: 'pre-line' }}>
                        {x.adresse && <div>{x.adresse}</div>}
                        {x.nachricht && <div style={{ color: '#6B6678' }}>{x.nachricht}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {reiter === 'stimmen' && (
          <>
            <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                Stimmen für die Startseite ({stimmen.filter(x => x.status === 'OFFEN').length} offen)
              </div>
              <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
                Zitate aus der App (Profil). Freigegebene stehen auf der Startseite, der Wortlaut bleibt wie eingereicht.
                Passt etwas nicht: ablehnen, der Laden sieht das und kann neu einreichen.
              </div>
              {stimmen.length === 0 && (
                <div style={{ fontSize: 13, color: '#7A5200', background: '#FBF3E2', padding: '8px 12px', borderRadius: 8 }}>
                  Noch keine Stimmen. Erinnerung: 2 bis 3 zufriedene Läden bitten, in der App unter Profil ein Zitat
                  einzureichen (Block „Deine Stimme für die Stampit-Website“). Danach hier freigeben, dann steht es auf der Startseite.
                </div>
              )}
              <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                {stimmen.map(x => (
                  <div key={x.id} style={{ padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13,
                                           opacity: x.status === 'ABGELEHNT' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, minWidth: 140 }}>{x.laden} · {x.ort}</span>
                      {x.person && <span style={{ color: '#6B6678' }}>{x.person}</span>}
                      <a href={`mailto:${x.email}`} style={{ color: '#3C3489' }}>{x.email}</a>
                      <span style={{ color: '#9A94A8', marginLeft: 'auto' }}
                            title={`Einverständnis ${new Date(x.einverstandenAm).toLocaleString('de-DE')}`}>
                        {new Date(x.eingereichtAm).toLocaleString('de-DE')}
                      </span>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6,
                                     background: x.status === 'FREIGEGEBEN' ? '#EAF3EA' : x.status === 'ABGELEHNT' ? '#FBEDEB' : '#FBF3E2' }}>
                        {x.status === 'FREIGEGEBEN' ? 'auf der Website' : x.status === 'ABGELEHNT' ? 'abgelehnt' : 'wartet'}
                      </span>
                      {x.status !== 'FREIGEGEBEN' && (
                        <button onClick={() => entscheideStimme(x.id, 'freigeben')}
                                style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                         border: '1px solid #DDD9EE', background: '#EAF3EA' }}>
                          Freigeben
                        </button>
                      )}
                      {x.status !== 'ABGELEHNT' && (
                        <button onClick={() => entscheideStimme(x.id, 'ablehnen')}
                                style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                         border: '1px solid #E8C4BE', background: '#FBEDEB', color: '#A32015' }}>
                          Ablehnen
                        </button>
                      )}
                    </div>
                    <div style={{ marginTop: 8, padding: '8px 12px', borderInlineStart: '3px solid #3C3489',
                                  background: '#F7F6FB', borderRadius: 6, whiteSpace: 'pre-line' }}>
                      „{x.zitat}“
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {reiter === 'technik' && (
          <>
            {(
              <div style={{ background: '#FBEFE2', border: '1px solid #E3B77E', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  Scans ausserhalb des Ladens ({geoVorfaelle.length})
                </div>
                <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
                  Der Stempel wurde gebucht. Der Ort kommt aus dem Browser des Personals
                  und ist nur so genau wie dessen Geraet.
                </div>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {geoVorfaelle.map(v => (
                    <div key={v.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline',
                                             padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, minWidth: 140 }}>{v.shopName}</span>
                      <span style={{ color: v.art === 'WEIT_WEG' ? '#B4462F' : '#6B6678' }}>
                        {v.art === 'WEIT_WEG' ? `${v.distanzMeter} m entfernt` : 'kein Ort gesendet'}
                      </span>
                      <span style={{ color: '#6B6678' }}>{v.staffLabel || 'ohne Kasse'}</span>
                      <span style={{ color: '#9A94A8', marginLeft: 'auto' }}>
                        {new Date(v.passiertAm).toLocaleString('de-DE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ScannerMessung />
            <ScannerLage />
            <ZugriffProtokoll />
          </>
        )}
      </div>
  )

  // Schilder in der Zeile: nur lesen. Geaendert wird alles unter "Verwalten".
  function schilder(shop) {
    const tarif = shop.tarif ?? 'PRO'
    const liste = [[tarif === 'BASIC' ? 'Basic' : tarif === 'KETTE' ? 'Kette' : 'Pro',
                    tarif === 'BASIC' ? 'grau' : tarif === 'KETTE' ? 'orange' : 'blau']]
    if (shop.testTage != null) liste.push(shop.testTage > 0 ? [`Test: ${shop.testTage} T`, 'blau'] : ['Test vorbei', 'rot'])
    if (shop.mailsAus) liste.push(['Newsletter aus', 'rot'])
    if (shop.apiFreigeschaltet) liste.push(['API', 'gruen'])
    if (shop.demo) liste.push(['Demo', 'orange'])
    if (shop.geoBefreit) liste.push(['Ohne Standort-Pflicht', 'orange'])
    else if (!shop.standortGesetzt) liste.push(['Standort fehlt', 'rot'])
    if (!shop.active) liste.push(['Gesperrt', 'rot'])
    return liste
  }

  function renderVerwalten(shop) {
    const feld = { fontSize: 13, padding: '5px 8px', borderRadius: 8, border: '1px solid #DDD9EE', background: 'white', minWidth: 150 }
    return (
        <div style={styles.verwalten}>
          <div style={styles.verwaltenGruppen}>
            <div style={styles.gruppe}>
              <div style={styles.gruppeTitel}>Tarif</div>
              <label style={styles.zeile}>
                <span>Tarif</span>
                <select value={shop.tarif ?? 'PRO'} onChange={e => setTarif(shop, e.target.value)} style={feld}>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                  <option value="KETTE">Kette</option>
                </select>
              </label>
              <label style={styles.zeile}>
                <span>
                  Testphase
                  <span style={styles.klein}>
                    {shop.testBis ? `bis ${new Date(shop.testBis).toLocaleDateString('de-DE')}` : 'bezahlt, keine Testphase'}
                  </span>
                </span>
                {/* Stand als Beschriftung, Auswahl = bezahlt oder verlaengern. */}
                <select value="" onChange={e => { if (e.target.value !== '') setTest(shop, Number(e.target.value)) }} style={feld}>
                  <option value="">{shop.testTage == null ? 'Bezahlt' : shop.testTage > 0 ? `Test: ${shop.testTage} T` : 'Test vorbei'}</option>
                  {shop.testTage != null && <option value="0">Als bezahlt markieren</option>}
                  <option value="7">Test: 7 Tage ab heute</option>
                  <option value="14">Test: 14 Tage ab heute</option>
                </select>
              </label>
              <label style={styles.zeile}>
                <span>
                  Test bis Datum
                  <span style={styles.klein}>frei wählbar, gilt bis zum Ende des Tages</span>
                </span>
                <TestDatum key={shop.testBis || 'kein'} start={shop.testBis ? datumLokal(new Date(shop.testBis)) : ''}
                           stil={feld} onSetzen={datum => setTest(shop, 0, datum)} />
              </label>
              {/* Filialen = Hauptstandort + weitere Orte. Gespeichert wird die
                  Zahl der weiteren Orte (0-9), angezeigt die Filialen. */}
              <label style={styles.zeile}>
                <span>
                  Filialen im Tarif
                  <span style={styles.klein}>Hauptstandort plus weitere Standorte</span>
                </span>
                <select value={shop.maxOrte ?? 0} onChange={e => setMaxOrte(shop.id, Number(e.target.value))} style={feld}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n + 1}</option>)}
                </select>
              </label>
              <label style={styles.zeile}>
                <span>
                  Sprache
                  <span style={styles.klein}>nur für die Anzeige im Admin</span>
                </span>
                <select value={shop.language ?? 'de'} onChange={e => setSprache(shop, e.target.value)} style={feld}>
                  <option value="de">Deutsch</option>
                  <option value="en">Englisch</option>
                  <option value="ar">Arabisch</option>
                  <option value="tr">Türkisch</option>
                </select>
              </label>
              <div style={styles.zeile}>
                <span>Scanner-Geräte</span>
                <span style={{ fontWeight: 600 }}>{shop.maxTokens}</span>
              </div>
            </div>

            <div style={styles.gruppe}>
              <div style={styles.gruppeTitel}>Schalter</div>
              <Schalter an={!shop.mailsAus} titel="Newsletter"
                        text={shop.mailsAus ? 'Aus: der Laden kann keinen Newsletter senden. Anmeldung und Bestätigungsmail bleiben.'
                            : 'An: der Laden kann Newsletter an seine Kunden senden.'}
                        onClick={() => setMails(shop, !shop.mailsAus)} />
              <Schalter an={!shop.geoBefreit} titel="Standort-Pflicht"
                        text={shop.geoBefreit ? 'Aus: scannt ohne Standort.'
                            : shop.standortGesetzt ? 'An: Scan nur im Laden.' : 'An, aber der Laden hat noch keinen Standort gesetzt.'}
                        onClick={() => toggleGeoPflicht(shop.id)} />
              <Schalter an={!!shop.apiFreigeschaltet} titel="Schnittstelle (API)"
                        text="API-Schlüssel und Webhooks für diesen Laden."
                        onClick={() => setApi(shop.id, !shop.apiFreigeschaltet)} />
              <Schalter an={!!shop.demo} titel="Demo-Laden"
                        text="Für die Website: Besucher holen sich eine Karte und stempeln sich selbst."
                        onClick={() => setDemo(shop.id, !shop.demo)} />
            </div>

            <div style={styles.gruppe}>
              <div style={styles.gruppeTitel}>Konto</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button style={{ ...styles.btnToggle, background: '#f0eeff', color: '#3C3489' }}
                        onClick={() => { setChangingEmailFor(null); setChangingPasswordFor(changingPasswordFor?.id === shop.id ? null : shop) }}>
                  Passwort ändern
                </button>
                <button title="Login-Adresse des Ladens ändern"
                        style={{ ...styles.btnToggle, background: '#f0eeff', color: '#3C3489' }}
                        onClick={() => { setChangingPasswordFor(null); setChangingEmailFor(changingEmailFor?.id === shop.id ? null : shop) }}>
                  Login-Mail ändern
                </button>
                <button style={{ ...styles.btnToggle, background: statistikId === shop.id ? '#3C3489' : '#eef2ff',
                                 color: statistikId === shop.id ? 'white' : '#3C3489' }}
                        onClick={() => setStatistikId(id => id === shop.id ? null : shop.id)}>
                  {statistikId === shop.id ? 'Statistik schließen' : 'Statistik'}
                </button>
                <button style={{ ...styles.btnToggle, background: shop.active ? '#fce8e6' : '#e6f4ea', color: shop.active ? '#c00' : '#2C5F2E' }}
                        onClick={() => toggleShop(shop.id)}>
                  {shop.active ? 'Sperren' : 'Entsperren'}
                </button>
              </div>
              <button style={{ ...styles.btnToggle, flex: 'none', background: 'none', color: '#c00', border: '1px solid #f5c6c2', marginTop: 14 }}
                      onClick={() => deleteShop(shop.id, shop.name)}>
                Laden löschen
              </button>
            </div>
          </div>

          {changingPasswordFor?.id === shop.id && (
              <ChangePassword shop={shop} onDone={() => setChangingPasswordFor(null)} />
          )}
          {changingEmailFor?.id === shop.id && (
              <ChangeEmail key={shop.id} shop={shop} onChanged={loadShops} onDone={() => setChangingEmailFor(null)} />
          )}
          {statistikId === shop.id && <ShopStatsExpanded shop={shop} />}
          {shop.tarif === 'KETTE' && (
              <>
                <div style={{ ...styles.gruppeTitel, marginTop: 18 }}>Kette: Filialen, Logins, Geräte je Filiale</div>
                <AdminKette shop={shop} onChange={loadShops} />
              </>
          )}
        </div>
    )
  }

  function renderShopTable(list) {
    return (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span></span>
            <span>Laden</span>
            <span>E-Mail</span>
            <span>Karten</span>
            <span>Kunden</span>
            <span>Stand</span>
            <span></span>
          </div>
          {list.map(shop => {
            const offen = verwaltenId === shop.id
            return (
                <Fragment key={shop.id}>
                  <div
                      style={{
                        ...styles.tableRow,
                        opacity: draggedId === shop.id ? 0.4 : (shop.active ? 1 : 0.6),
                        // Linie zeigt, wo die Zeile landet
                        borderTop: dragOverId === shop.id && draggedId !== shop.id
                            ? '2px solid #3C3489' : styles.tableRow.borderTop,
                      }}
                      onDragOver={e => { e.preventDefault(); setDragOverId(shop.id) }}
                      onDragLeave={() => setDragOverId(id => id === shop.id ? null : id)}
                      onDrop={e => {
                        e.preventDefault()
                        verschiebeShop(draggedId, shop.id)
                        setDraggedId(null)
                        setDragOverId(null)
                      }}
                  >
                    {/* Nur der Griff ist ziehbar - sonst startet jeder Klick
                        auf Text oder Knopf einen Drag. */}
                    <span
                        style={styles.dragHandle}
                        title="Zum Sortieren ziehen"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', shop.id)
                          setDraggedId(shop.id)
                        }}
                        onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                    >⠿</span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, minWidth: 0 }}>
                      <span style={styles.shopName}>{shop.name}</span>
                      <select
                          title="Ordner im Admin-Panel"
                          value={shop.ordner ?? ''}
                          onChange={e => waehleOrdner(shop, e.target.value)}
                          style={{ ...styles.ordnerSelect, color: shop.ordner ? '#3C3489' : '#9A94A8' }}
                      >
                        <option value="">Ohne Ordner</option>
                        {ordnerAuswahl.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="__neu">+ Neuer Ordner…</option>
                      </select>
                    </span>
                    <span style={{ ...styles.shopEmail, overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.email}</span>
                    <span style={styles.cell}>{shop.cardCount}</span>
                    {/* Basic: Kunden gegen die Grenze, rot ab 100 (nur Hinweis, keine Sperre). */}
                    <span
                        style={{ ...styles.cell, ...(shop.kundenGrenze && shop.customerCount >= shop.kundenGrenze ? { color: '#c5221f', fontWeight: 600 } : {}) }}
                        title={shop.kundenGrenze ? `Basic: bis ${shop.kundenGrenze} Kunden` : 'Unbegrenzt'}
                    >
                      {shop.kundenGrenze ? `${shop.customerCount} / ${shop.kundenGrenze}` : shop.customerCount}
                    </span>
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {schilder(shop).map(([text, farbe]) => (
                          <span key={text} style={{ ...styles.schild, ...SCHILD_FARBEN[farbe] }}>{text}</span>
                      ))}
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <button
                          title={shop.active
                              ? 'Dashboard dieses Ladens öffnen (1 Stunde, wird protokolliert)'
                              : 'Gesperrt - erst entsperren, dann öffnen'}
                          disabled={!shop.active}
                          style={{
                            ...styles.btnToggle,
                            background: '#fff4e5', color: '#b35c00',
                            ...(shop.active ? {} : { opacity: 0.45, cursor: 'not-allowed' }),
                          }}
                          onClick={() => oeffneLaden(shop)}
                      >
                        Öffnen
                      </button>
                      <button
                          style={{
                            ...styles.btnToggle,
                            background: offen ? '#3C3489' : '#eef2ff',
                            color: offen ? 'white' : '#3C3489',
                          }}
                          onClick={() => setVerwaltenId(id => id === shop.id ? null : shop.id)}
                      >
                        {offen ? 'Schließen' : 'Verwalten'}
                      </button>
                    </div>
                  </div>
                  {offen && renderVerwalten(shop)}
                </Fragment>
            )
          })}
        </div>
    )
  }
}

/** JJJJ-MM-TT in der Zeit des Browsers, fuer <input type="date">. */
function datumLokal(d) {
  const zwei = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`
}

/**
 * Datum waehlen, dann "Setzen". Gespeichert wird erst auf den Knopf: beim
 * Tippen eines Datums meldet das Feld sonst schon halbe Jahreszahlen.
 */
function TestDatum({ start, stil, onSetzen }) {
  const [datum, setDatum] = useState(start)
  return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="date" style={{ ...stil, minWidth: 0 }} min={datumLokal(new Date())}
               value={datum} onChange={e => setDatum(e.target.value)} />
        <button type="button" disabled={!datum || datum === start} onClick={() => onSetzen(datum)}
                style={{ fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none',
                         background: '#eef2ff', color: '#3C3489',
                         cursor: !datum || datum === start ? 'default' : 'pointer',
                         opacity: !datum || datum === start ? 0.5 : 1 }}>
          Setzen
        </button>
      </span>
  )
}

const SCHILD_FARBEN = {
  grau: { background: '#f0f0f0', color: '#555' },
  blau: { background: '#eef2ff', color: '#3C3489' },
  orange: { background: '#fff4e5', color: '#b35c00' },
  gruen: { background: '#e6f4ea', color: '#2C5F2E' },
  rot: { background: '#fce8e6', color: '#c5221f' },
}

/** Ein beschrifteter Ein/Aus-Schalter im Kasten "Verwalten". */
function Schalter({ an, titel, text, onClick }) {
  return (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '7px 0' }}>
        <span style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{titel}</span>
          <span style={{ display: 'block', fontSize: 12, color: '#6B6678', marginTop: 2 }}>{text}</span>
        </span>
        <button role="switch" aria-checked={an} aria-label={titel} onClick={onClick}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 2,
                         background: an ? '#2C8A4B' : '#C9C5D6', display: 'flex', justifyContent: an ? 'flex-end' : 'flex-start' }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', display: 'block' }} />
        </button>
      </div>
  )
}

/**
 * Stille Scanner-Messung: je Geraetetyp, welcher Herausforderer wie oft
 * zuerst traf. A = heutiger Scanner, B = ZXing, C = Nimiq, D = Handy-eigen.
 */
function ScannerMessung() {
  const [zeilen, setZeilen] = useState(null)
  useEffect(() => {
    const t = sessionStorage.getItem('adminToken')
    fetch(`${BASE_URL}/api/admin/scanner-messung`, { headers: { 'Authorization': `Bearer ${t}` } })
        .then(r => (r.ok ? r.json() : []))
        .then(d => setZeilen(Array.isArray(d) ? d : []))
        .catch(() => setZeilen([]))
  }, [])
  const name = { neu: 'B (ZXing)', nimiq: 'C (Nimiq)', handy: 'D (Handy)' }
  return (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Scanner-Messung (letzte 60 Tage)</div>
          <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
            Beim Stempeln liest still ein zweiter Scanner mit. Ab 30 Runden und 80 % „zuerst“ mit 150 ms Vorsprung
            schaltet das Gerät selbst um. A = heutiger Scanner.
          </div>
          {zeilen === null ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Lädt …</div>
            : zeilen.length === 0 ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Noch keine Messungen.</div>
            : (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', color: '#6B6678' }}>
                  <th style={{ padding: 6 }}>Gerät</th><th style={{ padding: 6 }}>Gegen A</th><th style={{ padding: 6 }}>Runden</th>
                  <th style={{ padding: 6 }}>Zuerst</th><th style={{ padding: 6 }}>Vorsprung</th><th style={{ padding: 6 }}>Verfehlt</th><th style={{ padding: 6 }}>Umgeschaltet</th>
                </tr></thead>
                <tbody>
                  {zeilen.map((z, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #eee', background: z.anteilProzent >= 80 && z.runden >= 30 ? '#e8f5ec' : 'transparent' }}>
                        <td style={{ padding: 6 }}>{z.geraet}</td>
                        <td style={{ padding: 6 }}>{name[z.gegner] || z.gegner}</td>
                        <td style={{ padding: 6 }}>{z.runden}</td>
                        <td style={{ padding: 6 }}>{z.anteilProzent} %</td>
                        <td style={{ padding: 6 }}>{z.vorsprungMs == null ? '-' : `${z.vorsprungMs > 0 ? '+' : ''}${z.vorsprungMs} ms`}</td>
                        <td style={{ padding: 6 }}>{z.verfehlt}</td>
                        <td style={{ padding: 6 }}>{z.gewechselt > 0 ? `ja (${z.gewechselt})` : 'nein'}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
  )
}

/**
 * Hochformat gegen Querformat: je Laden und Geraet, wie das Geraet beim
 * Stempeln gehalten wurde und wie schnell der erste Treffer kam. "Bild
 * gedreht" = die Kamera lieferte ein Bild, das nicht zur Lage passt.
 */
function ScannerLage() {
  const [zeilen, setZeilen] = useState(null)
  useEffect(() => {
    const t = sessionStorage.getItem('adminToken')
    fetch(`${BASE_URL}/api/admin/scanner-lage`, { headers: { 'Authorization': `Bearer ${t}` } })
        .then(r => (r.ok ? r.json() : []))
        .then(d => setZeilen(Array.isArray(d) ? d : []))
        .catch(() => setZeilen([]))
  }, [])
  return (
        <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Hochformat und Querformat (letzte 60 Tage)</div>
          <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
            Wie das Gerät beim Stempeln gehalten wurde und wie lange es bis zum Treffer dauerte.
            „Bild gedreht“ heißt: Die Kamera lieferte ein Bild, das nicht zur Lage passt.
          </div>
          {zeilen === null ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Lädt …</div>
            : zeilen.length === 0 ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Noch keine Messungen.</div>
            : (
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left', color: '#6B6678' }}>
                  <th style={{ padding: 6 }}>Laden</th><th style={{ padding: 6 }}>Gerät</th><th style={{ padding: 6 }}>Lage</th>
                  <th style={{ padding: 6 }}>Geöffnet als</th><th style={{ padding: 6 }}>Runden</th><th style={{ padding: 6 }}>Treffer nach</th>
                  <th style={{ padding: 6 }}>Bild gedreht</th>
                </tr></thead>
                <tbody>
                  {zeilen.map((z, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #eee', background: z.bildGedreht > 0 ? '#fff4e5' : 'transparent' }}>
                        <td style={{ padding: 6 }}>{z.laden}</td>
                        <td style={{ padding: 6 }}>{z.geraet}</td>
                        <td style={{ padding: 6 }}>{z.lage === 'quer' ? 'quer' : 'hoch'}</td>
                        <td style={{ padding: 6 }}>{z.app == null ? '-' : z.app ? 'App' : 'Browser'}</td>
                        <td style={{ padding: 6 }}>{z.runden}</td>
                        <td style={{ padding: 6 }}>{z.trefferMs} ms</td>
                        <td style={{ padding: 6 }}>{z.bildGedreht > 0 ? `ja (${z.bildGedreht})` : 'nein'}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
  )
}

function ShopStatsExpanded({ shop }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ok = true
    const t = sessionStorage.getItem('adminToken')
    fetch(`${BASE_URL}/api/admin/shops/${shop.id}/stats/summary`, {
      headers: { 'Authorization': `Bearer ${t}` }
    })
        .then(res => { if (!res.ok) throw new Error('Ladefehler'); return res.json() })
        .then(d => { if (ok) setData(d) })
        .catch(() => { if (ok) setError(true) })
        .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [shop.id])

  if (loading) return <div style={expandStyles.panel}>Lade Statistik...</div>
  if (error || !data) return <div style={expandStyles.panel}>Statistik konnte nicht geladen werden.</div>

  return (
      <div style={expandStyles.panel}>
        <StatsView
            data={data}
            fetchDay={date => {
              const t = sessionStorage.getItem('adminToken')
              return fetch(`${BASE_URL}/api/admin/shops/${shop.id}/stats/day?date=${date}`, {
                headers: { 'Authorization': `Bearer ${t}` }
              }).then(res => { if (!res.ok) throw new Error('Ladefehler'); return res.json() })
            }}
        />
      </div>
  )
}

const expandStyles = {
  panel: { background: '#faf9ff', borderTop: '1px solid #efecfb', padding: '18px 20px', minWidth: '900px' },
}

function CreateShop({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', maxTokens: 3, language: 'de' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ ...form, maxTokens: parseInt(form.maxTokens) })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(`Laden "${data.name}" erstellt! Max Tokens: ${data.maxTokens}`)
        setForm({ name: '', email: '', password: '', maxTokens: 3, language: 'de' })
        onCreated()
      } else {
        setError(data.error || 'Fehler beim Erstellen')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div style={createStyles.card}>
        <h2 style={createStyles.title}>Neuen Laden erstellen</h2>
        {error && <div style={createStyles.error}>{error}</div>}
        {success && <div style={createStyles.success}>{success}</div>}
        <form onSubmit={handleCreate} style={createStyles.form}>
          <input style={createStyles.input} placeholder="Laden-Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input style={createStyles.input} type="email" placeholder="E-Mail" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={createStyles.input} type="password" placeholder="Passwort (min. 8 Zeichen)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>Max. Staff-Tokens</label>
            <input style={createStyles.input} type="number" min="1" max="20" value={form.maxTokens} onChange={e => setForm({ ...form, maxTokens: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>
              Sprache <span style={{ color: '#999' }}>(nur Anzeige im Admin; Kunden starten auf Deutsch und schalten selbst um)</span>
            </label>
            <select style={createStyles.input} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="ar">العربية (RTL)</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
          <button style={createStyles.btn} type="submit" disabled={loading}>
            {loading ? 'Erstelle...' : 'Laden erstellen'}
          </button>
        </form>
      </div>
  )
}

function ChangePassword({ shop, onDone }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleChange(e) {
    e.preventDefault()
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben'); return }
    setLoading(true)
    setError('')
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ shopId: shop.id, newPassword: password })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Passwort erfolgreich geandert!')
        setPassword('')
        setTimeout(onDone, 2000)
      } else {
        setError(data.error || 'Fehler')
      }
    } catch (e) {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div style={createStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...createStyles.title, margin: 0 }}>Passwort andern: {shop.name}</h2>
          <button onClick={onDone} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>x</button>
        </div>
        {error && <div style={createStyles.error}>{error}</div>}
        {success && <div style={createStyles.success}>{success}</div>}
        <form onSubmit={handleChange} style={createStyles.form}>
          <input style={createStyles.input} type="password" placeholder="Neues Passwort (min. 8 Zeichen)" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={createStyles.btn} type="submit" disabled={loading}>
            {loading ? 'Andert...' : 'Passwort andern'}
          </button>
        </form>
      </div>
  )
}

/**
 * Login-Adresse eines Ladens aendern. Das Backend prueft Form und Dopplung,
 * speichert klein geschrieben und schreibt alt -> neu ins Protokoll.
 */
function ChangeEmail({ shop, onChanged, onDone }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleChange(e) {
    e.preventDefault()
    const neu = email.trim()
    if (!neu) return
    if (!confirm(`Login-Adresse von "${shop.name}" ändern?\n\nAlt: ${shop.email}\nNeu: ${neu.toLowerCase()}\n\nDer Laden loggt sich danach nur noch mit der neuen Adresse ein. Das Passwort bleibt gleich.`)) return
    setLoading(true)
    setError('')
    const t = sessionStorage.getItem('adminToken')
    try {
      const res = await fetch(`${BASE_URL}/api/admin/shops/${shop.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ email: neu })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSuccess(`Geändert. Neue Login-Adresse: ${data.email}`)
        setEmail('')
        onChanged()
        setTimeout(onDone, 2500)
      } else {
        setError(data.error || 'Fehler')
      }
    } catch {
      setError('Server nicht erreichbar')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div style={createStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ ...createStyles.title, margin: 0 }}>E-Mail ändern: {shop.name}</h2>
          <button onClick={onDone} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>x</button>
        </div>
        <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 14 }}>
          Jetzt: <strong>{shop.email}</strong>. Mit dieser Adresse loggt sich der Laden ein, und an sie gehen unsere Mails.
          Das Passwort bleibt gleich. Sag dem Laden Bescheid.
        </div>
        {error && <div style={createStyles.error}>{error}</div>}
        {success && <div style={createStyles.success}>{success}</div>}
        <form onSubmit={handleChange} style={createStyles.form}>
          <input style={createStyles.input} type="email" placeholder="Neue E-Mail-Adresse" value={email}
                 onChange={e => setEmail(e.target.value)} autoComplete="off" required />
          <button style={createStyles.btn} type="submit" disabled={loading}>
            {loading ? 'Ändert …' : 'E-Mail ändern'}
          </button>
        </form>
      </div>
  )
}

/**
 * Protokoll: wann der Betreiber einen Laden geoeffnet oder dessen
 * Login-Adresse geaendert hat. Nur lesen - Eintraege loescht niemand.
 */
function ZugriffProtokoll() {
  const [zeilen, setZeilen] = useState(null)
  useEffect(() => {
    const t = sessionStorage.getItem('adminToken')
    fetch(`${BASE_URL}/api/admin/zugriffe`, { headers: { 'Authorization': `Bearer ${t}` } })
        .then(r => (r.ok ? r.json() : []))
        .then(d => setZeilen(Array.isArray(d) ? d : []))
        .catch(() => setZeilen([]))
  }, [])
  return (
      <div style={{ background: '#FFFFFF', border: '1px solid #DDD9EE', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Zugriffe auf Läden {zeilen ? `(${zeilen.length})` : ''}</div>
        <div style={{ fontSize: 13, color: '#6B6678', marginBottom: 10 }}>
          Jedes „Öffnen“ und jede geänderte Login-Adresse. Die letzten 200 Einträge.
        </div>
        {zeilen === null ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Lädt …</div>
          : zeilen.length === 0 ? <div style={{ fontSize: 13, color: '#9A94A8' }}>Noch keine Zugriffe.</div>
          : (
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {zeilen.map(z => (
                <div key={z.id} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline',
                                         padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 13 }}>
                  <span style={{ fontWeight: 600, minWidth: 140 }}>{z.shopName}</span>
                  <span style={{ color: z.art === 'EMAIL' ? '#3C3489' : '#b35c00' }}>
                    {z.art === 'EMAIL' ? 'E-Mail geändert' : 'Laden geöffnet'}
                  </span>
                  {z.detail && <span style={{ color: '#6B6678' }}>{z.detail}</span>}
                  <span style={{ color: '#9A94A8', marginLeft: 'auto' }}>
                    {new Date(z.zeitpunkt).toLocaleString('de-DE')}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>
  )
}

const createStyles = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title: { fontSize: '18px', fontWeight: '600', margin: '0 0 16px', color: '#1a1a1a' },
  error: { background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  success: { background: '#f0fff4', color: '#2C5F2E', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '14px', outline: 'none' },
  btn: { padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
}

const styles = {
  loginContainer: { minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: 'white', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  loginLogo: { width: '56px', height: '56px', borderRadius: '14px', background: '#3C3489', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', margin: '0 auto 16px' },
  loginTitle: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  loginSubtitle: { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  loginError: { background: '#fff0f0', color: '#c00', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  field: { marginBottom: '16px', textAlign: 'left' },
  label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  btnLogin: { width: '100%', padding: '12px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  container: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  reiterLeiste: { display: 'flex', gap: 4, borderBottom: '1px solid #DDD9EE', marginBottom: 20, overflowX: 'auto', overflowY: 'hidden' },
  reiter: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B6678', whiteSpace: 'nowrap' },
  reiterAktiv: { color: '#3C3489', borderBottomColor: '#3C3489' },
  reiterZahl: { fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: '#F3F1FA', color: '#6B6678' },
  reiterZahlOffen: { background: '#FBF3E2', color: '#7A5200' },
  reiterZahlAktiv: { background: '#3C3489', color: 'white' },
  ordnerLeiste: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 14 },
  ordner: { padding: '6px 12px', borderRadius: 16, border: '1px solid #DDD9EE', background: 'white', cursor: 'pointer', fontSize: 13, color: '#333' },
  ordnerAktiv: { background: '#3C3489', borderColor: '#3C3489', color: 'white' },
  btnNeuerLaden: { marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: 'none', background: '#3C3489', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  ordnerSelect: { fontSize: 11, padding: '1px 4px', borderRadius: 6, border: '1px solid #e4e1ef', background: '#FAF9FD', maxWidth: 160 },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1a4fa0', margin: '28px 0 10px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: 0 },
  btnLogout: { background: '#f0f0f0', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#3C3489' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '4px' },
  table: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' },
  tableHeader: { display: 'grid', gridTemplateColumns: '28px 2fr 2fr 0.6fr 0.8fr 2.4fr 200px', columnGap: '10px', padding: '12px 16px', background: '#f8f8f8', fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '900px' },
  tableRow: { display: 'grid', gridTemplateColumns: '28px 2fr 2fr 0.6fr 0.8fr 2.4fr 200px', columnGap: '10px', padding: '14px 16px', borderTop: '1px solid #f0f0f0', alignItems: 'center', minWidth: '900px' },
  schild: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' },
  verwalten: { padding: '16px 18px 20px', background: '#FAF9FD', borderTop: '1px solid #E4E1EF' },
  verwaltenGruppen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' },
  gruppe: { background: 'white', border: '1px solid #E4E1EF', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column' },
  gruppeTitel: { fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  zeile: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '6px 0', fontSize: '13px' },
  klein: { display: 'block', fontSize: '12px', color: '#6B6678', marginTop: '2px' },
  dragHandle: { cursor: 'grab', color: '#bbb', fontSize: '16px', userSelect: 'none', lineHeight: 1 },
  sortError: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    background: '#fce8e6', color: '#c00', border: '1px solid #f5c6c2',
    borderRadius: '10px', padding: '12px 14px', fontSize: '13px', marginBottom: '12px',
  },
  sortErrorClose: {
    background: 'none', border: 'none', color: '#c00', cursor: 'pointer',
    fontSize: '14px', lineHeight: 1, padding: '0 2px',
  },
  shopName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  shopEmail: { fontSize: '12px', color: '#666' },
  cell: { fontSize: '13px', color: '#666' },
  status: { fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '20px', display: 'inline-block' },
  btnToggle: { flex: 1, border: 'none', borderRadius: '8px', padding: '7px 8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'center' },
}