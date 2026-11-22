import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rolleAusToken, istFiliale, FILIALE_SEITEN, zeitraum } from './rolle.js'

function token(payload) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.unterschrift`
}

test('Unterkonto wird am Token erkannt', () => {
  assert.equal(rolleAusToken(token({ sub: 'FZ-1', role: 'FILIALE', shop: 'SHOP-1', ver: 0 })), 'FILIALE')
  assert.equal(istFiliale(token({ sub: 'FZ-1', role: 'FILIALE' })), true)
})

test('Inhaber und Support-Zugang sind kein Unterkonto', () => {
  assert.equal(rolleAusToken(token({ sub: 'SHOP-1', role: 'SHOP' })), 'SHOP')
  assert.equal(istFiliale(token({ sub: 'SHOP-1', role: 'SHOP', support: true })), false)
})

test('kaputter, fehlender oder fremder Token ist niemand', () => {
  for (const t of [null, undefined, '', 'abc', 'a.b', 'a.b.c', token({ sub: 'x' }), token({ role: 'ADMIN' })]) {
    assert.equal(rolleAusToken(t), null)
    assert.equal(istFiliale(t), false)
  }
})

test('Menue des Unterkontos: nur Scanner, Statistik, Geraete, Korrektur', () => {
  assert.deepEqual(FILIALE_SEITEN.map(s => s.to), ['/scanner', '/', '/geraete', '/korrektur'])
  const verboten = ['/karten', '/kunden', '/nachrichten', '/team', '/profil', '/statistik']
  for (const s of FILIALE_SEITEN) assert.ok(!verboten.includes(s.to), s.to)
})

test('Zeitraum: beide Tage zaehlen mit', () => {
  const heute = new Date(2026, 10, 22)   // 22.11.2026 Ortszeit
  assert.deepEqual(zeitraum(1, heute), { von: '2026-11-22', bis: '2026-11-22' })
  assert.deepEqual(zeitraum(7, heute), { von: '2026-11-16', bis: '2026-11-22' })
  assert.deepEqual(zeitraum(30, heute), { von: '2026-10-24', bis: '2026-11-22' })
  assert.deepEqual(zeitraum(0, heute), { von: '2026-11-22', bis: '2026-11-22' })
})
