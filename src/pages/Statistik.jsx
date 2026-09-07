import { useEffect, useState } from 'react'
import api from '../api'
import { useLang, localeTag } from '../LangContext'

export default function Statistik() {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    api.get('/api/shop/stats/summary')
        .then(res => setData(res.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.info}>{t('stat_loading')}</div>
  if (error || !data) return <div style={s.info}>{t('stat_load_error')}</div>

  const history = Array.isArray(data.history) ? data.history : []
  const byWeekday = Array.isArray(data.byWeekday) ? data.byWeekday : []
  const hasWeekday = byWeekday.some(v => v > 0)
  const bestIdx = hasWeekday ? byWeekday.indexOf(Math.max(...byWeekday)) : -1
  const quietIdx = hasWeekday ? byWeekday.indexOf(Math.min(...byWeekday)) : -1
  const histSum = history.reduce((a, d) => a + d.stamps, 0)
  const avgPerDay = history.length ? Math.round((histSum / history.length) * 10) / 10 : 0

  const kpis = [
    { label: t('stat_kpi_customers'), value: data.totalCustomers, icon: 'users', color: '#3C3489' },
    { label: t('stat_kpi_rewards'), value: data.totalRewards, icon: 'gift', color: '#2C5F2E' },
    { label: t('stat_kpi_active30'), value: data.activeCustomers30d, icon: 'flame', color: '#E07A3C' },
  ]

  const peakTiles = []
  if (data.bestHour >= 0 || hasWeekday) {
    peakTiles.push({ icon: 'calendar', value: bestIdx >= 0 ? weekdayName(bestIdx, lang) : data.bestDay, label: t('stat_peak_day') })
    if (data.bestHour >= 0) peakTiles.push({ icon: 'clock', value: formatHour(data.bestHour, t), label: t('stat_peak_hour') })
    peakTiles.push({ icon: 'avg', value: avgPerDay.toLocaleString(localeTag(lang)), label: t('stat_avg_per_day') })
    if (quietIdx >= 0) peakTiles.push({ icon: 'sun', value: weekdayName(quietIdx, lang), label: t('stat_quiet_day') })
  }

  return (
      <div>
        <div style={s.header}>
          <h1 style={s.title}>{t('stat_title')}</h1>
          <p style={s.subtitle}>{t('stat_overview_for', { name: data.shopName })}</p>
        </div>

        <div style={s.kpiGrid}>
          {kpis.map(k => (
              <div key={k.label} style={s.kpiCard}>
                <div style={{ ...s.kpiIcon, background: k.color + '1f', color: k.color }}><Icon name={k.icon} /></div>
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
          {peakTiles.length > 0 ? (
              <div style={s.peakRow}>
                {peakTiles.map((p, i) => (
                    <div key={i} style={s.peakItem}>
                      <div style={s.peakIcon}><Icon name={p.icon} /></div>
                      <div>
                        <div style={s.peakValue}>{p.value}</div>
                        <div style={s.peakLabel}>{p.label}</div>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <div style={s.empty}>{t('stat_not_enough_data')}</div>
          )}
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>{t('stat_history_title')}</div>
          <HistoryChart history={history} t={t} lang={lang}
                        selected={selectedDate}
                        onSelect={d => setSelectedDate(cur => (cur === d ? null : d))} />
          {selectedDate && (
              <DayDetail key={selectedDate} date={selectedDate} lang={lang} t={t}
                         onClose={() => setSelectedDate(null)} />
          )}
        </div>
      </div>
  )
}

function formatHour(h, t) {
  return t('stat_hour_range', { from: String(h).padStart(2, '0'), to: String((h + 1) % 24).padStart(2, '0') })
}

// idx 0 = Montag. 2024-01-01 war ein Montag.
function weekdayName(idx, lang) {
  return new Date(2024, 0, 1 + idx).toLocaleDateString(localeTag(lang), { weekday: 'long' })
}

// Wachstums-Anzeige: Zahl diese Woche + Vergleich zur Vorwoche
function GrowthValue({ now, prev, t }) {
  let trend = null
  if (prev > 0) {
    trend = Math.round((now - prev) / prev * 100)
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
  const [value, setValue] = useState(() => (target > 0 ? 0 : target))
  useEffect(() => {
    if (target <= 0) return
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

// ── Diagramm-Helfer ────────────────────────────────────────────────────

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

function isWeekend(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = new Date(y, m - 1, d).getDay()
  return wd === 0 || wd === 6
}

// Einmalig die Balken-Einblend-Animation in den <head> haengen.
let animInjected = false
function ensureAnim() {
  if (animInjected || typeof document === 'undefined') return
  animInjected = true
  const el = document.createElement('style')
  el.textContent =
      '@keyframes oxBarGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}' +
      '.ox-bar{transform-box:fill-box;transform-origin:bottom;animation:oxBarGrow .5s cubic-bezier(.2,.7,.3,1) both}' +
      '@media (prefers-reduced-motion: reduce){.ox-bar{animation:none}}'
  document.head.appendChild(el)
}

// ── Verlaufs-Balkendiagramm (30 Tage) ──────────────────────────────────
function HistoryChart({ history, t, lang, selected, onSelect }) {
  const [hover, setHover] = useState(null)
  ensureAnim()

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
  const slotX = i => mL + slot * i
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
            {days.map((d, i) => isWeekend(d.date) && (
                <rect key={'we' + i} x={slotX(i)} y={mT} width={slot} height={plotH} fill="#f6f5fb" />
            ))}
            {days.map((d, i) => d.date === selected && (
                <rect key={'sel' + i} x={slotX(i)} y={mT} width={slot} height={plotH} fill="#e9e4fb" />
            ))}

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
              const isSel = d.date === selected
              const fill = isHover || isSel ? '#2a2570' : isToday ? '#5B4FC7' : '#3C3489'
              return (
                  <g key={i}>
                    {d.stamps > 0 && (
                        <rect className="ox-bar" style={{ animationDelay: Math.min(i * 12, 380) + 'ms' }}
                              x={slotCenter(i) - barW / 2} y={by} width={barW} height={bh} rx="2" fill={fill} />
                    )}
                    {d.rewards > 0 && (
                        <circle cx={slotCenter(i)} cy={Math.max(by - 5, mT + 3)} r="3" fill="#E0A93C" />
                    )}
                    <rect x={slotX(i)} y={mT} width={slot} height={plotH} fill="transparent" style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}
                          onClick={() => onSelect(d.date)} />
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
          <span style={{ color: '#aaa', marginInlineStart: 'auto' }}>{t('stat_tap_hint')}</span>
        </div>
      </div>
  )
}

// ── Tages-Detail: Stunden-Verteilung fuer einen angetippten Tag ────────
function DayDetail({ date, lang, t, onClose }) {
  const [d, setD] = useState(null)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ok = true
    api.get('/api/shop/stats/day', { params: { date } })
        .then(r => { if (ok) setD(r.data) })
        .catch(() => { if (ok) setErr(true) })
        .finally(() => { if (ok) setLoading(false) })
    return () => { ok = false }
  }, [date])

  return (
      <div style={s.dayPanel}>
        <div style={s.dayHead}>
          <div>
            <div style={s.dayTitle}>{weekdayShort(date, lang)} {fmtDate(date)}</div>
            <div style={s.daySub}>
              {loading ? '…' : err ? t('stat_load_error') : (
                  <>
                    <b>{d.stamps}</b> {t('dash_stat_stamps')}
                    {d.rewards > 0 && <> · <b>{d.rewards}</b> {t('stat_rewards')}</>}
                  </>
              )}
            </div>
          </div>
          <button style={s.dayClose} onClick={onClose} aria-label="X">×</button>
        </div>
        {!loading && !err && (
            d.stamps > 0
                ? <HourChart byHour={d.byHour} />
                : <div style={s.empty}>{t('stat_day_none')}</div>
        )}
      </div>
  )
}

// 24-Stunden-Balken fuer einen Tag.
function HourChart({ byHour }) {
  const hours = Array.isArray(byHour) ? byHour : new Array(24).fill(0)
  const yMax = niceMax(Math.max(...hours, 0))
  const yTicks = niceTicks(yMax)
  const W = 700, H = 150, mL = 26, mR = 6, mT = 12, mB = 22
  const plotH = H - mT - mB
  const slot = (W - mL - mR) / 24
  const barW = Math.min(slot * 0.62, 18)
  const yOf = v => mT + plotH - (v / yMax) * plotH

  return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {yTicks.map((tk, k) => (
            <g key={k}>
              <line x1={mL} x2={W - mR} y1={yOf(tk)} y2={yOf(tk)} stroke="#ecedef" strokeWidth="1" />
              <text x={mL - 6} y={yOf(tk) + 3} fontSize="9" fill="#b4b8bd" textAnchor="end">{tk}</text>
            </g>
        ))}
        {hours.map((v, h) => {
          if (v <= 0) return null
          const y = yOf(v)
          return (
              <rect key={h} className="ox-bar" style={{ animationDelay: Math.min(h * 14, 300) + 'ms' }}
                    x={mL + slot * h + (slot - barW) / 2} y={y} width={barW}
                    height={Math.max(mT + plotH - y, 1.5)} rx="2" fill="#5B4FC7" />
          )
        })}
        {[0, 6, 12, 18, 23].map(h => (
            <text key={h} x={mL + slot * h + slot / 2} y={H - 6} fontSize="9" fill="#c9cdd1" textAnchor="middle">
              {String(h).padStart(2, '0')}
            </text>
        ))}
      </svg>
  )
}

// ── Icons (schlichte Strich-SVGs statt Emojis) ────────────────────────
const ICONS = {
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.6 19c0-3 2.4-5 5.4-5s5.4 2 5.4 5" /><path d="M15.5 5.2a3 3 0 0 1 0 5.6" /><path d="M15.6 14.2c2.3.5 4.2 2.4 4.2 4.8" /></>,
  gift: <><rect x="3.5" y="9" width="17" height="11" rx="1.5" /><path d="M3.5 13h17M12 9v11" /><path d="M12 9C10 9 7.6 8.5 7.6 6.4 7.6 5.2 8.5 4.2 9.7 4.2c2 0 2.3 2.9 2.3 4.8Z" /><path d="M12 9c2 0 4.4-.5 4.4-2.6 0-1.2-.9-2.2-2.1-2.2-2 0-2.3 2.9-2.3 4.8Z" /></>,
  flame: <path d="M12 3s4.8 4.3 4.8 8.8A4.8 4.8 0 0 1 7.2 12c0-1.8.9-3.2.9-3.2s.8 1.9 1.8 1.9c0-2.9 2.1-7.7 2.1-7.7Z" />,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="1.6" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
  sun: <><circle cx="12" cy="12" r="3.8" /><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" /></>,
  avg: <><path d="M4 19h16" /><rect x="5.5" y="12" width="3" height="5" rx="0.6" /><rect x="10.5" y="8" width="3" height="9" rx="0.6" /><rect x="15.5" y="14" width="3" height="3" rx="0.6" /></>,
}
function Icon({ name, size = 22 }) {
  return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
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
  kpiIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiValue: { fontSize: 28, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.02em' },
  kpiLabel: { fontSize: 13, color: '#888', marginTop: 4 },

  derivedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 },
  derivedCard: { background: 'white', borderRadius: CARD_RADIUS, padding: 18, boxShadow: CARD_SHADOW, textAlign: 'center' },
  derivedValue: { fontSize: 24, fontWeight: 800, color: '#3C3489' },
  derivedLabel: { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 4 },
  derivedHint: { fontSize: 11, color: '#aaa', marginTop: 3 },
  counterSub: { display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#888', marginTop: 6 },

  peakRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  peakItem: { flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 12, background: '#faf9ff', borderRadius: 10, padding: 14 },
  peakIcon: { color: '#3C3489', flexShrink: 0, display: 'flex' },
  peakValue: { fontSize: 17, fontWeight: 700, color: '#1a1a1a' },
  peakLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  panel: { background: 'white', borderRadius: CARD_RADIUS, padding: 20, boxShadow: CARD_SHADOW, marginBottom: 16 },
  panelTitle: { fontSize: 11.5, fontWeight: 700, color: '#8a8f98', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', padding: '20px 0' },

  legend: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: '#555', marginBottom: 14 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 3, display: 'inline-block', flexShrink: 0 },
  tip: { position: 'absolute', top: -4, transform: 'translateX(-50%)', background: '#1a1a2e', color: 'white', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, lineHeight: 1.5, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.25)', zIndex: 2 },
  tipHead: { fontWeight: 700, marginBottom: 2, opacity: 0.85 },
  chartSummary: { display: 'flex', gap: 20, alignItems: 'center', fontSize: 13, color: '#555', marginTop: 12, flexWrap: 'wrap' },

  dayPanel: { marginTop: 16, background: '#faf9ff', border: '1px solid #efecfb', borderRadius: 12, padding: 14 },
  dayHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dayTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a1a' },
  daySub: { fontSize: 12, color: '#888', marginTop: 2 },
  dayClose: { border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, color: '#999', cursor: 'pointer', padding: '0 4px' },
}
