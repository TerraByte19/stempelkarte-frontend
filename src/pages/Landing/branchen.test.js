import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Branchenseiten-Texte: jede Sprache, die es gibt, ist vollstaendig. Eine
 * fehlende Sprache faellt auf Deutsch zurueck, ein fehlendes Feld in einer
 * vorhandenen Sprache waere dagegen ein Loch auf der Seite.
 */
const daten = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'branchen.json'), 'utf8'))
const SPRACHEN = ['de', 'en', 'ar', 'tr']

function felder(obj, pfad = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = pfad ? `${pfad}.${k}` : k
    if (Array.isArray(v)) v.forEach((e, i) => out.push(...felder(e, `${p}[${i}]`)))
    else if (v && typeof v === 'object') out.push(...felder(v, p))
    else out.push([p, v])
  }
  return out
}

test('Deutsch ist vollstaendig und die Vorlage fuer alle anderen Sprachen', () => {
  assert.ok(daten.labels.de && daten.branchen.length >= 4)
  const labelPfade = felder(daten.labels.de).map(([p]) => p)
  for (const lang of SPRACHEN) {
    if (!daten.labels[lang]) continue
    assert.deepEqual(felder(daten.labels[lang]).map(([p]) => p), labelPfade, `labels.${lang}`)
  }
  for (const b of daten.branchen) {
    const pfade = felder(b.de).map(([p]) => p)
    for (const lang of SPRACHEN) {
      if (!b[lang]) continue
      assert.deepEqual(felder(b[lang]).map(([p]) => p), pfade, `${b.slug}.${lang}`)
      for (const [p, v] of felder(b[lang])) {
        assert.ok(typeof v === 'string' && v.trim(), `${b.slug}.${lang}.${p} ist leer`)
        assert.ok(!v.includes('—'), `${b.slug}.${lang}.${p} hat einen Geviertstrich`)
      }
    }
  }
})

test('Slugs sind eindeutig und URL-tauglich', () => {
  const slugs = daten.branchen.map(b => b.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const s of slugs) assert.match(s, /^[a-z0-9-]+$/)
})
