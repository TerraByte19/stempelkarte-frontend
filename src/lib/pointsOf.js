/**
 * Umrechnung Einkaufsbetrag nach Punkten - dieselbe Rechnung wie PointsMath
 * im Backend.
 *
 * Doppelt gerechnet wird sie, damit der Scanner LIVE zeigen kann, was eine
 * Buchung ergibt, bevor das Personal bestaetigt. Ohne Vorschau merkt man
 * den Vertipper erst hinterher.
 *
 * Alle Punktwerte sind Hundertstel: 520 bedeutet 5,20 Punkte. Kein
 * Gleitkomma an keiner Stelle - sonst steht irgendwann 5,199999 auf dem
 * Bildschirm.
 */

export const MAX_AMOUNT_CENTS = 9_999_999

/**
 * @param {number} amountCents Betrag in Cent, Vorzeichen erlaubt
 * @param {number} pointsPerEuroX100 Punkte pro Euro, mal 100
 * @param {string} rounding 'GENAU' | 'ABRUNDEN' | 'KAUFMAENNISCH'
 * @returns {number} Punkte mal 100
 */
export function punkteFuer(amountCents, pointsPerEuroX100, rounding) {
  // Auf dem Betrag OHNE Vorzeichen rechnen und es am Ende zuruecksetzen:
  // Math.trunc schneidet Richtung Null ab, damit wuerde -5,70 kaufmaennisch
  // faelschlich auf -5 statt -6 runden und sich anders verhalten als die
  // Buchung, die es zuruecknimmt.
  const vorzeichen = amountCents < 0 ? -1 : 1
  const betrag = Math.abs(amountCents)

  // Zaehler traegt zwei Stellen mehr als das Ergebnis.
  const zaehler = betrag * pointsPerEuroX100

  let ergebnis
  if (rounding === 'ABRUNDEN') {
    ergebnis = Math.trunc(zaehler / 10000) * 100
  } else if (rounding === 'KAUFMAENNISCH') {
    ergebnis = Math.trunc((zaehler + 5000) / 10000) * 100
  } else {
    ergebnis = Math.trunc((zaehler + 50) / 100)
  }

  return vorzeichen * ergebnis
}

/** 520 wird "5,2", 2600 wird "26", 104 wird "1,04". Komma, weil die
 *  Oberflaeche deutsch und arabisch ist und beide es so setzen. */
export function formatierePunkte(pointsX100) {
  const ganz = Math.trunc(pointsX100 / 100)
  const rest = Math.abs(pointsX100 % 100)
  if (rest === 0) return String(ganz)
  const nachkomma = rest % 10 === 0
    ? String(rest / 10)
    : (rest < 10 ? '0' + rest : String(rest))
  return ganz + ',' + nachkomma
}

/**
 * Liest das Betragsfeld. Gibt null, wenn nichts Brauchbares drinsteht -
 * daran haengt, ob der Buchen-Knopf ueberhaupt gedrueckt werden kann.
 *
 * Komma und Punkt gelten beide: auf der Zahlentastatur eines iPhones liegt
 * je nach Sprache mal das eine, mal das andere.
 */
export function centsAusEingabe(text) {
  if (typeof text !== 'string') return null
  const sauber = text.trim().replace(',', '.')
  if (sauber === '') return null
  if (!/^\d+(\.\d*)?$/.test(sauber)) return null

  const [ganz, nach = ''] = sauber.split('.')
  // Auf zwei Stellen abschneiden, nicht runden: 1,239 Euro sind 1,23 Euro,
  // keine 1,24 - der Kassenbon rundet auch nicht nach oben.
  const cents = Number(ganz) * 100 + Number((nach + '00').slice(0, 2))
  if (!Number.isFinite(cents) || cents <= 0) return null
  return cents
}
