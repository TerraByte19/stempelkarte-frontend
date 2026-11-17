// Oeffnet die Studio-Seite in Chromium (Playwright) und macht Bilder daraus.
// Ein eigener kleiner Server statt file://, weil lokale Schriften und
// ES-Module ueber file:// nicht zuverlaessig laden. Es wird nichts aus dem
// Netz geholt: Schriften, Bausteine und Daten kommen alle von hier.
import { createRequire } from 'node:module'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { STAGE } from './script.mjs'

const require = createRequire(import.meta.url)
export const STUDIO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }

/** Startet Server und Browser fuer EIN Video (data = { script, times }). */
export async function openStudio(data) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x')
      if (url.pathname === '/__video/data.json') {
        res.writeHead(200, { 'content-type': TYPES['.json'] })
        return res.end(JSON.stringify({ ...data, rest: url.searchParams.get('rest') === '1' }))
      }
      const rel = url.pathname === '/' ? '/engine/page.html' : decodeURIComponent(url.pathname)
      const p = path.join(STUDIO_ROOT, rel)
      // nur engine/ und components/ ausliefern, nichts ausserhalb des Studios; aus sounds/ nur die
      // Liste der Klaenge (die Seite prueft daran die Namen im Skript, die Klaenge selbst mischt sfx.py)
      if (!(/^\/(engine|components)\//.test(rel) || rel === '/sounds/sounds.json') || !p.startsWith(STUDIO_ROOT + path.sep)) { res.writeHead(403); return res.end() }
      // Erst lesen, dann antworten: fehlt die Datei (falscher Baustein-Name), gibt es ein
      // sauberes 404 und die Seite meldet "Baustein laesst sich nicht laden", statt dass
      // der Server mit "headers already sent" abstuerzt.
      const body = await readFile(p)
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' })
      res.end(body)
    } catch { if (!res.headersSent) res.writeHead(404); res.end() }
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/`
  const { chromium } = require('playwright')
  const browser = await chromium.launch()
  const problems = [] // Seitenfehler aller Seiten dieses Videos

  /** Eine fertig aufgebaute Seite. rest = Ruhelage ohne Animationen (fuer die Pruefungen). */
  async function page({ rest = false } = {}) {
    const pg = await browser.newPage({ viewport: { width: STAGE.w, height: STAGE.h }, deviceScaleFactor: 1 })
    pg.on('pageerror', e => problems.push('Seitenfehler: ' + e.message))
    pg.on('console', m => { if (m.type() === 'error') problems.push('Konsole: ' + m.text()) })
    pg.on('requestfailed', r => problems.push(`Laden fehlgeschlagen: ${r.url()} (${r.failure() && r.failure().errorText})`))
    pg.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`) })
    await pg.goto(base + (rest ? '?rest=1' : ''))
    await pg.waitForFunction(() => window.STUDIO && window.STUDIO.ready, null, { timeout: 30000 })
    return pg
  }
  /** Was die Seite ueber sich weiss: Laenge, Szenen, Texte, Toene, Anker, Fehler. */
  const state = pg => pg.evaluate(() => { const { measure, probe, ...rest } = window.STUDIO; return { ...rest, cuesFile: window.CUES || null } })
  const close = async () => { await browser.close(); await new Promise(r => server.close(r)) }
  return { page, state, close, problems }
}

/**
 * Stellt die Seite auf den Zeitpunkt t und wartet zwei Bildwechsel ab.
 * Warum warten: Chromium zeichnet eine Ebene, die gerade skaliert wird (die
 * Kamerafahrt), erst einen Bildwechsel spaeter in der genauen Groesse neu.
 * Ohne die Wartezeit erwischt das Foto unter Last mal die alte, mal die neue
 * Zeichnung. Der Unterschied ist winzig (ueber 60 dB), aber zwei Laeufe
 * ergaben nicht dieselben Bilder. Mit Wartezeit sind sie gleich.
 */
export const seek = (pg, t) => pg.evaluate(t => new Promise(r => { window.seek(t); requestAnimationFrame(() => requestAnimationFrame(r)) }), t)

