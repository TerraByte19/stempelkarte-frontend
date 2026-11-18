import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leseSchleife } from './leseSchleife.js'

/**
 * Nagelt fest: ein Herausforderer-Leser liest erst, wenn bereit() ja sagt,
 * und liest weiter, wenn sein Treffer verworfen wurde.
 *
 * Vorher las er sofort nach resume(). Im Video stand da noch das
 * eingefrorene Bild mit dem QR-Code des Kunden davor - und der bekam den
 * Stempel des naechsten Kunden (Meldung aus einem Laden, 18.11.2026).
 */

const VORHER = 'SK:CC-75F92881'
const NEU = 'SK:CC-6D58886B'

// Kamera im Takt der Leseschleife: die ersten `alteTakte` Durchlaeufe zeigt
// sie das eingefrorene Bild (QR des Kunden davor), danach das neue.
function kamera({ alteTakte, maxTakte = 20 }) {
  let takt = 0
  return {
    get takt() { return takt },
    lesen: async () => (takt < alteTakte ? VORHER : NEU),
    warte: async () => { takt++ },
    lebt: () => takt < maxTakte,
  }
}

test('liest das eingefrorene Bild nicht, solange der Scanner noch nicht wieder scannt', async () => {
  const k = kamera({ alteTakte: 3 })
  const treffer = []
  await leseSchleife({
    lesen: k.lesen, warte: k.warte, lebt: k.lebt,
    bereit: () => k.takt >= 3,
    onTreffer: t => { treffer.push(t) },
  })
  assert.deepEqual(treffer, [NEU])
})

test('verworfener Treffer: weiterlesen, bis ein anderer Code kommt', async () => {
  const k = kamera({ alteTakte: 4 })
  const gesehen = []
  await leseSchleife({
    lesen: k.lesen, warte: k.warte, lebt: k.lebt,
    bereit: () => true,
    onTreffer: t => { gesehen.push(t); return t !== VORHER },
  })
  assert.deepEqual(gesehen, [VORHER, VORHER, VORHER, VORHER, NEU])
})

test('angenommener Treffer beendet die Schleife', async () => {
  const k = kamera({ alteTakte: 0 })
  let aufrufe = 0
  await leseSchleife({
    lesen: k.lesen, warte: k.warte, lebt: k.lebt,
    bereit: () => true,
    onTreffer: () => { aufrufe++ },
  })
  assert.equal(aufrufe, 1)
})

test('nach stop() kommt kein Treffer mehr, auch wenn das Lesen noch lief', async () => {
  let lebt = true
  let aufrufe = 0
  await leseSchleife({
    // stop() kommt, waehrend detect() noch rechnet
    lesen: async () => { lebt = false; return NEU },
    warte: async () => {},
    lebt: () => lebt,
    bereit: () => true,
    onTreffer: () => { aufrufe++ },
  })
  assert.equal(aufrufe, 0)
})
