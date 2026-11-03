import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../LangContext'
import api from '../api'
import AktivitaetSection from '../components/AktivitaetSection'
import FilialenSection from '../components/FilialenSection'
import RueckmeldungenSection from '../components/RueckmeldungenSection'
import KundengruppenSection from '../components/KundengruppenSection'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Merkt sich, dass der Laden den Hinweis auf "Nachrichten" gesehen hat.
const NACHRICHTEN_GESEHEN = 'sk_setup_nachrichten'

/** Leeres oder unlesbares Datum darf nicht als "Invalid Date" dastehen. */
function fristText(wert) {
  const d = wert ? new Date(wert) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString() : '-'
}

/**
 * Heutiges Datum als JJJJ-MM-TT in Berliner Zeit - so schreibt das Backend
 * die Tage in /stats/summary (StatsService.ZONE). Mit der Ortszeit des
 * Geraets waere kurz nach Mitternacht sonst der falsche Tag "heute".
 */
function heuteInBerlin() {
  const teile = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const wert = typ => teile.find(p => p.type === typ)?.value
  return `${wert('year')}-${wert('month')}-${wert('day')}`
}

function lesen(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

export default function Dashboard() {
  const { t } = useLang()
  const [cards, setCards] = useState([])
  const [kartenGeladen, setKartenGeladen] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [stats, setStats] = useState([])
  // Zahlen von heute: null = laedt, false = nicht verfuegbar.
  const [heute, setHeute] = useState(null)
  // Einrichtung: null = noch unbekannt, dann zeigt die Liste den Schritt nicht.
  const [zugaenge, setZugaenge] = useState(null)
  const [rueckAktiv, setRueckAktiv] = useState(null)
  const [rueckKey, setRueckKey] = useState(0)
  const [rueckBusy, setRueckBusy] = useState(false)
  const [nachrichtenGesehen, setNachrichtenGesehen] = useState(() => lesen(NACHRICHTEN_GESEHEN) === 'true')
  // Standort-Pflicht: ohne hinterlegten Ladenort laeuft die Geo-Pruefung
  // ins Leere, deshalb sperrt das Backend irgendwann das Scannen.
  const [standort, setStandort] = useState(null)
  const shop = JSON.parse(localStorage.getItem('shop') || '{}')
  const printStyle = `@media print { body * { visibility: hidden; } #print-qr, #print-qr * { visibility: visible; } #print-qr { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; } }`

  /** Kurzzeile je Karte in der Auswahl, je nach Typ. */
  function kartenMeta(card) {
    const typ = card.type ?? 'STAMP'
    if (typ === 'POINTS') return t('cards_type_points')
    if (typ === 'MEMBER') return t('cards_type_member')
    if (typ === 'PACKAGE') return `${card.rewardThreshold} ${card.paketEinheit || ''}`.trim()
    return `${card.rewardThreshold} ${t('dash_stat_stamps')} → ${card.rewardText}`
  }

  useEffect(() => {
    api.get('/api/shop/cards')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : []
          setCards(data)
          if (data.length > 0) setSelectedCard(data[0])
          setKartenGeladen(true)
        })
        // Fehler: Schritt "Erste Karte" nicht zeigen - vielleicht gibt es sie.
        .catch(() => setCards([]))

    api.get('/api/shop/stats')
        .then(res => setStats(Array.isArray(res.data) ? res.data : []))
        .catch(() => setStats([]))

    // Heute aus dem 2-Wochen-Verlauf: Stempel und Praemien aus dem ScanLog,
    // neue Kunden aus den angelegten Kundenkarten.
    api.get('/api/shop/stats/summary')
        .then(res => {
          const tag = heuteInBerlin()
          const verlauf = Array.isArray(res.data?.history) ? res.data.history : []
          const neue = Array.isArray(res.data?.newCustomerHistory) ? res.data.newCustomerHistory : []
          const h = verlauf.find(d => d.date === tag)
          const n = neue.find(d => d.date === tag)
          if (!h && !n) { setHeute(false); return }
          setHeute({ stempel: h?.stamps ?? 0, praemien: h?.rewards ?? 0, neu: n?.count ?? 0 })
        })
        .catch(() => setHeute(false))

    api.get('/api/shop/staff-tokens')
        .then(res => setZugaenge(Array.isArray(res.data) ? res.data.length : null))
        .catch(() => setZugaenge(null))

    api.get('/api/shop/me')
        .then(res => setStandort(res.data))
        .catch(() => setStandort(null))
  }, [])

  async function rueckmeldungenEinschalten() {
    setRueckBusy(true)
    try {
      await api.put('/api/shop/rueckmeldungen/aktiv', { aktiv: true })
      setRueckAktiv(true)
      setRueckKey(k => k + 1)   // Abschnitt neu laden, damit er erscheint
    } catch { alert(t('common_error_generic')) }
    setRueckBusy(false)
  }

  function nachrichtenAbhaken() {
    try { localStorage.setItem(NACHRICHTEN_GESEHEN, 'true') } catch { /* nur Komfort */ }
    setNachrichtenGesehen(true)
  }

  // Offene Einrichtungsschritte. Erledigte fallen raus; sind alle erledigt,
  // verschwindet die Liste ganz.
  const schritte = []
  if (kartenGeladen && cards.length === 0) {
    schritte.push({
      key: 'karte', titel: t('setup_card_title'), text: t('setup_card_text'),
      aktion: <Link to="/karten" style={styles.btnSchritt}>{t('setup_card_btn')}</Link>,
    })
  }
  if (zugaenge === 0) {
    schritte.push({
      key: 'scanner', titel: t('setup_scanner_title'), text: t('setup_scanner_text'),
      aktion: <Link to="/team" style={styles.btnSchritt}>{t('setup_scanner_btn')}</Link>,
    })
  }
  if (rueckAktiv === false) {
    schritte.push({
      key: 'rueck', titel: t('setup_feedback_title'), text: t('rm_intro'), hinweis: t('rm_google_note'),
      aktion: (
          <button type="button" style={styles.btnSchritt} disabled={rueckBusy} onClick={rueckmeldungenEinschalten}>
            {t('rm_on')}
          </button>
      ),
    })
  }
  if (!nachrichtenGesehen) {
    schritte.push({
      key: 'nachrichten', titel: t('setup_msg_title'), text: t('dash_nachr_link'),
      aktion: <Link to="/nachrichten" style={styles.btnSchritt} onClick={nachrichtenAbhaken}>{t('dash_nachr_open')}</Link>,
    })
  }

  return (
      <div>
        <h1 style={styles.title}>{t('dash_welcome')}, {shop.name}!</h1>
        <p style={styles.subtitle}>{t('dash_subtitle')}</p>

        {/* Nur zeigen, wenn das Backend die Felder WIRKLICH liefert. Ein
            aelteres Backend kennt sie nicht - dann waere standortGesetzt
            undefined, der Banner erschiene bei jedem Laden, und aus dem
            fehlenden Datum wuerde "Invalid Date". */}
        {standort?.standortGesetzt === false && !standort.geoBefreit && (
            <div style={standort.scanGesperrt ? styles.warnHart : styles.warnWeich}>
              <div style={styles.warnTitel}>
                {t(standort.scanGesperrt ? 'dash_geo_blocked_title' : 'dash_geo_warn_title')}
              </div>
              <div style={styles.warnText}>
                {standort.scanGesperrt
                    ? t('dash_geo_blocked_text')
                    : t('dash_geo_warn_text', { datum: fristText(standort.standortFristBis) })}
              </div>
              <Link to="/profil" style={styles.warnBtn}>{t('dash_geo_cta')}</Link>
            </div>
        )}

        {/* Heute: das, was der Laden jeden Tag zuerst wissen will. */}
        {heute && (
            <section style={styles.heute} aria-label={t('dash_today_title')}>
              <h2 style={styles.heuteTitel}>{t('dash_today_title')}</h2>
              <div style={styles.heuteReihe}>
                <div style={styles.heuteWert}>
                  <span style={styles.heuteZahl}>{heute.stempel}</span>
                  <span style={styles.heuteLabel}>{t('dash_today_stamps')}</span>
                </div>
                <div style={styles.heuteWert}>
                  <span style={styles.heuteZahl}>{heute.praemien}</span>
                  <span style={styles.heuteLabel}>{t('dash_today_rewards')}</span>
                </div>
                <div style={styles.heuteWert}>
                  <span style={styles.heuteZahl}>{heute.neu}</span>
                  <span style={styles.heuteLabel}>{t('dash_today_new')}</span>
                </div>
              </div>
            </section>
        )}

        {schritte.length > 0 && (
            <section style={styles.einrichtung}>
              <div style={styles.einrichtungKopf}>
                <h2 style={styles.cardTitle}>{t('setup_title')}</h2>
                <span style={styles.einrichtungRest}>{t('setup_left', { n: schritte.length })}</span>
              </div>
              {schritte.map(st => (
                  <div key={st.key} style={styles.schritt}>
                    <span style={styles.schrittKreis} aria-hidden="true" />
                    <div style={styles.schrittText}>
                      <div style={styles.schrittTitel}>{st.titel}</div>
                      <div style={styles.schrittBeschreibung}>{st.text}</div>
                      {st.hinweis && <div style={styles.schrittHinweis}>{st.hinweis}</div>}
                    </div>
                    <div style={styles.schrittAktion}>{st.aktion}</div>
                  </div>
              ))}
            </section>
        )}

        {stats.length > 0 && (
            <div style={styles.statsGrid}>
              {stats.map(s => {
                // Kartentyp aus der Kartenliste: Mitglieds- und 10er-Karte
                // zaehlen Besuche statt Stempel und haben keine Praemien.
                const typ = cards.find(c => c.id === s.cardId)?.type ?? 'STAMP'
                const besuche = typ === 'MEMBER' || typ === 'PACKAGE'
                return (
                  <div key={s.cardId} style={styles.statCard}>
                    <div style={styles.statCardName}>{s.cardName}</div>
                    <div style={styles.statRow}>
                      <div style={styles.statItem}><div style={styles.statNumber}>{s.customerCount}</div><div style={styles.statLabel}>{t('dash_stat_customers')}</div></div>
                      <div style={styles.statItem}><div style={styles.statNumber}>{s.totalStamps}</div><div style={styles.statLabel}>{t(besuche ? 'dash_stat_visits' : 'dash_stat_stamps')}</div></div>
                      {!besuche && <div style={styles.statItem}><div style={styles.statNumber}>{s.totalRewards}</div><div style={styles.statLabel}>{t('dash_stat_rewards')}</div></div>}
                    </div>
                    {/* Wird der QR-Code benutzt? Aelteres Backend liefert die Zahlen nicht. */}
                    {typeof s.scans7d === 'number' && (
                        <div style={{ marginTop: 10, fontSize: 12, color: s.scans7d > 0 ? '#3C3489' : '#999', textAlign: 'center' }}>
                          {s.scans7d > 0
                              ? t('dash_stat_scans', { heute: s.scansToday, woche: s.scans7d })
                              : t('dash_stat_scans_none')}
                        </div>
                    )}
                  </div>
                )
              })}
            </div>
        )}

        {/* Kundengruppen: Neu, Stammgast, Gelegentlich, wird ruhig, verloren */}
        <KundengruppenSection />

        {/* Filialen: Zahlen je Standort, nur bei mehr als einem Standort eine Tabelle */}
        <FilialenSection />

        {/* Zuletzt passiert: juengste Scans und neueste Kunden */}
        <AktivitaetSection />

        {/* Private Rueckmeldungen der Kunden. Ausgeschaltet steht der Schritt
            oben in der Einrichtung; hier erscheinen nur die Rueckmeldungen. */}
        <RueckmeldungenSection key={rueckKey} nurWennAktiv onStand={setRueckAktiv} />

        {cards.length > 0 && (
            <div style={styles.grid}>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>{t('dash_select_card')}</h2>
                <div style={styles.cardList}>
                  {cards.map(card => (
                      <div key={card.id} style={{ ...styles.cardItem, ...(selectedCard?.id === card.id ? styles.cardItemActive : {}) }} onClick={() => setSelectedCard(card)}>
                        <div style={styles.cardItemName}>{card.name}</div>
                        <div style={styles.cardItemMeta}>{kartenMeta(card)}</div>
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
                        <div style={{ marginTop: '12px', fontSize: '14px', color: '#333' }}>{selectedCard.name} · {shop.name}</div>
                      </div>
                    </div>
                    <div style={styles.btnRow}>
                      <button style={styles.btnPrimary} onClick={() => { const l = document.createElement('a'); l.href = `${baseUrl}/api/customer/card/${selectedCard.id}/qr-shop`; l.download = `qr-${selectedCard.name}.png`; l.click() }}>{t('dash_download_qr')}</button>
                      <button style={styles.btnSecondary} onClick={() => window.print()}>{t('dash_print')}</button>
                    </div>
                    <div style={styles.cardInfo}>
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
  warnWeich: { background: '#FFF7E6', border: '1.5px solid #E3B77E', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' },
  warnHart: { background: '#FDECEA', border: '1.5px solid #D98B7A', borderRadius: '12px', padding: '16px 18px', marginBottom: '20px' },
  warnTitel: { fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: '#333' },
  warnText: { fontSize: '14px', color: '#555', marginBottom: '10px', lineHeight: '1.5' },
  warnBtn: { display: 'inline-block', background: '#3C3489', color: 'white', padding: '9px 16px', borderRadius: '9px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' },
  title: { fontSize: '26px', fontWeight: '700', margin: '0 0 4px', color: 'var(--sk-ink)' },
  subtitle: { fontSize: '14px', color: 'var(--sk-muted)', margin: '0 0 24px' },

  // Heute: einzige farbige Flaeche im Dashboard, damit der Blick dort landet.
  heute: { background: 'var(--sk-brand)', color: 'white', borderRadius: '16px', padding: '20px 24px 22px', marginBottom: '20px' },
  heuteTitel: { fontSize: '15px', fontWeight: '600', margin: '0 0 12px', opacity: 0.85 },
  heuteReihe: { display: 'flex', gap: '12px' },
  heuteWert: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  heuteZahl: { fontFamily: 'var(--sk-display)', fontSize: 'clamp(30px, 8vw, 40px)', fontWeight: '600', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' },
  heuteLabel: { fontSize: '13px', opacity: 0.8 },

  einrichtung: { background: 'white', borderRadius: '12px', padding: '20px 24px 8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  einrichtungKopf: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' },
  einrichtungRest: { fontSize: '13px', color: 'var(--sk-muted)' },
  schritt: { display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderTop: '1px solid var(--sk-line)', flexWrap: 'wrap' },
  schrittKreis: { width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #C9C5E8', flexShrink: 0, marginTop: '2px' },
  schrittText: { flex: '1 1 240px', minWidth: 0 },
  schrittTitel: { fontSize: '15px', fontWeight: '600', color: 'var(--sk-ink)', marginBottom: '2px' },
  schrittBeschreibung: { fontSize: '13px', color: '#555', lineHeight: '1.5', maxWidth: '62ch' },
  schrittHinweis: { fontSize: '12px', color: '#888', lineHeight: '1.5', marginTop: '4px', maxWidth: '62ch' },
  schrittAktion: { flexShrink: 0, marginInlineStart: '32px' },
  btnSchritt: { display: 'inline-block', background: '#f0eeff', color: '#3C3489', border: 'none', padding: '8px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' },
  statCard: { background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statCardName: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' },
  statRow: { display: 'flex', gap: '16px' },
  statItem: { flex: 1, textAlign: 'center' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#3C3489', fontFamily: 'var(--sk-display)' },
  statLabel: { fontSize: '12px', color: '#888', marginTop: '2px' },
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
