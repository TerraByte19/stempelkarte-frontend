import { useEffect, useState } from 'react'
import api from '../api'

export default function Dashboard() {
  const [cards, setCards] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')
  const baseUrl = 'http://localhost:8080'

  const printStyle = `
    @media print {
      body * { visibility: hidden; }
      #print-qr, #print-qr * { visibility: visible; }
      #print-qr {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }
    }
  `

  useEffect(() => {
    api.get('/api/shop/cards').then(res => {
      setCards(res.data)
      if (res.data.length > 0) setSelectedCard(res.data[0])
    })
  }, [])

  return (
    <div>
      <h1 style={styles.title}>Willkommen, {shop.name}! 👋</h1>
      <p style={styles.subtitle}>Hier ist deine Übersicht</p>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{cards.length}</div>
          <div style={styles.statLabel}>Aktive Karten</div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div style={styles.empty}>
          Noch keine Karten —{' '}
          <a href="/karten" style={{ color: '#3C3489' }}>Jetzt erstellen</a>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Karten-Auswahl */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Karte auswählen</h2>
            <div style={styles.cardList}>
              {cards.map(card => (
                <div
                  key={card.id}
                  style={{
                    ...styles.cardItem,
                    ...(selectedCard?.id === card.id ? styles.cardItemActive : {})
                  }}
                  onClick={() => setSelectedCard(card)}
                >
                  <div style={styles.cardItemName}>{card.name}</div>
                  <div style={styles.cardItemMeta}>
                    {card.rewardThreshold} Stempel → {card.rewardText}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR-Code Anzeige */}
          {selectedCard && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>QR-Code für Kunden</h2>
              <p style={styles.hint}>
                Drucke diesen QR-Code aus oder zeige ihn auf einem Tablet.
                Wenn der Kunde ihn scannt, bekommt er die Karte in seine Wallet.
              </p>

              <div style={styles.qrContainer}>
                <style>{printStyle}</style>
                <div id="print-qr" style={{ textAlign: 'center' }}>
                  <img
                    src={`${baseUrl}/api/customer/card/${selectedCard.id}/qr-shop`}
                    alt="QR Code"
                    style={styles.qrImage}
                  />
                  <div style={{ marginTop: '12px', fontSize: '14px', color: '#333' }}>
                    {selectedCard.name} — {shop.name}
                  </div>
                </div>
              </div>

              <div style={styles.btnRow}>
                <button
                  style={styles.btnPrimary}
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = `${baseUrl}/api/customer/card/${selectedCard.id}/qr-shop`
                    link.download = `qr-${selectedCard.name}.png`
                    link.click()
                  }}
                >
                  ⬇️ QR-Code herunterladen
                </button>
                <button
                  style={styles.btnSecondary}
                  onClick={() => window.print()}
                >
                  🖨️ Drucken
                </button>
              </div>

              <div style={styles.cardInfo}>
                <div style={styles.cardInfoItem}>
                  <span style={styles.cardInfoLabel}>Karten-ID:</span>
                  <span style={styles.cardInfoValue}>{selectedCard.id}</span>
                </div>
                <div style={styles.cardInfoItem}>
                  <span style={styles.cardInfoLabel}>Stempel:</span>
                  <span style={styles.cardInfoValue}>{selectedCard.rewardThreshold}</span>
                </div>
                <div style={styles.cardInfoItem}>
                  <span style={styles.cardInfoLabel}>Belohnung:</span>
                  <span style={styles.cardInfoValue}>{selectedCard.rewardText}</span>
                </div>
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
  statsRow: { display: 'flex', gap: '16px', marginBottom: '28px' },
  statCard: {
    background: 'white', borderRadius: '12px', padding: '20px',
    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    minWidth: '120px',
  },
  statNumber: { fontSize: '36px', fontWeight: '700', color: '#3C3489' },
  statLabel: { fontSize: '13px', color: '#888', marginTop: '4px' },
  empty: {
    background: 'white', borderRadius: '12px', padding: '40px',
    textAlign: 'center', color: '#888', fontSize: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  card: {
    background: 'white', borderRadius: '12px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#1a1a1a' },
  hint: { fontSize: '13px', color: '#888', margin: '0 0 16px', lineHeight: '1.5' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  cardItem: {
    padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
    border: '1.5px solid #e0e0e0',
  },
  cardItemActive: {
    border: '1.5px solid #3C3489', background: '#f0eeff',
  },
  cardItemName: { fontSize: '14px', fontWeight: '600', color: '#1a1a1a' },
  cardItemMeta: { fontSize: '12px', color: '#888', marginTop: '2px' },
  qrContainer: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', marginBottom: '16px',
  },
  qrImage: { width: '200px', height: '200px', borderRadius: '8px' },
  btnRow: { display: 'flex', gap: '10px', marginBottom: '16px' },
  btnPrimary: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: '10px', padding: '10px 16px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', flex: 1,
  },
  btnSecondary: {
    background: '#f0eeff', color: '#3C3489', border: 'none',
    borderRadius: '10px', padding: '10px 16px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', flex: 1,
  },
  cardInfo: { borderTop: '1px solid #f0f0f0', paddingTop: '16px' },
  cardInfoItem: {
    display: 'flex', justifyContent: 'space-between',
    padding: '6px 0', fontSize: '13px',
  },
  cardInfoLabel: { color: '#888' },
  cardInfoValue: { fontWeight: '500', color: '#1a1a1a' },
}