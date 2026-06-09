import { useEffect, useState } from 'react'
import { useLang } from '../LangContext'
import api from '../api'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Dashboard() {
  const { t } = useLang()
  const [cards, setCards] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const [stats, setStats] = useState([])
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')
  const printStyle = `@media print { body * { visibility: hidden; } #print-qr, #print-qr * { visibility: visible; } #print-qr { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; } }`

  useEffect(() => {
    api.get('/api/shop/cards')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : []
          setCards(data)
          if (data.length > 0) setSelectedCard(data[0])
        })
        .catch(() => setCards([]))

    api.get('/api/shop/stats')
        .then(res => setStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setStats([]))
  }, [])

  return (
      <div>
        <h1 style={styles.title}>{t('dash_welcome')}, {shop.name}!</h1>
        <p style={styles.subtitle}>{t('dash_subtitle')}</p>

        {stats.length > 0 && (
            <div style={styles.statsGrid}>
              {stats.map(s => (
                  <div key={s.cardId} style={styles.statCard}>
                    <div style={styles.statCardName}>{s.cardName}</div>
                    <div style={styles.statRow}>
                      <div style={styles.statItem}><div style={styles.statNumber}>{s.customerCount}</div><div style={styles.statLabel}>{t('dash_stat_customers')}</div></div>
                      <div style={styles.statItem}><div style={styles.statNumber}>{s.totalStamps}</div><div style={styles.statLabel}>{t('dash_stat_stamps')}</div></div>
                      <div style={styles.statItem}><div style={styles.statNumber}>{s.totalRewards}</div><div style={styles.statLabel}>{t('dash_stat_rewards')}</div></div>
                    </div>
                  </div>
              ))}
            </div>
        )}

        {cards.length === 0 ? (
            <div style={styles.empty}>{t('dash_no_cards')} <a href="/karten" style={{ color: '#3C3489' }}>{t('dash_create_now')}</a></div>
        ) : (
            <div style={styles.grid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>{t('dash_select_card')}</h2>
                <div style={styles.cardList}>
                  {cards.map(card => (
                      <div key={card.id} style={{ ...styles.cardItem, ...(selectedCard?.id === card.id ? styles.cardItemActive : {}) }} onClick={() => setSelectedCard(card)}>
                        <div style={styles.cardItemName}>{card.name}</div>
                        <div style={styles.cardItemMeta}>{card.rewardThreshold} {t('dash_stat_stamps')} → {card.rewardText}</div>
                      </div>
                  ))}
                </div>
              </div>

              {selectedCard && (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>{t('dash_qr_title')}</h2>
                    <p style={styles.hint}>{t('dash_qr_hint')}</p>
                    <div style={styles.qrContainer}>
                      <style>{printStyle}</style>
                      <div id="print-qr" style={{ textAlign: 'center' }}>
                        <img src={`${baseUrl}/api/customer/card/${selectedCard.id}/qr-shop`} alt="QR Code" style={styles.qrImage} />
                        <div style={{ marginTop: '12px', fontSize: '14px', color: '#333' }}>{selectedCard.name} — {shop.name}</div>
                      </div>
                    </div>
                    <div style={styles.btnRow}>
                      <button style={styles.btnPrimary} onClick={() => { const l = document.createElement('a'); l.href = `${baseUrl}/api/customer/card/${selectedCard.id}/qr-shop`; l.download = `qr-${selectedCard.name}.png`; l.click() }}>{t('dash_download_qr')}</button>
                      <button style={styles.btnSecondary} onClick={() => window.print()}>{t('dash_print')}</button>
                    </div>
                    <div style={styles.cardInfo}>
                      <div style={styles.cardInfoItem}><span style={styles.cardInfoLabel}>{t('dash_card_id')}</span><span style={styles.cardInfoValue}>{selectedCard.id}</span></div>
                      <div style={styles.cardInfoItem}><span style={styles.cardInfoLabel}>{t('dash_stamps_label')}</span><span style={styles.cardInfoValue}>{selectedCard.rewardThreshold}</span></div>
                      <div style={styles.cardInfoItem}><span style={styles.cardInfoLabel}>{t('dash_reward_label')}</span><span style={styles.cardInfoValue}>{selectedCard.rewardText}</span></div>
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
  )
}

const styles = {
  title: { fontSize: '24px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: '14px', color: '#888', margin: '0 0 24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statCardName: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' },
  statRow: { display: 'flex', gap: '16px' },
  statItem: { flex: 1, textAlign: 'center' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#3C3489' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '2px' },
  empty: { background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#888', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#1a1a1a' },
  hint: { fontSize: '13px', color: '#888', margin: '0 0 16px', lineHeight: '1.5' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  cardItem: { padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', border: '1.5px solid #e0e0e0' },
  cardItemActive: { border: '1.5px solid #3C3489', background: '#f0eeff' },
  cardItemName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  cardItemMeta: { fontSize: '12px', color: '#888', marginTop: '2px' },
  qrContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' },
  qrImage: { width: '200px', height: '200px', borderRadius: '8px' },
  btnRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  btnSecondary: { background: '#f0eeff', color: '#3C3489', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flex: 1 },
  cardInfo: { borderTop: '1px solid #f0f0f0', paddingTop: '16px' },
  cardInfoItem: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' },
  cardInfoLabel: { color: '#888' },
  cardInfoValue: { fontWeight: '500', color: '#1a1a1a' },
}