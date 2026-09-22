import { useState } from 'react'
import { formatierePunkte } from '../lib/pointsOf'
import Icon from './Icon'

const MAX_REWARDS = 20

/**
 * Der Praemien-Katalog einer Punktekarte.
 *
 * Preise liegen wie jeder Punktwert in Hundertsteln. Eingetippt wird
 * allerdings in ganzen Punkten - eine Praemie fuer 2,5 Punkte hat noch
 * niemand gebraucht, und die Eingabe bliebe fehleranfaellig.
 */
export default function RewardCatalog({ rewards, onAdd, onRemove, t }) {
  const [name, setName] = useState('')
  const [kosten, setKosten] = useState('')

  const punkte = parseInt(kosten, 10)
  const eingabeOk = name.trim() !== '' && Number.isFinite(punkte) && punkte >= 1

  function hinzufuegen() {
    if (!eingabeOk) return
    onAdd(name.trim(), punkte * 100)
    setName('')
    setKosten('')
  }

  const voll = rewards.length >= MAX_REWARDS

  return (
    <div style={s.block}>
      <label style={s.label}>{t('cards_catalog')}</label>
      <div style={s.hint}>{t('cards_catalog_hint')}</div>

      {rewards.length === 0 && (
        <div style={s.leer}>{t('cards_catalog_empty')}</div>
      )}

      {rewards.map((r, i) => (
        <div key={r.id ?? `${r.name}-${i}`} style={s.zeile}>
          <span style={s.zeileName}>{r.name}</span>
          <span style={s.zeileKosten}>
            {t('cards_points_count', { n: formatierePunkte(r.costPointsX100) })}
          </span>
          <button style={s.weg} onClick={() => onRemove(r)} title={t('common_remove')}>
            <Icon name="x" size={16} strokeWidth={2.4} />
          </button>
        </div>
      ))}

      {voll ? (
        <div style={s.hint}>{t('cards_catalog_max')}</div>
      ) : (
        <div style={s.row}>
          <input
            style={s.name}
            type="text"
            maxLength={40}
            placeholder={t('cards_catalog_name_ph')}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            style={s.kosten}
            type="text"
            inputMode="numeric"
            placeholder={t('cards_catalog_cost')}
            value={kosten}
            onChange={e => setKosten(e.target.value)}
          />
          <button
            style={{ ...s.add, opacity: eingabeOk ? 1 : 0.45 }}
            disabled={!eingabeOk}
            onClick={hinzufuegen}
            title={t('cards_catalog_add')}
          >
            <Icon name="check" size={16} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  )
}

const s = {
  block: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '4px', textAlign: 'start' },
  hint: { fontSize: '12px', color: '#999', marginBottom: '10px', textAlign: 'start' },
  leer: { fontSize: '13px', color: '#999', background: '#f8f8f8', borderRadius: '10px', padding: '12px', marginBottom: '10px', textAlign: 'start' },
  zeile: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#f8f8f8', borderRadius: '10px', marginBottom: '6px' },
  zeileName: { flex: 1, fontSize: '14px', fontWeight: '600', color: '#1a1a1a', textAlign: 'start' },
  zeileKosten: { fontSize: '13px', color: '#666' },
  weg: { background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', display: 'flex', padding: '4px' },
  row: { display: 'flex', gap: '8px' },
  name: { flex: 1, padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', minWidth: 0 },
  kosten: { width: '90px', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box' },
  add: { padding: '12px 16px', background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex' },
}
