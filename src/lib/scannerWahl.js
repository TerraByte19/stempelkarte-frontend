/**
 * Welcher Scanner ist auf DIESEM Geraet der schnellste? Reine Logik,
 * ohne Browser - deshalb mit node:test pruefbar.
 *
 * Beim normalen Stempeln liest neben dem heutigen Scanner ("alt", der
 * stempelt) immer genau ein Herausforderer still mit: "neu" (ZXing),
 * "nimiq" oder "handy" (eingebauter Leser, nur Android). Pro Stempel eine
 * Runde: wer hat wann getroffen. Die Herausforderer kommen im Wechsel dran,
 * damit das Handy nicht drei Leser gleichzeitig rechnen muss.
 *
 * Entschieden wird je Herausforderer erst ab MINDESTENS Runden, und nur,
 * wenn er in mindestens ANTEIL der Runden zuerst getroffen hat und im
 * Mittel um VORSPRUNG_MS schneller war. Dann bleibt er auf diesem Geraet
 * dauerhaft an (der erste Treffer gewinnt, egal von wem). Weiter gemessen
 * wird trotzdem, in jeder PRUEF_TAKT-ten Runde - zeigt sich das Gegenteil,
 * geht es zurueck.
 */

export const MINDESTENS = 30
export const ANTEIL = 0.8
export const VORSPRUNG_MS = 150
export const MAX_RUNDEN = 90
export const PRUEF_TAKT = 5
export const HERAUSFORDERER = ['neu', 'nimiq', 'handy']
export const SCHLUESSEL = 'scannerWahl'

export function leererStand() {
  return { aktiv: null, runden: [], gewechseltAm: null, manuell: null }
}

export function lade(storage) {
  try {
    const roh = storage?.getItem(SCHLUESSEL)
    if (!roh) return leererStand()
    const s = JSON.parse(roh)
    if (!s || !Array.isArray(s.runden)) return leererStand()
    return { ...leererStand(), ...s }
  } catch {
    return leererStand()
  }
}

export function speichere(storage, stand) {
  try { storage?.setItem(SCHLUESSEL, JSON.stringify(stand)) } catch { /* voll oder gesperrt */ }
}

/** Welcher Herausforderer ist in der naechsten Runde dran? */
export function naechsterGegner(stand, verfuegbar = HERAUSFORDERER) {
  const kandidaten = HERAUSFORDERER.filter(h => verfuegbar.includes(h))
  if (kandidaten.length === 0) return null
  // Immer der mit den wenigsten Runden, bei Gleichstand der Reihe nach.
  const zaehler = Object.fromEntries(kandidaten.map(k => [k, 0]))
  for (const r of stand.runden) if (r.gegner in zaehler) zaehler[r.gegner]++
  return kandidaten.reduce((best, k) => (zaehler[k] < zaehler[best] ? k : best), kandidaten[0])
}

/**
 * Laeuft in dieser Runde ein Herausforderer mit? Vor der Entscheidung
 * immer, danach nur jede PRUEF_TAKT-te Runde (der Gewinner laeuft sowieso).
 */
export function messenJetzt(stand) {
  if (stand.manuell) return false
  if (!stand.aktiv) return true
  return stand.runden.length % PRUEF_TAKT === 0
}

/** Eine Runde eintragen: alt = ms bis der heutige Scanner traf, gegnerMs = ms des Herausforderers (null = nicht getroffen). */
export function rundeHinzu(stand, runde) {
  const runden = [...stand.runden, { t: runde.t ?? Date.now(), gegner: runde.gegner, alt: runde.alt ?? null, gegnerMs: runde.gegnerMs ?? null }]
  while (runden.length > MAX_RUNDEN) runden.shift()
  return entscheide({ ...stand, runden })
}

function median(werte) {
  if (werte.length === 0) return null
  const s = [...werte].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Auswertung je Herausforderer ueber alle gespeicherten Runden. */
export function auswerten(runden) {
  const out = {}
  for (const h of HERAUSFORDERER) {
    const eigene = runden.filter(r => r.gegner === h && typeof r.alt === 'number')
    const zuerst = eigene.filter(r => typeof r.gegnerMs === 'number' && r.gegnerMs < r.alt)
    const vorspruenge = eigene.map(r => (typeof r.gegnerMs === 'number' ? r.alt - r.gegnerMs : -VORSPRUNG_MS * 4))
    out[h] = {
      n: eigene.length,
      zuerst: zuerst.length,
      anteil: eigene.length ? zuerst.length / eigene.length : 0,
      vorsprungMs: median(vorspruenge),
      verfehlt: eigene.filter(r => r.gegnerMs == null).length,
    }
  }
  return out
}

/** Gewinner bestimmen: der beste Herausforderer, der die Huerde nimmt, sonst null (= heutiger Scanner). */
export function entscheide(stand) {
  if (stand.manuell) return stand
  const wertung = auswerten(stand.runden)
  let bester = null
  for (const h of HERAUSFORDERER) {
    const w = wertung[h]
    if (w.n < MINDESTENS || w.anteil < ANTEIL || w.vorsprungMs == null || w.vorsprungMs < VORSPRUNG_MS) continue
    if (!bester || w.vorsprungMs > wertung[bester].vorsprungMs) bester = h
  }
  if (bester === stand.aktiv) return stand
  return { ...stand, aktiv: bester, gewechseltAm: bester ? Date.now() : null }
}

/** Kurztext fuer die Scanner-Seite, z. B. "B 12/30 · C 9/30" oder "B aktiv (87 %)". */
export function statusText(stand, buchstaben = { neu: 'B', nimiq: 'C', handy: 'D' }) {
  const w = auswerten(stand.runden)
  if (stand.manuell) return `${buchstaben[stand.manuell] || 'A'} (manuell)`
  if (stand.aktiv) return `${buchstaben[stand.aktiv]} aktiv (${Math.round(w[stand.aktiv].anteil * 100)} %)`
  return HERAUSFORDERER.filter(h => w[h].n > 0 || true)
      .map(h => `${buchstaben[h]} ${Math.min(w[h].n, MINDESTENS)}/${MINDESTENS}`)
      .join(' · ')
}
