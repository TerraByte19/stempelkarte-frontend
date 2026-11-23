import { useEffect, useState } from 'react'
import api from '../api'
import { useTarif } from '../tarif'

/**
 * Kette: in welchen Filialen gilt diese Karte? Nur im Tarif Kette sichtbar.
 *
 * Zwei Arten:
 * - mit cardId (Karte bearbeiten): laedt den Stand und speichert jede
 *   Aenderung sofort.
 * - ohne cardId (Karte anlegen): haelt nur die Auswahl (value/onChange);
 *   gespeichert wird nach dem Anlegen, siehe Karten.jsx.
 *
 * value = { alle: true } oder { alle: false, filialen: [IDs, 'HAUPT'] }.
 */
export default function KartenFilialen(props) {
  const tarif = useTarif()
  if (tarif?.tarif !== 'KETTE') return null
  return <Auswahl {...props} />
}

const ALLE = { alle: true, filialen: [] }

function Auswahl({ cardId, value, onChange, t }) {
  const [orte, setOrte] = useState(null)
  const [stand, setStand] = useState(cardId ? null : (value || ALLE))
  const [fehler, setFehler] = useState('')
  const [gespeichert, setGespeichert] = useState(false)

  useEffect(() => {
    let aktuell = true
    api.get('/api/shop/me/orte')
        .then(r => { if (aktuell) setOrte(r.data) })
        .catch(() => { if (aktuell) setFehler(t('kette_karte_ladefehler')) })
    if (cardId) {
      api.get(`/api/shop/cards/${cardId}/filialen`)
          .then(r => { if (aktuell) setStand({ alle: !!r.data.alle, filialen: r.data.filialen || [] }) })
          .catch(() => { if (aktuell) setFehler(t('kette_karte_ladefehler')) })
    }
    return () => { aktuell = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId])

  if (!orte || !stand) {
    return fehler ? <div style={s.card}><p style={{ ...s.hint, color: '#b3261e', margin: 0 }}>{fehler}</p></div> : null
  }

  const waehlbar = [
    ...(orte.hauptIstFiliale ? [{ id: 'HAUPT', label: t('kette_karte_haupt') }] : []),
    ...(Array.isArray(orte.orte) ? orte.orte : []).map(o => ({
      id: o.id, label: o.aktiv === false ? `${o.label} (${t('kette_karte_aus')})` : o.label,
    })),
  ]

  async function setze(neu) {
    setFehler(''); setGespeichert(false)
    if (!cardId) {
      setStand(neu)
      onChange?.(neu)
      return
    }
    // Leere Auswahl nur anzeigen, nicht speichern: der Server lehnt sie ab.
    if (!neu.alle && neu.filialen.length === 0) {
      setStand(neu)
      setFehler(t('kette_karte_leer'))
      return
    }
    const vorher = stand
    setStand(neu)
    try {
      const r = await api.put(`/api/shop/cards/${cardId}/filialen`, neu)
      setStand({ alle: !!r.data.alle, filialen: r.data.filialen || [] })
      setGespeichert(true)
    } catch (e) {
      setStand(vorher)
      setFehler(e?.response?.data?.error || t('kette_karte_fehler'))
    }
  }

  function kippe(id) {
    const drin = stand.filialen.includes(id)
    setze({ alle: false, filialen: drin ? stand.filialen.filter(x => x !== id) : [...stand.filialen, id] })
  }

  return (
      <div style={s.card}>
        <div style={s.titel}>{t('kette_karte_title')}</div>
        <p style={s.hint}>{t('kette_karte_hint')}</p>
        <label style={s.zeile}>
          <input type="radio" checked={stand.alle} onChange={() => setze(ALLE)} />
          <span>{t('kette_karte_alle')}</span>
        </label>
        <label style={s.zeile}>
          <input type="radio" checked={!stand.alle}
                 onChange={() => setze({ alle: false, filialen: stand.filialen })} />
          <span>{t('kette_karte_auswahl')}</span>
        </label>
        {!stand.alle && (
            <div style={s.liste}>
              {waehlbar.map(o => (
                  <label key={o.id} style={s.zeile}>
                    <input type="checkbox" checked={stand.filialen.includes(o.id)} onChange={() => kippe(o.id)} />
                    <span>{o.label}</span>
                  </label>
              ))}
              {waehlbar.length === 0 && <p style={{ ...s.hint, margin: 0 }}>{t('kette_karte_keine')}</p>}
            </div>
        )}
        {fehler && <p style={{ ...s.hint, color: '#b3261e', margin: '8px 0 0' }}>{fehler}</p>}
        {gespeichert && !fehler && <p style={{ ...s.hint, color: '#2C5F2E', margin: '8px 0 0' }}>{t('kette_karte_ok')}</p>}
      </div>
  )
}

const s = {
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  titel: { fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  hint: { fontSize: 12, color: '#888', margin: '0 0 12px', lineHeight: 1.5 },
  zeile: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 14, color: '#1a1a1a', cursor: 'pointer' },
  liste: { margin: '6px 0 0', paddingInlineStart: 24, maxHeight: 260, overflowY: 'auto' },
}
