// Ordner im Admin-Panel: der Betreiber legt alle Ordner selbst an und ordnet
// jeden Laden ein. Gespeichert ist nur der Name am Laden (Shop.adminOrdner),
// null = ohne Ordner. Es gibt keine vorgegebenen Ordner.

export const ALLE = '__alle'
export const OHNE = '__ohne'

/** Benutzte Ordner, alphabetisch. */
export function benutzteOrdner(shops) {
  return [...new Set(shops.map(s => s.ordner).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'))
}

/** Auswahl je Laden: nur die selbst angelegten Ordner. */
export function auswahlOrdner(shops) {
  return benutzteOrdner(shops)
}

export function imOrdner(shops, filter) {
  if (filter === ALLE) return shops
  if (filter === OHNE) return shops.filter(s => !s.ordner)
  return shops.filter(s => s.ordner === filter)
}
