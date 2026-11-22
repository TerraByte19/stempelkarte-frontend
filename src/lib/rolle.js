/**
 * Rolle des eingeloggten Kontos: SHOP (Inhaber, Hauptkonto) oder FILIALE
 * (Unterkonto einer Kette). Steht im Token, das das Backend ausstellt.
 *
 * Reine Logik ohne React, damit node --test sie pruefen kann.
 *
 * Das ist nur Anzeige: welches Menue, welche Seiten. Was ein Konto wirklich
 * darf, entscheidet das Backend bei jeder Anfrage. Ein Unterkonto kommt dort
 * an keinen einzigen Endpunkt des Inhabers.
 */

/** 'FILIALE', 'SHOP' oder null (kein oder kaputter Token). */
export function rolleAusToken(token) {
  if (typeof token !== 'string') return null
  const teile = token.split('.')
  if (teile.length !== 3) return null
  try {
    const b64 = teile[1].replace(/-/g, '+').replace(/_/g, '/')
    const daten = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)))
    return daten?.role === 'FILIALE' ? 'FILIALE' : daten?.role === 'SHOP' ? 'SHOP' : null
  } catch {
    return null
  }
}

export function istFiliale(token) {
  return rolleAusToken(token) === 'FILIALE'
}

/**
 * Menue des Unterkontos. Eigene, kurze Liste statt eines Filters ueber das
 * Menue des Inhabers: so kann dort nie versehentlich ein Punkt durchrutschen.
 */
export const FILIALE_SEITEN = [
  { to: '/scanner', key: 'nav_scanner', symbol: 'scanner' },
  { to: '/', key: 'kette_nav_stats', symbol: 'statistik', end: true },
  { to: '/geraete', key: 'kette_nav_geraete', symbol: 'team' },
  { to: '/korrektur', key: 'kette_nav_korrektur', symbol: 'karten' },
]

/** Zeitraum fuer die Statistik als { von, bis } im Format JJJJ-MM-TT, beide Tage zaehlen. */
export function zeitraum(tage, heute = new Date()) {
  const iso = d => {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }
  const von = new Date(heute)
  von.setDate(von.getDate() - (Math.max(1, tage) - 1))
  return { von: iso(von), bis: iso(heute) }
}
