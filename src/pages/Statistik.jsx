import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

export default function Statistik() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get('/api/shop/stats/summary')
        .then(res => setData(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.info}>{t('stat_loading')}</div>
  if (error || !data) return <div style={s.info}>{t('stat_load_error')}</div>

  const history = Array.isArray(data.history) ? data.history : []

  const kpis = [
    { label: t('stat_kpi_customers'), value: data.totalCustomers, icon: '👥', color: '#3C3489' },
    { label: t('stat_kpi_rewards'), value: data.totalRewards, icon: '🎁', color: '#2C5F2E' },
    { label: t('stat_kpi_active30'), value: data.activeCustomers30d, icon: '🔥', color: '#E07A3C' },
  ]

  return (
      <div>
        <div style={s.header}>
          <h1 style={s.title}>{t('stat_title')}</h1>
          <p style={s.subtitle}>{t('stat_overview_for', { name: data.shopName })}</p>
        </div>

        <div style={s.kpiGrid}>
          {kpis.map(k => (
              <div key={k.label} style={s.kpiCard}>
                <div style={{ ...s.kpiIcon, background: k.color + '22' }}>{k.icon}</div>
                <div>
                  <div style={s.kpiValue}>{k.value}</div>
                  <div style={s.kpiLabel}>{k.label}</div>
                </div>
              </div>
          ))}
        </div>

        <div style={s.derivedGrid}>
          <div style={s.derivedCard}>
            <CountUp target={data.totalStamps} lang={lang} />
            <div style={s.derivedLabel}>{t('stat_stamps_total')}</div>
            <div style={s.counterSub}>
              <span><b>{data.stampsThisWeek ?? 0}</b> {t('stat_this_week')}</span>
              <span><b>{data.stampsThisMonth ?? 0}</b> {t('stat_this_month')}</span>
              {data.openStamps != null && (
                <span><b>{data.openStamps}</b> {t('stat_stamps_open')}</span>
              )}
            </div>
          </div>
          <div style={s.derivedCard}>
            <CountUp target={data.totalRewards} lang={lang} />
            <div style={s.derivedLabel}>{t('stat_rewards')}</div>
            <div style={s.counterSub}>
              <span><b>{data.rewardsThisWeek ?? 0}</b> {t('stat_this_week')}</span>
              <span><b>{data.rewardsThisMonth ?? 0}</b> {t('stat_this_month')}</span>
            </div>
          </div>
          <div style={s.derivedCard}>
            <GrowthValue now={data.newCustomersThisWeek ?? 0} prev={data.newCustomersLastWeek ?? 0} t={t} />
            <div style={s.derivedLabel}>{t('stat_new_customers')}</div>
            <div style={s.derivedHint}>{t('stat_vs_last_week')}</div>
          </div>
          <div style={s.derivedCard}>
            <div style={s.derivedValue}>{data.customersWithConsent}</div>
            <div style={s.derivedLabel}>{t('stat_newsletter_reach')}</div>
            <div style={s.derivedHint}>{t('stat_newsletter_hint')}</div>
          </div>
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>{t('stat_peak_times')}</div>
          {data.bestDay && data.bestHour >= 0 ? (
              <div style={s.peakRow}>
                <div style={s.peakItem}>
                  <div style={s.peakIcon}>📅</div>
                  <div>
                    <div style={s.peakValue}>{data.bestDay}</div>
                    <div style={s.peakLabel}>{t('stat_peak_day')}</div>
                  </div>
                </div>
                <div style={s.peakItem}>
                  <div style={s.peakIcon}>🕐</div>
                  <div>
                    <div style={s.peakValue}>{formatHour(data.bestHour, t)}</div>
                    <div style={s.peakLabel}>{t('stat_peak_hour')}</div>
                  </div>
                </div>
              </div>
          ) : (
              <div style={s.empty}>
                {t('stat_not_enough_data')}
              </div>
          )}
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>{t('stat_history_title')}</div>
          <HistoryChart history={history} t={t} lang={lang} />
        </div>
      </div>
  )
}

function formatHour(h, t) {
  return t('stat_hour_range', { from: String(h).padStart(2, '0'), to: String((h + 1) % 24).padStart(2, '0') })
}

