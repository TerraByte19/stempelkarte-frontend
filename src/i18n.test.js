import { test } from 'node:test'
import assert from 'node:assert/strict'
import { translations } from './i18n.js'

/**
 * Jeder sichtbare Text braucht alle drei Sprachen.
 *
 * Ein fehlender Schluessel faellt beim Build NICHT auf: t() faellt still auf
 * Deutsch zurueck und zeigt sonst den rohen Schluesselnamen. In einem
 * arabischen Laden sieht der Kunde dann "scan_points_book" auf dem
 * Bildschirm, und gemerkt wird es erst, wenn sich jemand beschwert.
 *
 * Deutsch ist die Referenz, weil dort neue Texte zuerst entstehen.
 */

const REFERENZ = 'de'

test('en hat jeden deutschen Schluessel', () => {
  const fehlt = Object.keys(translations[REFERENZ])
    .filter(k => !(k in translations.en))
  assert.deepEqual(fehlt, [], `fehlende en-Schluessel: ${fehlt.join(', ')}`)
})

test('ar hat jeden deutschen Schluessel', () => {
  const fehlt = Object.keys(translations[REFERENZ])
    .filter(k => !(k in translations.ar))
  assert.deepEqual(fehlt, [], `fehlende ar-Schluessel: ${fehlt.join(', ')}`)
})

test('kein Schluessel ohne deutsches Gegenstueck', () => {
  // Andersherum ebenfalls: ein Schluessel, den es nur auf Englisch gibt,
  // ist meistens ein Tippfehler im deutschen Block.
  for (const lang of ['en', 'ar']) {
    const ueberzaehlig = Object.keys(translations[lang])
      .filter(k => !(k in translations[REFERENZ]))
    assert.deepEqual(ueberzaehlig, [],
      `${lang} hat Schluessel ohne de-Gegenstueck: ${ueberzaehlig.join(', ')}`)
  }
})

test('kein Text ist leer', () => {
  for (const [lang, texte] of Object.entries(translations)) {
    for (const [key, wert] of Object.entries(texte)) {
      assert.ok(typeof wert === 'string' && wert.trim() !== '',
        `${lang}.${key} ist leer`)
    }
  }
})

/**
 * Altlast, bewusst geduldet.
 *
 * Diese fuenf Texte tragen seit jeher einen Geviertstrich. Sie hier
 * aufzulisten statt sie stillschweigend umzuschreiben, hat einen Grund:
 * es sind ausgelieferte Texte, die Kunden und Laeden taeglich sehen, und
 * Satzzeichen in Produkttexten ungefragt zu aendern ist keine Aufraeumarbeit,
 * sondern eine Produktentscheidung. Wer sie angeht, streicht den Schluessel
 * hier - der Test faengt ihn dann ab, falls der Strich zurueckkommt.
 */
const ALTLAST_GEVIERTSTRICH = new Set([
  'dash_no_cards', 'cards_empty', 'scan_redeemed_sub',
  'scan_almost', 'stat_no_history',
])

test('keine neuen Geviertstriche in Nutzertexten', () => {
  // Hausregel aus der CLAUDE.md: normale Bindestriche. Der Geviertstrich
  // rutscht beim Schreiben leicht durch und faellt niemandem auf, bis er
  // in einer Mail oder auf einer Wallet-Karte steht.
  const treffer = []
  for (const [lang, texte] of Object.entries(translations)) {
    for (const [key, wert] of Object.entries(texte)) {
      if (ALTLAST_GEVIERTSTRICH.has(key)) continue
      if (wert.includes('—')) treffer.push(`${lang}.${key}`)
    }
  }
  assert.deepEqual(treffer, [], `Geviertstrich in: ${treffer.join(', ')}`)
})

test('die Altlast-Liste ist nicht laenger noetig als sie muss', () => {
  // Faellt ein Text von der Liste weg, weil ihn jemand bereinigt hat, soll
  // das auffallen - sonst waechst die Liste zu und niemand raeumt je auf.
  for (const key of ALTLAST_GEVIERTSTRICH) {
    assert.ok(translations.de[key]?.includes('—'),
      `${key} traegt keinen Geviertstrich mehr - bitte aus ALTLAST_GEVIERTSTRICH streichen`)
  }
})
