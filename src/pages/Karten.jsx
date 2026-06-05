import { useEffect, useRef, useState } from 'react'
import api from '../api'

// ─── Preset Icons ────────────────────────────────────────────────────────────

const PRESETS = [
  { key: 'coffee', label: '☕ Kaffee' },
  { key: 'star',   label: '⭐ Stern'  },
  { key: 'heart',  label: '❤️ Herz'  },
  { key: 'dot',    label: '● Punkt'  },
  { key: 'square', label: '■ Eckig'  },
]

const DEFAULT_DESIGN = {
  walletStyle: 'number',
  stampIconType: 'preset',
  stampPreset: 'coffee',
  stampColor: '#6F4E37',
  emptyStampStyle: 'number',
  stampIconUrl: '',
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function StarIcon({ cx, cy, r, color }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${cx + Math.cos(angle) * rad},${cy - Math.sin(angle) * rad}`
  }).join(' ')
  return <polygon points={points} fill={color} />
}

function HeartIcon({ cx, cy, size: s, color }) {
  return (
    <path d={`M ${cx} ${cy + s * 0.55} C ${cx - s * 1.2} ${cy - s * 0.2}, ${cx - s * 0.4} ${cy - s}, ${cx} ${cy - s * 0.35} C ${cx + s * 0.4} ${cy - s}, ${cx + s * 1.2} ${cy - s * 0.2}, ${cx} ${cy + s * 0.55} Z`}
      fill={color} />
  )
}

function CoffeeIcon({ cx, cy, size, color }) {
  const bw = size * 0.65, bh = size * 0.78
  const bx = cx - size * 0.38, by = cy - bh / 2
  return (
    <g>
      <rect x={bx} y={by} width={bw} height={bh} rx={bw * 0.18} fill={color} />
      <path d={`M ${bx + bw * 0.85} ${by + bh * 0.18} a ${size * 0.18} ${bh * 0.28} 0 0 1 0 ${bh * 0.52}`}
        stroke={color} strokeWidth={size * 0.1} fill="none" strokeLinecap="round" />
    </g>
  )
}

function PresetIcon({ preset, cx, cy, size, color, alpha = 1, useUpload, stampIconUrl }) {
  if (useUpload && stampIconUrl) {
    return <image href={stampIconUrl} x={cx - size / 2} y={cy - size / 2}
      width={size} height={size} opacity={alpha} preserveAspectRatio="xMidYMid meet" />
  }
  switch (preset) {
    case 'star':   return <StarIcon cx={cx} cy={cy} r={size / 2} color={color} />
    case 'heart':  return <HeartIcon cx={cx} cy={cy} size={size / 2} color={color} />
    case 'dot':    return <circle cx={cx} cy={cy} r={size / 2.2} fill={color} />
    case 'square': {
      const s = size * 0.75
      return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={s * 0.2} fill={color} />
    }
    default: return <CoffeeIcon cx={cx} cy={cy} size={size} color={color} />
  }
}

// ─── Stempel-Raster SVG ──────────────────────────────────────────────────────

function StempelRaster({ stamps, threshold, cols, stampColor, emptyStyle, preset, useUpload, stampIconUrl }) {
  const rows = Math.ceil(threshold / cols)
  const cellSize = Math.min(220 / cols, 80 / rows) * 0.85
  const w = cols * cellSize + 16
  const h = rows * cellSize + 10
  const r = cellSize * 0.38

  const items = Array.from({ length: threshold }, (_, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const itemsInRow = Math.min(cols, threshold - row * cols)
    const rowOffset = ((cols - itemsInRow) * cellSize) / 2
    const cx = 8 + rowOffset + col * cellSize + cellSize / 2
    const cy = 5 + row * cellSize + cellSize / 2
    return { cx, cy, filled: i < stamps, num: i + 1 }
  })

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      {items.map(({ cx, cy, filled, num }) => (
        <g key={num}>
          {filled ? (
            <>
              <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.92)" />
              <PresetIcon preset={preset} cx={cx} cy={cy} size={r * 1.1} color={stampColor}
                useUpload={useUpload} stampIconUrl={stampIconUrl} />
            </>
          ) : emptyStyle === 'number' ? (
            <>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fill="rgba(255,255,255,0.6)" fontSize={r * 0.85} fontWeight="700">{num}</text>
            </>
          ) : (
            <>
              <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.15)" />
              <PresetIcon preset={preset} cx={cx} cy={cy} size={r * 1.1}
                color="rgba(255,255,255,0.35)" alpha={0.4}
                useUpload={useUpload} stampIconUrl={stampIconUrl} />
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── Apple Wallet Vorschau ───────────────────────────────────────────────────

function ApplePreview({ shop, design, stamps, threshold, rewardText, cardName }) {
  const bg = shop?.colorBackground || '#3C3489'
  const fg = shop?.colorForeground || '#FFFFFF'
  const label = shop?.colorLabel || '#FAC875'
  const logoUrl = shop?.logoUrl || null
  const heroUrl = shop?.heroImageUrl || null
  const stampColor = design?.stampColor || '#6F4E37'
  const walletStyle = design?.walletStyle || 'number'
  const preset = design?.stampPreset || 'coffee'
  const emptyStyle = design?.emptyStampStyle || 'number'
  const stampIconUrl = design?.stampIconUrl || null
  const useUpload = design?.stampIconType === 'upload' && stampIconUrl
  const cols = threshold <= 5 ? threshold : Math.ceil(threshold / 2)

  return (
    <div style={pw.frame}>
      <div style={pw.notch} />
      <div style={pw.screen}>
        <div style={{ ...pw.card, background: bg, color: fg }}>
          <div style={pw.header}>
            <div style={pw.logoWrap}>
              {logoUrl ? <img src={logoUrl} alt="" style={pw.logo} />
                : <span style={{ fontSize: 9, fontWeight: 700, color: bg }}>SK</span>}
            </div>
            <span style={pw.shopName}>{shop?.name || 'Dein Laden'}</span>
            <span style={{ ...pw.count, color: label }}>{stamps}/{threshold}</span>
          </div>
          {walletStyle === 'grid' ? (
            <div style={pw.strip}>
              <StempelRaster stamps={stamps} threshold={threshold} cols={cols}
                stampColor={stampColor} emptyStyle={emptyStyle} preset={preset}
                useUpload={useUpload} stampIconUrl={stampIconUrl} />
            </div>
          ) : (
            <>
              <div style={pw.fields}>
                <div>
                  <div style={{ ...pw.fieldLabel, color: label }}>BELOHNUNG</div>
                  <div style={pw.fieldVal}>{rewardText || '—'}</div>
                </div>
                <div>
                  <div style={{ ...pw.fieldLabel, color: label }}>KARTE</div>
                  <div style={pw.fieldVal}>{cardName || '—'}</div>
                </div>
              </div>
              {heroUrl && <img src={heroUrl} alt="" style={pw.hero} />}
            </>
          )}
          <div style={pw.qrArea}><MockQR size={56} /></div>
        </div>
      </div>
    </div>
  )
}

const pw = {
  frame: { width: 220, background: '#1c1c1e', borderRadius: 32, padding: '10px 8px 14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.1)', margin: '0 auto' },
  notch: { width: 70, height: 9, background: '#1c1c1e', borderRadius: 5, margin: '0 auto 7px' },
  screen: { background: '#f2f2f7', borderRadius: 22, overflow: 'hidden', padding: 8 },
  card: { borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' },
  header: { display: 'flex', alignItems: 'center', gap: 5, padding: '9px 9px 5px' },
  logoWrap: { width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  shopName: { fontSize: 10, fontWeight: 700, flex: 1 },
  count: { fontSize: 10, fontWeight: 800 },
  strip: { padding: '5px 7px', minHeight: 65, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fields: { display: 'flex', gap: 10, padding: '3px 9px 7px' },
  fieldLabel: { fontSize: 7, fontWeight: 700, letterSpacing: 0.4, marginBottom: 1 },
  fieldVal: { fontSize: 9, fontWeight: 600 },
  hero: { width: '100%', height: 44, objectFit: 'cover', display: 'block' },
  qrArea: { display: 'flex', justifyContent: 'center', padding: 7, background: 'rgba(255,255,255,0.1)' },
}

// ─── Google Wallet Vorschau ──────────────────────────────────────────────────

function GooglePreview({ shop, stamps, threshold, rewardText, cardName }) {
  const bg = shop?.colorBackground || '#3C3489'
  const fg = shop?.colorForeground || '#FFFFFF'
  const label = shop?.colorLabel || '#FAC875'
  const logoUrl = shop?.logoUrl || null
  const heroUrl = shop?.heroImageUrl || null

  return (
    <div style={{ ...gw.card, background: bg, color: fg }}>
      <div style={gw.header}>
        <div style={gw.logoWrap}>
          {logoUrl ? <img src={logoUrl} alt="" style={gw.logoImg} />
            : <span style={{ color: '#3C3489', fontWeight: 700, fontSize: 12 }}>SK</span>}
        </div>
        <div style={gw.shopName}>{shop?.name || 'Dein Laden'}</div>
      </div>
      <div style={gw.fields}>
        <div>
          <div style={{ ...gw.fieldLabel, color: label }}>STEMPEL</div>
          <div style={gw.fieldVal}>{stamps}/{threshold}</div>
        </div>
        <div>
          <div style={{ ...gw.fieldLabel, color: label }}>BELOHNUNG</div>
          <div style={gw.fieldVal}>{rewardText || '—'}</div>
        </div>
        <div>
          <div style={{ ...gw.fieldLabel, color: label }}>KARTE</div>
          <div style={gw.fieldVal}>{cardName || '—'}</div>
        </div>
      </div>
      {heroUrl && <img src={heroUrl} alt="" style={gw.hero} />}
      <div style={gw.qrWrap}><MockQR size={68} /></div>
    </div>
  )
}

const gw = {
  card: { borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' },
  header: { display: 'flex', alignItems: 'center', gap: 9, padding: '12px 12px 7px' },
  logoWrap: { width: 32, height: 32, borderRadius: '50%', background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  shopName: { fontSize: 13, fontWeight: 600 },
  fields: { display: 'flex', gap: 14, padding: '0 12px 10px' },
  fieldLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 },
  fieldVal: { fontSize: 12, fontWeight: 600 },
  hero: { width: '100%', height: 80, objectFit: 'cover', display: 'block' },
  qrWrap: { display: 'flex', justifyContent: 'center', padding: 10, background: 'rgba(255,255,255,0.08)' },
}

function MockQR({ size = 68 }) {
  return (
    <div style={{ background: 'white', padding: 4, borderRadius: 6, display: 'inline-block' }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <rect width="80" height="80" fill="white" />
        <rect x="8" y="8" width="20" height="20" fill="black" />
        <rect x="14" y="14" width="8" height="8" fill="white" />
        <rect x="52" y="8" width="20" height="20" fill="black" />
        <rect x="58" y="14" width="8" height="8" fill="white" />
        <rect x="8" y="52" width="20" height="20" fill="black" />
        <rect x="14" y="58" width="8" height="8" fill="white" />
        <rect x="36" y="8" width="6" height="6" fill="black" />
        <rect x="36" y="20" width="6" height="6" fill="black" />
        <rect x="36" y="36" width="6" height="6" fill="black" />
        <rect x="48" y="48" width="6" height="6" fill="black" />
        <rect x="60" y="60" width="6" height="6" fill="black" />
        <rect x="48" y="60" width="6" height="6" fill="black" />
        <rect x="60" y="48" width="6" height="6" fill="black" />
      </svg>
    </div>
  )
}

// ─── Design-Panel (wiederverwendbar) ─────────────────────────────────────────

function DesignPanel({ design, onChange, cardId = null }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)
  const d = design

  async function uploadIcon(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const ext = file.name.split('.').pop()
        const endpoint = cardId
          ? `/api/shop/cards/${cardId}/stamp-icon`
          : '/api/shop/stamp-icon'
        const res = await api.post(endpoint, { base64, extension: ext })
        onChange({ ...d, stampIconUrl: res.data.stampIconUrl, stampIconType: 'upload' })
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Upload fehlgeschlagen')
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Karten-Stil */}
      <div style={dp.block}>
        <div style={dp.blockTitle}>Wallet-Stil</div>
        <div style={dp.toggleRow}>
          {[
            { val: 'number', label: '🔢 Zahlen', desc: 'Klassisch' },
            { val: 'grid',   label: '🟡 Raster', desc: 'Stempel als Grid' },
          ].map(({ val, label, desc }) => (
            <div key={val}
              style={{ ...dp.toggleCard, ...(d.walletStyle === val ? dp.active : {}) }}
              onClick={() => onChange({ ...d, walletStyle: val })}>
              <div style={dp.toggleLabel}>{label}</div>
              <div style={dp.toggleDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stempel-Icon */}
      <div style={dp.block}>
        <div style={dp.blockTitle}>Stempel-Icon</div>
        <div style={dp.toggleRow}>
          {[
            { val: 'preset', label: '🎨 Vorlage' },
            { val: 'upload', label: '📁 Eigenes Bild' },
          ].map(({ val, label }) => (
            <div key={val}
              style={{ ...dp.toggleCard, ...(d.stampIconType === val ? dp.active : {}) }}
              onClick={() => onChange({ ...d, stampIconType: val })}>
              <div style={dp.toggleLabel}>{label}</div>
            </div>
          ))}
        </div>

        {d.stampIconType === 'preset' && (
          <div style={dp.presetRow}>
            {PRESETS.map(({ key, label }) => (
              <div key={key}
                style={{ ...dp.presetBtn, ...(d.stampPreset === key ? dp.presetActive : {}) }}
                onClick={() => onChange({ ...d, stampPreset: key })}>
                {label}
              </div>
            ))}
          </div>
        )}

        {d.stampIconType === 'upload' && (
          <div style={dp.uploadRow}>
            {d.stampIconUrl && <img src={d.stampIconUrl} alt="" style={dp.uploadThumb} />}
            <button style={dp.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Lädt…' : d.stampIconUrl ? '✏️ Ändern' : '📁 Hochladen'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadIcon} />
            {d.stampIconUrl && <span style={{ fontSize: 11, color: '#2C5F2E', fontWeight: 600 }}>✓</span>}
          </div>
        )}
      </div>

      {/* Stempel-Farbe */}
      <div style={dp.block}>
        <div style={dp.blockTitle}>Stempel-Farbe</div>
        <div style={dp.colorRow}>
          {['#6F4E37','#FFD700','#E74C3C','#2ECC71','#3498DB','#9B59B6','#1A1A1A','#FFFFFF'].map(c => (
            <div key={c} style={{
              ...dp.dot,
              background: c,
              border: d.stampColor === c ? '3px solid #3C3489' : '2px solid #e0e0e0',
              transform: d.stampColor === c ? 'scale(1.25)' : 'scale(1)',
            }} onClick={() => onChange({ ...d, stampColor: c })} />
          ))}
          <input type="color" value={d.stampColor}
            onChange={e => onChange({ ...d, stampColor: e.target.value })}
            style={dp.colorPicker} title="Eigene Farbe" />
        </div>
      </div>

      {/* Leerer Stempel */}
      <div style={dp.block}>
        <div style={dp.blockTitle}>Leere Stempel</div>
        <div style={dp.toggleRow}>
          {[
            { val: 'number', label: '🔢 Nummer' },
            { val: 'faded',  label: '👻 Verblasst' },
          ].map(({ val, label }) => (
            <div key={val}
              style={{ ...dp.toggleCard, ...(d.emptyStampStyle === val ? dp.active : {}) }}
              onClick={() => onChange({ ...d, emptyStampStyle: val })}>
              <div style={dp.toggleLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const dp = {
  block: { marginBottom: 14 },
  blockTitle: { fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.8 },
  toggleRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  toggleCard: { border: '2px solid #e8e8e8', borderRadius: 8, padding: '9px 12px',
    cursor: 'pointer', background: '#fafafa', transition: 'all 0.12s' },
  active: { border: '2px solid #3C3489', background: '#f0eeff' },
  toggleLabel: { fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 1 },
  toggleDesc: { fontSize: 10, color: '#999' },
  presetRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  presetBtn: { padding: '5px 11px', borderRadius: 16, border: '2px solid #e0e0e0',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', background: '#fafafa' },
  presetActive: { border: '2px solid #3C3489', background: '#f0eeff', color: '#3C3489' },
  uploadRow: { marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 },
  uploadThumb: { width: 38, height: 38, borderRadius: 8, objectFit: 'cover', border: '2px solid #e0e0e0' },
  uploadBtn: { padding: '6px 14px', borderRadius: 7, border: '2px solid #3C3489',
    background: 'white', color: '#3C3489', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  colorRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  dot: { width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
    transition: 'transform 0.1s', flexShrink: 0 },
  colorPicker: { width: 28, height: 28, borderRadius: '50%', border: '2px solid #e0e0e0',
    padding: 2, cursor: 'pointer', background: 'none' },
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

export default function Karten() {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shop, setShop] = useState(null)
  const [previewStamps, setPreviewStamps] = useState(3)

  // Formular-State (Karte + Design zusammen)
  const [form, setForm] = useState({
    name: '', description: '', rewardThreshold: 10, rewardText: '',
  })
  const [design, setDesign] = useState({ ...DEFAULT_DESIGN })

  // Design-Bearbeitung einer bestehenden Karte
  const [editCard, setEditCard] = useState(null) // { card, design }
  const [editSaving, setEditSaving] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  useEffect(() => {
    loadCards()
    api.get('/api/shop/me').then(res => setShop(res.data))
  }, [])

  async function loadCards() {
    const res = await api.get('/api/shop/cards')
    setCards(res.data)
  }

  async function createCard() {
    if (!form.name || !form.rewardText) return alert('Bitte Name und Belohnung ausfüllen')
    setLoading(true)
    try {
      await api.post('/api/shop/cards', {
        name: form.name,
        description: form.description,
        rewardThreshold: parseInt(form.rewardThreshold),
        rewardText: form.rewardText,
        walletStyle: design.walletStyle,
        stampIconType: design.stampIconType,
        stampPreset: design.stampPreset,
        stampColor: design.stampColor,
        emptyStampStyle: design.emptyStampStyle,
      })
      setShowForm(false)
      setForm({ name: '', description: '', rewardThreshold: 10, rewardText: '' })
      setDesign({ ...DEFAULT_DESIGN })
      setPreviewStamps(3)
      loadCards()
    } catch {
      alert('Fehler beim Erstellen der Karte')
    } finally {
      setLoading(false)
    }
  }

  async function deleteCard(cardId, cardName) {
    if (!confirm(`Karte "${cardName}" wirklich deaktivieren?`)) return
    try {
      await api.delete(`/api/shop/cards/${cardId}`)
      if (editCard?.card.id === cardId) setEditCard(null)
      loadCards()
    } catch {
      alert('Fehler beim Deaktivieren')
    }
  }

  function openEdit(card) {
    setEditCard({
      card,
      design: {
        walletStyle: card.walletStyle || 'number',
        stampIconType: card.stampIconType || 'preset',
        stampPreset: card.stampPreset || 'coffee',
        stampColor: card.stampColor || '#6F4E37',
        emptyStampStyle: card.emptyStampStyle || 'number',
        stampIconUrl: card.stampIconUrl || '',
      }
    })
    setShowForm(false)
  }

  async function saveEditDesign() {
    if (!editCard) return
    setEditSaving(true)
    try {
      await api.put(`/api/shop/cards/${editCard.card.id}/design`, {
        walletStyle: editCard.design.walletStyle,
        stampIconType: editCard.design.stampIconType,
        stampPreset: editCard.design.stampPreset,
        stampColor: editCard.design.stampColor,
        emptyStampStyle: editCard.design.emptyStampStyle,
      })
      setEditSaved(true)
      setTimeout(() => setEditSaved(false), 2500)
      loadCards()
    } catch {
      alert('Fehler beim Speichern')
    } finally {
      setEditSaving(false)
    }
  }

  const threshold = parseInt(form.rewardThreshold) || 10
  const editThreshold = editCard?.card.rewardThreshold || 10

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Karten verwalten</h1>
          <p style={s.subtitle}>Erstelle und verwalte deine Stempelkarten</p>
        </div>
        <button style={s.btnPrimary} onClick={() => { setShowForm(!showForm); setEditCard(null) }}>
          {showForm ? 'Abbrechen' : '+ Neue Karte'}
        </button>
      </div>

      {/* ─── Neue Karte erstellen ─── */}
      {showForm && (
        <div style={s.panel}>
          <h2 style={s.panelTitle}>Neue Stempelkarte</h2>
          <div style={s.createGrid}>

            {/* Spalte 1: Grunddaten */}
            <div>
              <div style={s.sectionLabel}>Karten-Infos</div>
              {[
                { label: 'Kartenname', key: 'name', placeholder: 'z.B. Kaffee-Karte' },
                { label: 'Beschreibung', key: 'description', placeholder: 'z.B. 10 Stempel = 1 Gratis-Kaffee' },
                { label: 'Belohnung', key: 'rewardText', placeholder: 'z.B. Gratis-Kaffee' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} value={form[key]} placeholder={placeholder}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div style={s.field}>
                <label style={s.label}>Stempel bis Belohnung</label>
                <input style={s.input} type="number" min="1" max="100"
                  value={form.rewardThreshold}
                  onChange={e => setForm({ ...form, rewardThreshold: e.target.value })} />
              </div>

              {/* Slider */}
              <div style={{ marginTop: 16, marginBottom: 4 }}>
                <div style={s.sectionLabel}>Vorschau simulieren</div>
                <div style={s.sliderRow}>
                  <span style={s.sliderVal}>0</span>
                  <input type="range" min={0} max={threshold} value={previewStamps}
                    onChange={e => setPreviewStamps(Number(e.target.value))} style={s.slider} />
                  <span style={s.sliderVal}>{previewStamps}/{threshold}</span>
                </div>
              </div>

              <button style={s.btnCreate} onClick={createCard} disabled={loading}>
                {loading ? 'Erstelle…' : '✓ Karte erstellen'}
              </button>
            </div>

            {/* Spalte 2: Design */}
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '16px 18px' }}>
              <div style={s.sectionLabel}>Stempel-Design</div>
              <DesignPanel design={design} onChange={setDesign} />
            </div>

            {/* Spalte 3: Live-Vorschau */}
            <div>
              <div style={{ ...s.sectionLabel, marginBottom: 10 }}>
                <span style={{ ...s.dot, background: '#1c1c1e' }} /> Apple Wallet
              </div>
              <ApplePreview shop={shop} design={design} stamps={previewStamps}
                threshold={threshold} rewardText={form.rewardText} cardName={form.name} />

              <div style={{ ...s.sectionLabel, marginTop: 20, marginBottom: 10 }}>
                <span style={{ ...s.dot, background: '#4CAF50' }} /> Google Wallet
              </div>
              <GooglePreview shop={shop} stamps={previewStamps} threshold={threshold}
                rewardText={form.rewardText} cardName={form.name} />

              <p style={s.hint}>Farben & Logo aus Profil-Einstellungen</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Design einer bestehenden Karte bearbeiten ─── */}
      {editCard && (
        <div style={s.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={s.panelTitle}>Design: {editCard.card.name}</h2>
            <button style={s.btnClose} onClick={() => setEditCard(null)}>✕ Schließen</button>
          </div>
          <div style={s.editGrid}>
            {/* Design-Einstellungen */}
            <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '16px 18px' }}>
              <div style={s.sectionLabel}>Stempel-Design</div>
              <DesignPanel
                design={editCard.design}
                onChange={d => setEditCard(ec => ({ ...ec, design: d }))}
                cardId={editCard.card.id}
              />
              <button
                style={{ ...s.btnSave, ...(editSaved ? s.btnSaved : {}) }}
                onClick={saveEditDesign} disabled={editSaving}>
                {editSaved ? '✓ Gespeichert!' : editSaving ? 'Speichere…' : '💾 Design speichern'}
              </button>
            </div>

            {/* Vorschau */}
            <div>
              <div style={{ ...s.sectionLabel, marginBottom: 10 }}>
                <span style={{ ...s.dot, background: '#1c1c1e' }} /> Apple Wallet
              </div>
              <ApplePreview shop={shop} design={editCard.design}
                stamps={Math.floor(editThreshold / 2)} threshold={editThreshold}
                rewardText={editCard.card.rewardText} cardName={editCard.card.name} />

              <div style={{ ...s.sectionLabel, marginTop: 20, marginBottom: 10 }}>
                <span style={{ ...s.dot, background: '#4CAF50' }} /> Google Wallet
              </div>
              <GooglePreview shop={shop} stamps={Math.floor(editThreshold / 2)}
                threshold={editThreshold} rewardText={editCard.card.rewardText}
                cardName={editCard.card.name} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Karten-Liste ─── */}
      {cards.length === 0 ? (
        <div style={s.empty}>Noch keine Karten — klick auf "+ Neue Karte" um anzufangen!</div>
      ) : (
        <div style={s.cardGrid}>
          {cards.map(card => (
            <div key={card.id} style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.cardName}>{card.name}</div>
                <div style={s.badge}>{card.rewardThreshold} Stempel</div>
              </div>
              <div style={s.cardDesc}>{card.description}</div>
              <div style={s.cardReward}>🎁 {card.rewardText}</div>

              {/* Mini Design-Badge */}
              <div style={s.designBadge}>
                {card.walletStyle === 'grid' ? '🟡 Raster' : '🔢 Zahlen'} ·{' '}
                {PRESETS.find(p => p.key === card.stampPreset)?.label || '☕ Kaffee'}
              </div>

              <div style={s.cardId}>ID: {card.id}</div>
              <div style={s.btnRow}>
                <button style={s.btnEdit} onClick={() => openEdit(card)}>✏️ Design</button>
                <button style={s.btnDelete} onClick={() => deleteCard(card.id, card.name)}>Deaktivieren</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  btnPrimary: { background: '#3C3489', color: 'white', border: 'none',
    borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  panel: { background: 'white', borderRadius: 14, padding: 24,
    marginBottom: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  panelTitle: { fontSize: 17, fontWeight: 700, margin: '0 0 20px', color: '#1a1a1a' },
  createGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 220px', gap: 24, alignItems: 'start' },
  editGrid: { display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, alignItems: 'start' },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 5 },
  input: { padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e0e0e0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1, accentColor: '#3C3489' },
  sliderVal: { fontSize: 12, fontWeight: 700, color: '#3C3489', minWidth: 32, textAlign: 'center' },
  btnCreate: { width: '100%', marginTop: 16, padding: 13, borderRadius: 10, border: 'none',
    background: '#3C3489', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnSave: { width: '100%', marginTop: 16, padding: 12, borderRadius: 10, border: 'none',
    background: '#3C3489', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    transition: 'background 0.2s' },
  btnSaved: { background: '#2C5F2E' },
  btnClose: { background: '#f0f0f0', border: 'none', borderRadius: 8, padding: '7px 14px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555' },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 12 },
  empty: { background: 'white', borderRadius: 12, padding: 40, textAlign: 'center',
    color: '#888', fontSize: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#1a1a1a' },
  badge: { background: '#f0eeff', color: '#3C3489', borderRadius: 20,
    padding: '3px 10px', fontSize: 12, fontWeight: 600 },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 6 },
  cardReward: { fontSize: 13, color: '#2C5F2E', fontWeight: 500, marginBottom: 6 },
  designBadge: { fontSize: 11, color: '#888', background: '#f5f5f5', borderRadius: 6,
    padding: '3px 8px', display: 'inline-block', marginBottom: 8 },
  cardId: { fontSize: 11, color: '#bbb', fontFamily: 'monospace', marginBottom: 12 },
  btnRow: { display: 'flex', gap: 8 },
  btnEdit: { flex: 1, background: '#f0eeff', color: '#3C3489', border: 'none',
    borderRadius: 8, padding: '7px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnDelete: { flex: 1, background: '#fce8e6', color: '#c00', border: 'none',
    borderRadius: 8, padding: '7px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}