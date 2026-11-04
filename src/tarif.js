import { useEffect, useState } from 'react'
import api from './api'

// Tarif des Ladens (GET /api/shop/tarif): { tarif, kundenGrenze, kunden,
// grenzeErreicht, funktionen: { kampagnen, auto_nachrichten, automationen,
// tagesangebot, newsletter, api, filialen } }. Einmal je Seitenaufruf
// geladen und geteilt, damit nicht jede Sektion selbst fragt.
let laden = null

function holen() {
  if (!laden) {
    laden = api.get('/api/shop/tarif')
        .then(r => r.data)
        // Fehler = nichts sperren; das Backend prueft ohnehin selbst.
        .catch(() => { laden = null; return null })
  }
  return laden
}

/** Neu laden, z. B. nach Login mit einem anderen Laden. */
export function tarifVergessen() { laden = null }

/** null, solange geladen wird oder wenn es nicht klappt. */
export function useTarif() {
  const [stand, setStand] = useState(null)
  useEffect(() => {
    let aktiv = true
    holen().then(s => { if (aktiv) setStand(s) })
    return () => { aktiv = false }
  }, [])
  return stand
}

/** Antwort des Backends auf eine Funktion, die der Tarif nicht hat (HTTP 402). */
export function istTarifSperre(err) {
  return err?.response?.status === 402 && err?.response?.data?.code === 'TARIF'
}
