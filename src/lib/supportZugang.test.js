import { test } from 'node:test'
import assert from 'node:assert/strict'
import { supportAusToken, supportStarten, supportBeenden, uhrzeit } from './supportZugang.js'

// Token wie vom Backend: kopf.inhalt.unterschrift, base64url ohne Auffuellung.
function token(inhalt) {
  const b64 = o => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256' })}.${b64(inhalt)}.unterschrift`
}

function speicher(start = {}) {
  const daten = { ...start }
  return {
    daten,
    setItem: (k, v) => { daten[k] = String(v) },
    getItem: k => (k in daten ? daten[k] : null),
    removeItem: k => { delete daten[k] },
  }
}

const JETZT = 1_800_000_000_000
const IN_EINER_STUNDE = JETZT / 1000 + 3600

test('Support-Token wird erkannt, mit Ablaufzeit', () => {
  const t = token({ sub: 'SHOP-1', role: 'SHOP', support: true, exp: IN_EINER_STUNDE })
  assert.deepEqual(supportAusToken(t, JETZT), { bis: JETZT + 3_600_000 })
})

test('Normaler Laden-Token zeigt keinen Balken', () => {
  const t = token({ sub: 'SHOP-1', role: 'SHOP', email: 'a@b.de', exp: IN_EINER_STUNDE })
  assert.equal(supportAusToken(t, JETZT), null)
})

test('Nur echtes true zaehlt als Markierung', () => {
  for (const support of ['true', 1, 'ja', null]) {
    assert.equal(supportAusToken(token({ support, exp: IN_EINER_STUNDE }), JETZT), null)
  }
})

test('Abgelaufener Support-Token zeigt keinen Balken', () => {
  const t = token({ support: true, exp: JETZT / 1000 - 1 })
  assert.equal(supportAusToken(t, JETZT), null)
})

test('Kaputte Tokens werfen nicht', () => {
  for (const kaputt of [null, undefined, '', 'undefined', 'a.b', 'a.b.c', 'a.%%%.c', 42, token('text')]) {
    assert.equal(supportAusToken(kaputt, JETZT), null)
  }
})

test('Ladenname mit Umlaut im Token stoert nicht', () => {
  const t = token({ support: true, exp: IN_EINER_STUNDE, name: 'Café Müller' })
  assert.deepEqual(supportAusToken(t, JETZT), { bis: JETZT + 3_600_000 })
})

test('Starten legt Token und Laden ab und entfernt fremden Mitarbeiter-Token', () => {
  const s = speicher({ token: 'alt', staffToken: 'FREMDER-LADEN', staffTokenLabel: 'Kasse 1', sprache: 'de' })
  supportStarten(s, { token: 'neu', shopId: 'SHOP-9', name: 'Café Mond' })
  assert.deepEqual(s.daten, {
    token: 'neu',
    shop: JSON.stringify({ id: 'SHOP-9', name: 'Café Mond' }),
    sprache: 'de',
  })
})

test('Starten ohne Token laesst den Speicher unberuehrt', () => {
  const s = speicher({ token: 'alt', staffToken: 'X' })
  assert.throws(() => supportStarten(s, { shopId: 'SHOP-9' }))
  assert.throws(() => supportStarten(s, { token: 'neu' }))
  assert.throws(() => supportStarten(s, null))
  assert.deepEqual(s.daten, { token: 'alt', staffToken: 'X' })
})

test('Beenden raeumt alles vom Laden weg, den Rest nicht', () => {
  const s = speicher({ token: 't', shop: '{}', staffToken: 'x', staffTokenLabel: 'y', sprache: 'tr' })
  supportBeenden(s)
  assert.deepEqual(s.daten, { sprache: 'tr' })
})

test('Uhrzeit zweistellig', () => {
  assert.equal(uhrzeit(new Date(2026, 10, 10, 9, 5).getTime()), '09:05')
  assert.equal(uhrzeit(new Date(2026, 10, 10, 14, 30).getTime()), '14:30')
})
