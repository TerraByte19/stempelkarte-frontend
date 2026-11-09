// Ordner im Admin-Panel: der Betreiber ordnet jeden Laden selbst ein.
// Gespeichert ist nur der Name am Laden (Shop.adminOrdner), null = ohne Ordner.

export const VORSCHLAEGE = ['Kunde', 'Interessent', 'Intern', 'Pausiert']
export const ALLE = '__alle'
export const OHNE = '__ohne'

/** Benutzte Ordner in fester Reihenfolge: erst die Vorschlaege, dann der Rest alphabetisch. */
export function benutzteOrdner(shops) {
  const set = new Set(shops.map(s => s.ordner).filter(Boolean))
  const vorn = VORSCHLAEGE.filter(o => set.has(o))
  const rest = [...set].filter(o => !VORSCHLAEGE.includes(o)).sort((a, b) => a.localeCompare(b, 'de'))
  return [...vorn, ...rest]
}

/** Auswahl je Laden: Vorschlaege plus alles, was schon benutzt wird. */
export function auswahlOrdner(shops) {
  const benutzt = benutzteOrdner(shops)
  return [...VORSCHLAEGE, ...benutzt.filter(o => !VORSCHLAEGE.includes(o))]
}

export function imOrdner(shops, filter) {
  if (filter === ALLE) return shops
  if (filter === OHNE) return shops.filter(s => !s.ordner)
  return shops.filter(s => s.ordner === filter)
}