/**
 * Geht das Video in kleinen Schritten durch und fragt die Seite jedes Mal, wo
 * die sichtbaren wichtigen Elemente gerade sitzen (STUDIO.probe). Ohne Fotos,
 * deshalb in ein bis zwei Sekunden fertig. Ergebnis je Element: von wann bis
 * wann es zu sehen war und wie weit es dabei in jede Richtung reichte, dazu
 * dasselbe nur fuer den Bereich, den `band` beschreibt.
 */
export async function sampleMotion(pg, duration, { step = 0.25, band = null } = {}) {
  const seen = new Map()
  for (let t = 0; t < duration; t = +(t + step).toFixed(3)) {
    // ohne zu zeichnen: die Probe braucht nur Positionen, ein 3D-Baustein braucht je Bild ueber eine Sekunde
    const items = await pg.evaluate(t => { window.seek(t, { paint: false }); return window.STUDIO.probe() }, t)
    for (const it of items) {
      if (band && !(it.right > band.left && it.bottom > band.top && it.top < band.bottom)) continue
      const k = it.scene + '|' + it.what, o = seen.get(k) || { scene: it.scene, what: it.what, from: t, to: t, right: it.right, top: it.top, bottom: it.bottom }
      o.to = t; o.right = Math.max(o.right, it.right); o.top = Math.min(o.top, it.top); o.bottom = Math.max(o.bottom, it.bottom)
      seen.set(k, o)
    }
  }
  await pg.evaluate(() => window.seek(0, { paint: false }))
  return [...seen.values()]
}

/** Ein Standbild als PNG. */
export async function still(pg, t, file) {
  await seek(pg, t)
  return pg.screenshot(file ? { path: file } : {})
}

/**
 * Rendert alle Bilder als JPEG und reicht sie der Reihe nach an ffmpeg
 * (libx264, crf 16, yuv420p). Mehrere Seiten rechnen gleichzeitig, geschrieben
 * wird aber streng in Reihenfolge - das Ergebnis haengt nicht von der Zahl
 * der Seiten ab. onFrame(i, jpeg) bekommt jedes Bild (fuer die Uebersicht).
 */
export async function renderVideo(pages, { duration, fps, out, onFrame, log = () => {} }) {
  const n = Math.round(duration * fps)
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((res, rej) => { ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg beendet mit Code ' + c))); ff.on('error', rej) })
  const shot = async (pg, i) => { await seek(pg, i / fps); return pg.screenshot({ type: 'jpeg', quality: 95 }) }
  for (let i = 0; i < n; i += pages.length) {
    const bufs = await Promise.all(pages.map((pg, j) => i + j < n ? shot(pg, i + j) : null))
    for (const [j, buf] of bufs.entries()) {
      if (!buf) continue
      if (onFrame) await onFrame(i + j, buf)
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
    }
    if (Math.floor(i / 150) !== Math.floor((i - pages.length) / 150)) log(`Bild ${i}/${n}`)
  }
  ff.stdin.end(); await done
  return n
}

// Welches python3 die Werkzeuge nehmen. Im ersten unbeaufsichtigten Lauf
// (17.11.2026) zeigte "python3" auf ein Python 3.11 ohne Pillow, der Bau brach
// beim Kontaktbogen ab; /usr/bin/python3 (3.13) hatte alles. Deshalb wird
// einmal geprueft, welches Python numpy und PIL laden kann, und dieses fuer
// jeden Aufruf von "python3" benutzt. STUDIO_PYTHON setzt es von Hand.
let PYTHON = null
function python() {
  if (PYTHON) return PYTHON
  const kandidaten = [process.env.STUDIO_PYTHON, 'python3', '/usr/bin/python3', 'python3.13', 'python3.12'].filter(Boolean)
  for (const k of kandidaten) {
    try {
      const r = spawnSync(k, ['-c', 'import numpy, PIL'], { stdio: 'ignore' })
      if (r.status === 0) return (PYTHON = k)
    } catch (e) { /* naechster Kandidat */ }
  }
  return (PYTHON = 'python3') // keiner taugt: der Fehler des Werkzeugs sagt dann, was fehlt
}

export function run(cmd, args, opts = {}) {
  if (cmd === 'python3') cmd = python()
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], ...opts }); let out = '', err = ''
    p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d)
    p.on('error', rej); p.on('close', code => res({ code, out, err }))
    if (opts.input != null) p.stdin.end(opts.input); else p.stdin.end()
  })
}