// Wachstums-Anzeige: Zahl diese Woche + Vergleich zur Vorwoche
function GrowthValue({ now, prev, t }) {
  let trend = null
  if (prev > 0) {
    const pct = Math.round((now - prev) / prev * 100)
    trend = pct
  }
  const color = trend === null ? '#3C3489' : trend >= 0 ? '#2C5F2E' : '#c0392b'
  return (
      <div>
        <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>+{now}</div>
        {trend !== null && (
            <div style={{ fontSize: 12, fontWeight: 600, color, marginTop: 3 }}>
              {trend >= 0 ? '▲' : '▼'} {t('stat_vs_last_week_pct', { pct: Math.abs(trend) })}
            </div>
        )}
      </div>
  )
}

function CountUp({ target = 0, duration = 1200, lang = 'de' }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target <= 0) { setValue(0); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return <div style={{ fontSize: 30, fontWeight: 800, color: '#3C3489', lineHeight: 1 }}>{value.toLocaleString(localeTag(lang))}</div>
}

// Rundet einen Maximalwert auf eine "schoene" Obergrenze (10, 20, 50, ...).
function niceMax(v) {
  if (v <= 5) return Math.max(Math.ceil(v), 1)
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 5, 10]) {
    if (m * pow >= v) return m * pow
  }
  return 10 * pow
}

// Gleichmaessige Y-Achsen-Marken (0 ... max), moeglichst ganzzahlige Schritte.
function niceTicks(max) {
  if (max <= 4) return Array.from({ length: max + 1 }, (_, i) => i)
  const div = max % 4 === 0 ? 4 : max % 5 === 0 ? 5 : max % 3 === 0 ? 3 : 2
  return Array.from({ length: div + 1 }, (_, i) => Math.round((max / div) * i))
}

function weekdayShort(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(localeTag(lang), { weekday: 'short' })
}

