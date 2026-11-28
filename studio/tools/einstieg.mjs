#!/usr/bin/env node
// einstieg.mjs - misst die ersten drei Sekunden eines gebauten Videos (HOOKS.md 1.7.4).
//
// Warum: Alle vier Videos bis zum 18.11.2026 begannen mit 0,10 bis 0,30 s
// digitaler Stille, im Doener-Video kam der erste Ton erst bei 1,51 s. In der
// Jury-Runde vom 17.11.2026 bekam derselbe erste Satz als stilles Bild 4,50
// Punkte, mit Bewegung und Ton 5,83. Der Lauf soll deshalb bei 0,00 s einen
// Ton haben, bis 0,5 s eine Bewegung und bis 3 s (im Entwurf 4 s) einen
// Bildwechsel. Das sieht man am Standbild nicht sicher; der Bericht des
// Studios hat die Zeiten.
//
// Bewusst ein eigenes Werkzeug und keine Pruefung in engine/checks.mjs: eine
// neue Warnung dort haette jedes alte Video und die Vorlage getroffen (die
// Vorlage und das zweite Video muessen im Selbsttest ohne Warnung bauen), und
// es liest nur, was ohnehin im Bericht steht. Kein Netz, keine Kosten.
//
// Aufruf: node studio/tools/einstieg.mjs <ordner>/out/check.json   (oder out/report.json)
// Ausgabe: JSON { modus, erster_ton_s, erste_bewegung_s, erster_bildwechsel_s,
//                 tafel_woerter, grenzen, verletzt }
// Ende-Code: 0 alles in den Grenzen, 1 mindestens eine Grenze verletzt
// (verletzt nennt sie mit Abhilfe), 2 Datei fehlt oder ist kein Bericht.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Grenzen aus HOOKS.md 1.7.4. Im Entwurf ohne Stimme sind alle Zeiten
// geschaetzt und rund ein Drittel zu lang (AUTOMATIK.md Schritt 16), daher
// dort 4 s fuer den ersten Bildwechsel statt 3 s.
export const GRENZEN = { ton: 0.05, bewegung: 0.5, bildwechselStimme: 3, bildwechselEntwurf: 4, tafelWoerter: 8 }

const erster = a => a.length ? +Math.min(...a).toFixed(2) : null

/**
 * r: Bericht des Studios (out/check.json, out/report.json) oder der Zustand der Seite
 * ({ cues, anchors, pictures, caps }). stimme: echte Wort-Zeiten (sonst aus r.voice).
 */
export function ersteSekunden(r, { stimme } = {}) {
  const cues = (r.cues || []).filter(c => typeof c.t === 'number' && c.t >= 0)
  const anchors = (r.anchors || []).filter(a => a.scene === 1 && typeof a.t === 'number' && a.t >= 0)
  const pictures = (r.pictures || []).filter(p => typeof p.t === 'number')
  const caps = r.captions || r.caps || []
  const mitStimme = stimme != null ? !!stimme : !!r.voice
  // Bewegung: ein Anker der ersten Szene, ein Ton eines Bausteins dort (er sitzt immer auf einer
  // Bewegung) oder eine Kamera. Klaenge aus der Bibliothek ("lib") zaehlen nicht: ein Ortsklang
  // bei 0 s bewegt nichts im Bild.
  const bewegung = erster([...anchors.map(a => a.t), ...cues.filter(c => c.scene === 1 && !c.lib).map(c => c.t), ...pictures.filter(p => p.scene === 1).map(p => p.t)])
  const ton = erster(cues.map(c => c.t))
  // Eine Kamera in den ersten 0,05 s eines Teils zaehlt das Studio ohnehin nicht als Bildwechsel.
  const bildwechsel = erster(pictures.map(p => p.t).filter(t => t > 0.05))
  const c0 = caps[0] || {}
  const tafel = typeof c0.words === 'number' ? c0.words : String(c0.text || '').split(/\s+/).filter(Boolean).length
  const grenzeBild = mitStimme ? GRENZEN.bildwechselStimme : GRENZEN.bildwechselEntwurf
  const verletzt = []
  if (ton == null || ton > GRENZEN.ton) verletzt.push(`erster Ton erst bei ${ton == null ? '-' : ton} s (höchstens ${GRENZEN.ton}): Ortsklang mit "sounds" am ersten Teil auf { "at": "start", "offset": 0 } (HOOKS.md 1.7.5)`)
  if (bewegung == null || bewegung > GRENZEN.bewegung) verletzt.push(`erste Bewegung erst bei ${bewegung == null ? '-' : bewegung} s (höchstens ${GRENZEN.bewegung}): Anker des Einstiegs nach HOOKS.md 1.7.3`)
  if (bildwechsel == null || bildwechsel > grenzeBild) verletzt.push(`erster Bildwechsel erst bei ${bildwechsel == null ? '-' : bildwechsel} s (höchstens ${grenzeBild}): Kamera nach AUTOMATIK.md 6.3 oder Schnitt auf das erste Wort der zweiten Textzeile`)
  if (tafel > GRENZEN.tafelWoerter) verletzt.push(`erste Tafel hat ${tafel} Wörter (höchstens ${GRENZEN.tafelWoerter}, HOOKS.md 1.4)`)
  return {
    modus: r.mode || (mitStimme ? 'voice' : 'entwurf'), erster_ton_s: ton, erste_bewegung_s: bewegung, erster_bildwechsel_s: bildwechsel, tafel_woerter: tafel,
    grenzen: { ton: GRENZEN.ton, bewegung: GRENZEN.bewegung, bildwechsel: grenzeBild, tafel_woerter: GRENZEN.tafelWoerter }, verletzt
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const datei = process.argv[2]
  if (!datei) { console.error('Aufruf: node studio/tools/einstieg.mjs <ordner>/out/check.json'); process.exit(2) }
  let r
  try { r = JSON.parse(readFileSync(datei, 'utf8')) } catch (e) { console.error(`${datei}: ${e.message}`); process.exit(2) }
  if (!Array.isArray(r.cues) || !Array.isArray(r.anchors)) { console.error(`${datei}: kein Bericht des Studios (cues und anchors fehlen)`); process.exit(2) }
  const e = ersteSekunden(r)
  console.log(JSON.stringify(e, null, 1))
  process.exit(e.verletzt.length ? 1 : 0)
}