function fmtDate(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}.`
}

// Balkendiagramm: ein Balken pro Tag, Hover zeigt Datum + Stempel + Belohnungen.
function HistoryChart({ history, t, lang }) {
  const [hover, setHover] = useState(null)

  if (!history || history.length === 0) {
    return <div style={s.empty}>{t('stat_no_history')}</div>
  }

  const days = history
  const n = days.length
  const yMax = niceMax(Math.max(...days.map(d => d.stamps), 0))
  const yTicks = niceTicks(yMax)
  const totalStamps = days.reduce((a, d) => a + d.stamps, 0)
  const totalRewards = days.reduce((a, d) => a + d.rewards, 0)
  const activeDays = days.filter(d => d.stamps > 0).length

  const W = 700, H = 240
  const mL = 30, mR = 8, mT = 16, mB = 30
  const plotH = H - mT - mB
  const slot = (W - mL - mR) / n
  const barW = Math.max(3, Math.min(slot * 0.6, 22))
  const yOf = v => mT + plotH - (v / yMax) * plotH
  const slotCenter = i => mL + slot * i + slot / 2
  const todayI = n - 1
  const labelEvery = Math.max(1, Math.ceil(n / 6))
  const tipLeft = Math.min(92, Math.max(8, (slotCenter(hover ?? 0) / W) * 100))

  return (
      <div>
        <div style={s.legend}>
          <span style={s.legendItem}><i style={{ ...s.legendDot, background: '#3C3489' }} />{t('dash_stat_stamps')}</span>
          <span style={s.legendItem}><i style={{ ...s.legendDot, background: '#E0A93C' }} />{t('stat_rewards')}</span>
          <span style={{ ...s.legendItem, color: '#9aa0a6', marginInlineStart: 'auto' }}>
            {t('stat_active_days', { n: activeDays })}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
               onMouseLeave={() => setHover(null)}>
            {yTicks.map((tk, k) => (
                <g key={'y' + k}>
                  <line x1={mL} x2={W - mR} y1={yOf(tk)} y2={yOf(tk)} stroke="#ecedef" strokeWidth="1" />
                  <text x={mL - 6} y={yOf(tk) + 3} fontSize="10" fill="#b4b8bd" textAnchor="end">{tk}</text>
                </g>
            ))}

            {days.map((d, i) => {
              const by = yOf(d.stamps)
              const bh = Math.max(mT + plotH - by, d.stamps > 0 ? 1.5 : 0)
              const isToday = i === todayI
              const isHover = hover === i
              const fill = isHover ? '#2a2570' : isToday ? '#5B4FC7' : '#3C3489'
              return (
                  <g key={i}>
                    {d.stamps > 0 && (
                        <rect x={slotCenter(i) - barW / 2} y={by} width={barW} height={bh} rx="2" fill={fill} />
                    )}
                    {d.rewards > 0 && (
                        <circle cx={slotCenter(i)} cy={Math.max(by - 5, mT + 3)} r="3" fill="#E0A93C" />
                    )}
                    <rect x={mL + slot * i} y={mT} width={slot} height={plotH} fill="transparent"
                          onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
                  </g>
              )
            })}

            {days.map((d, i) => {
              if (i % labelEvery !== 0 && i !== todayI) return null
              return (
                  <text key={'x' + i} x={slotCenter(i)} y={H - 16} fontSize="9.5"
                        fill={i === todayI ? '#5B4FC7' : '#b4b8bd'}
                        fontWeight={i === todayI ? 700 : 400} textAnchor="middle">
                    {weekdayShort(d.date, lang)}
                  </text>
              )
            })}
            {days.map((d, i) => {
              if (i % labelEvery !== 0 && i !== todayI) return null
              return (
                  <text key={'xd' + i} x={slotCenter(i)} y={H - 5} fontSize="9.5" fill="#c9cdd1" textAnchor="middle">
                    {fmtDate(d.date)}
                  </text>
              )
            })}
          </svg>

          {hover !== null && (
              <div style={{ ...s.tip, left: tipLeft + '%' }}>
                <div style={s.tipHead}>{weekdayShort(days[hover].date, lang)} {fmtDate(days[hover].date)}</div>
                <div><b>{days[hover].stamps}</b> {t('dash_stat_stamps')}</div>
                {days[hover].rewards > 0 && (
                    <div style={{ color: '#F0BE5C' }}><b>{days[hover].rewards}</b> {t('stat_rewards')}</div>
                )}
              </div>
          )}
        </div>

        <div style={s.chartSummary}>
          <span><b>{totalStamps}</b> {t('dash_stat_stamps')}</span>
          <span><b>{totalRewards}</b> {t('stat_rewards')}</span>
        </div>
      </div>
  )
}

const CARD_SHADOW = '0 1px 2px rgba(16,24,40,0.04), 0 6px 20px rgba(16,24,40,0.06)'
const CARD_RADIUS = 14

const s = {
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a', letterSpacing: '-0.02em' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  info: { background: 'white', borderRadius: CARD_RADIUS, padding: 40, textAlign: 'center', color: '#888', fontSize: 14, boxShadow: CARD_SHADOW },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 },
  kpiCard: { background: 'white', borderRadius: CARD_RADIUS, padding: 20, boxShadow: CARD_SHADOW, display: 'flex', alignItems: 'center', gap: 14 },
  kpiIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  kpiValue: { fontSize: 28, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.02em' },
  kpiLabel: { fontSize: 13, color: '#888', marginTop: 4 },

  derivedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 },
  derivedCard: { background: 'white', borderRadius: CARD_RADIUS, padding: 18, boxShadow: CARD_SHADOW, textAlign: 'center' },
  derivedValue: { fontSize: 24, fontWeight: 800, color: '#3C3489' },
  derivedLabel: { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 4 },
  derivedHint: { fontSize: 11, color: '#aaa', marginTop: 3 },
  counterSub: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#888', marginTop: 6 },
  peakRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  peakItem: { flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 12, background: '#faf9ff', borderRadius: 10, padding: 16 },
  peakIcon: { fontSize: 28, flexShrink: 0 },
  peakValue: { fontSize: 18, fontWeight: 700, color: '#1a1a1a' },
  peakLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  panel: { background: 'white', borderRadius: CARD_RADIUS, padding: 20, boxShadow: CARD_SHADOW, marginBottom: 16 },
  panelTitle: { fontSize: 11.5, fontWeight: 700, color: '#8a8f98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', padding: '20px 0' },

  legend: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#555', marginBottom: 14 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 3, display: 'inline-block', flexShrink: 0 },
  tip: { position: 'absolute', top: -4, transform: 'translateX(-50%)', background: '#1a1a2e', color: 'white', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, lineHeight: 1.5, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.25)', zIndex: 2 },
  tipHead: { fontWeight: 700, marginBottom: 2, opacity: 0.85 },

  chartSummary: { display: 'flex', gap: 20, fontSize: 13, color: '#555', marginTop: 12 },

  cardRow: { padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  cardRowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardName: { fontSize: 14, fontWeight: 600, color: '#1a1a1a' },
  cardCustomers: { fontSize: 13, fontWeight: 600, color: '#3C3489' },
  barTrack: { width: '100%', height: 8, background: '#f0eeff', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', background: '#3C3489', borderRadius: 4, transition: 'width 0.3s' },
  cardStats: { display: 'flex', gap: 16, fontSize: 12, color: '#666', flexWrap: 'wrap' },
}