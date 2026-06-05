import { useEffect, useRef, useState } from 'react'
import api from '../api'

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return { r: 60, g: 52, b: 137 }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// ─── Apple Wallet Live-Vorschau ──────────────────────────────────────────────

function AppleWalletPreview({ shop, design, stamps, threshold, rewardText, cardName }) {
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
    <div style={appleStyles.frame}>
      <div style={appleStyles.notch} />
      <div style={appleStyles.screen}>
        <div style={{ ...appleStyles.card, background: bg, color: fg }}>
          {/* Header */}
          <div style={appleStyles.header}>
            <div style={appleStyles.logoWrap}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={appleStyles.logo} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: bg }}>SK</span>}
            </div>
            <span style={appleStyles.logoText}>{shop?.name || 'Dein Laden'}</span>
            <span style={{ ...appleStyles.stampCount, color: label }}>
              {stamps}/{threshold}
            </span>
          </div>

          {walletStyle === 'grid' ? (
            <div style={appleStyles.stripWrap}>
              <StempelRaster
                stamps={stamps}
                threshold={threshold}
                cols={cols}
                stampColor={stampColor}
                emptyStyle={emptyStyle}
                preset={preset}
                useUpload={useUpload}
                stampIconUrl={stampIconUrl}
              />
            </div>
          ) : (
            <>
              <div style={appleStyles.fields}>
                <div>
                  <div style={{ ...appleStyles.fieldLabel, color: label }}>BELOHNUNG</div>
                  <div style={appleStyles.fieldValue}>{rewardText || 'Gratis-Kaffee'}</div>
                </div>
                <div>
                  <div style={{ ...appleStyles.fieldLabel, color: label }}>KARTE</div>
                  <div style={appleStyles.fieldValue}>{cardName || 'Kaffee-Karte'}</div>
                </div>
              </div>
              {heroUrl && <img src={heroUrl} alt="Banner" style={appleStyles.hero} />}
            </>
          )}

          <div style={appleStyles.qrArea}>
            <MockQR size={60} />
          </div>
        </div>
      </div>
    </div>
  )
}

const appleStyles = {
  frame: {
    width: 240,
    background: '#1c1c1e',
    borderRadius: 36,
    padding: '12px 10px 16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
    margin: '0 auto',
  },
  notch: {
    width: 80, height: 10, background: '#1c1c1e',
    borderRadius: 6, margin: '0 auto 8px',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
  },
  screen: {
    background: '#f2f2f7',
    borderRadius: 26,
    overflow: 'hidden',
    padding: 10,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 10px 6px',
  },
  logoWrap: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'rgba(255,255,255,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  logo: { width: '100%', height: '100%', objectFit: 'cover' },
  logoText: { fontSize: 11, fontWeight: 700, flex: 1, letterSpacing: 0.2 },
  stampCount: { fontSize: 11, fontWeight: 800 },
  stripWrap: { padding: '6px 8px', minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fields: { display: 'flex', gap: 12, padding: '4px 10px 8px' },
  fieldLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 0.5, marginBottom: 1 },
  fieldValue: { fontSize: 10, fontWeight: 600 },
  hero: { width: '100%', height: 50, objectFit: 'cover', display: 'block' },
  qrArea: {
    display: 'flex', justifyContent: 'center',
    padding: '8px', background: 'rgba(255,255,255,0.1)',
  },
}

// ─── Stempel-Raster (SVG) ────────────────────────────────────────────────────

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
              <PresetIcon preset={preset} cx={cx} cy={cy} size={r * 1.1} color={stampColor} alpha={1} useUpload={useUpload} stampIconUrl={stampIconUrl} />
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
              <PresetIcon preset={preset} cx={cx} cy={cy} size={r * 1.1} color="rgba(255,255,255,0.35)" alpha={0.4} useUpload={useUpload} stampIconUrl={stampIconUrl} />
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

function PresetIcon({ preset, cx, cy, size, color, alpha, useUpload, stampIconUrl }) {
  if (useUpload && stampIconUrl) {
    return (
      <image href={stampIconUrl} x={cx - size / 2} y={cy - size / 2}
        width={size} height={size}
        opacity={alpha} preserveAspectRatio="xMidYMid meet" />
    )
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

// ─── Google Wallet Vorschau ──────────────────────────────────────────────────

function GoogleWalletPreview({ shop, design, stamps, threshold, rewardText, cardName }) {
  const bg = shop?.colorBackground || '#3C3489'
  const fg = shop?.colorForeground || '#FFFFFF'
  const label = shop?.colorLabel || '#FAC875'
  const logoUrl = shop?.logoUrl || null
  const heroUrl = shop?.heroImageUrl || null

  return (
    <div style={{ ...googleStyles.card, background: bg, color: fg }}>
      <div style={googleStyles.header}>
        <div style={googleStyles.logoWrap}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={googleStyles.logoImg} />
            : <span style={{ color: '#3C3489', fontWeight: 700, fontSize: 13 }}>SK</span>}
        </div>
        <div style={googleStyles.shopName}>{shop?.name || 'Dein Laden'}</div>
      </div>
      <div style={googleStyles.fields}>
        <div>
          <div style={{ ...googleStyles.fieldLabel, color: label }}>STEMPEL</div>
          <div style={googleStyles.fieldValue}>{stamps}/{threshold}</div>
        </div>
        <div>
          <div style={{ ...googleStyles.fieldLabel, color: label }}>BELOHNUNG</div>
          <div style={googleStyles.fieldValue}>{rewardText || '—'}</div>
        </div>
        <div>
          <div style={{ ...googleStyles.fieldLabel, color: label }}>KARTE</div>
          <div style={googleStyles.fieldValue}>{cardName || '—'}</div>
        </div>
      </div>
      {heroUrl && <img src={heroUrl} alt="Banner" style={googleStyles.hero} />}
      <div style={googleStyles.qrWrap}>
        <MockQR size={72} />
      </div>
    </div>
  )
}

const googleStyles = {
  card: { borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 8px' },
  logoWrap: {
    width: 36, height: 36, borderRadius: '50%', background: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  shopName: { fontSize: 14, fontWeight: 600 },
  fields: { display: 'flex', gap: 16, padding: '0 14px 12px' },
  fieldLabel: { fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 },
  fieldValue: { fontSize: 13, fontWeight: 600 },
  hero: { width: '100%', height: 90, objectFit: 'cover', display: 'block' },
  qrWrap: { display: 'flex', justifyContent: 'center', padding: 12, background: 'rgba(255,255,255,0.08)' },
}

// ─── Mock QR-Code ────────────────────────────────────────────────────────────

function MockQR({ size = 72 }) {
  return (
    <div style={{ background: 'white', padding: 5, borderRadius: 8, display: 'inline-block' }}>
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

// ─── Design-Tab ──────────────────────────────────────────────────────────────

const PRESETS = [
  { key: 'coffee', label: '☕ Kaffee' },
  { key: 'star',   label: '⭐ Stern'  },
  { key: 'heart',  label: '❤️ Herz'  },
  { key: 'dot',    label: '● Punkt'  },
  { key: 'square', label: '■ Eckig'  },
]

function DesignTab({ shop }) {
  const fileRef = useRef()
  const [design, setDesign] = useState({
    walletStyle: 'number',
    stampIconType: 'preset',
    stampPreset: 'coffee',
    stampColor: '#6F4E37',
    emptyStampStyle: 'number',
    stampIconUrl: '',
  })
  const [previewStamps, setPreviewStamps] = useState(3)
  const PREVIEW_THRESHOLD = 8
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/api/shop/design').then(res => setDesign(res.data)).catch(() => {})
  }, [])

  async function saveDesign() {
    setSaving(true)
    try {
      const res = await api.put('/api/shop/design', {
        walletStyle: design.walletStyle,
        stampIconType: design.stampIconType,
        stampPreset: design.stampPreset,
        stampColor: design.stampColor,
        emptyStampStyle: design.emptyStampStyle,
      })
      setDesign(d => ({ ...d, ...res.data }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  async function uploadIcon(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1]
        const ext = file.name.split('.').pop()
        const res = await api.post('/api/shop/stamp-icon', { base64, extension: ext })
        setDesign(d => ({ ...d, stampIconUrl: res.data.stampIconUrl, stampIconType: 'upload' }))
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      alert('Upload fehlgeschlagen')
      setUploading(false)
    }
  }

  const d = design

  return (
    <div style={ds.grid}>
      {/* ─── Linke Spalte: Einstellungen ─── */}
      <div>

        {/* Karten-Stil */}
        <div style={ds.section}>
          <div style={ds.sectionTitle}>Karten-Stil</div>
          <div style={ds.toggleRow}>
            {[
              { val: 'number', label: '🔢 Zahlen-Stil', desc: 'Klassisch mit Belohnungstext' },
              { val: 'grid',   label: '🟡 Raster-Stil', desc: 'Stempel als Bild-Grid' },
            ].map(({ val, label, desc }) => (
              <div
                key={val}
                style={{ ...ds.toggleCard, ...(d.walletStyle === val ? ds.toggleCardActive : {}) }}
                onClick={() => setDesign(prev => ({ ...prev, walletStyle: val }))}
              >
                <div style={ds.toggleLabel}>{label}</div>
                <div style={ds.toggleDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stempel-Icon */}
        <div style={ds.section}>
          <div style={ds.sectionTitle}>Stempel-Icon</div>
          <div style={ds.toggleRow}>
            {[
              { val: 'preset', label: '🎨 Vorlage',      desc: 'Aus unseren Icons wählen' },
              { val: 'upload', label: '📁 Eigenes Bild', desc: 'PNG/JPG hochladen' },
            ].map(({ val, label, desc }) => (
              <div
                key={val}
                style={{ ...ds.toggleCard, ...(d.stampIconType === val ? ds.toggleCardActive : {}) }}
                onClick={() => setDesign(prev => ({ ...prev, stampIconType: val }))}
              >
                <div style={ds.toggleLabel}>{label}</div>
                <div style={ds.toggleDesc}>{desc}</div>
              </div>
            ))}
          </div>

          {d.stampIconType === 'preset' && (
            <div style={ds.presetGrid}>
              {PRESETS.map(({ key, label }) => (
                <div
                  key={key}
                  style={{ ...ds.presetBtn, ...(d.stampPreset === key ? ds.presetBtnActive : {}) }}
                  onClick={() => setDesign(prev => ({ ...prev, stampPreset: key }))}
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          {d.stampIconType === 'upload' && (
            <div style={ds.uploadArea}>
              {d.stampIconUrl && (
                <img src={d.stampIconUrl} alt="Icon" style={ds.uploadPreview} />
              )}
              <button
                style={ds.uploadBtn}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Lädt hoch…' : d.stampIconUrl ? '✏️ Bild ändern' : '📁 Bild auswählen'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadIcon} />
              {d.stampIconUrl && <span style={ds.uploadHint}>✓ Gespeichert</span>}
            </div>
          )}
        </div>

        {/* Stempel-Farbe */}
        <div style={ds.section}>
          <div style={ds.sectionTitle}>Stempel-Farbe</div>
          <div style={ds.colorRow}>
            {['#6F4E37','#FFD700','#E74C3C','#2ECC71','#3498DB','#9B59B6','#1A1A1A','#FFFFFF'].map(c => (
              <div
                key={c}
                style={{
                  ...ds.colorDot,
                  background: c,
                  border: d.stampColor === c ? '3px solid #3C3489' : '2px solid #e0e0e0',
                  transform: d.stampColor === c ? 'scale(1.25)' : 'scale(1)',
                }}
                onClick={() => setDesign(prev => ({ ...prev, stampColor: c }))}
              />
            ))}
            <input
              type="color"
              value={d.stampColor}
              onChange={e => setDesign(prev => ({ ...prev, stampColor: e.target.value }))}
              style={ds.colorPicker}
              title="Eigene Farbe"
            />
          </div>
        </div>

        {/* Leerer Stempel-Stil */}
        <div style={ds.section}>
          <div style={ds.sectionTitle}>Leere Stempel anzeigen als</div>
          <div style={ds.toggleRow}>
            {[
              { val: 'number', label: '🔢 Nummer',    desc: 'Zahl im Kreis' },
              { val: 'faded',  label: '👻 Verblasst', desc: 'Icon hell/transparent' },
            ].map(({ val, label, desc }) => (
              <div
                key={val}
                style={{ ...ds.toggleCard, ...(d.emptyStampStyle === val ? ds.toggleCardActive : {}) }}
                onClick={() => setDesign(prev => ({ ...prev, emptyStampStyle: val }))}
              >
                <div style={ds.toggleLabel}>{label}</div>
                <div style={ds.toggleDesc}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vorschau-Slider */}
        <div style={ds.section}>
          <div style={ds.sectionTitle}>Vorschau: Stempel simulieren</div>
          <div style={ds.sliderRow}>
            <span style={ds.sliderVal}>0</span>
            <input
              type="range" min={0} max={PREVIEW_THRESHOLD}
              value={previewStamps}
              onChange={e => setPreviewStamps(Number(e.target.value))}
              style={ds.slider}
            />
            <span style={ds.sliderVal}>{previewStamps}/{PREVIEW_THRESHOLD}</span>
          </div>
        </div>

        {/* Speichern */}
        <button
          style={{ ...ds.saveBtn, ...(saved ? ds.saveBtnSuccess : {}) }}
          onClick={saveDesign}
          disabled={saving}
        >
          {saved ? '✓ Gespeichert!' : saving ? 'Speichere…' : '💾 Design speichern'}
        </button>
      </div>

      {/* ─── Rechte Spalte: Live-Vorschauen ─── */}
      <div>
        <div style={ds.previewBadge}>
          <span style={{ ...ds.dot, background: '#1c1c1e' }} /> Apple Wallet
        </div>
        <AppleWalletPreview
          shop={shop}
          design={d}
          stamps={previewStamps}
          threshold={PREVIEW_THRESHOLD}
          rewardText="Gratis-Kaffee"
          cardName="Kaffee-Karte"
        />

        <div style={{ ...ds.previewBadge, marginTop: 28 }}>
          <span style={{ ...ds.dot, background: '#4CAF50' }} /> Google Wallet
        </div>
        <GoogleWalletPreview
          shop={shop}
          design={d}
          stamps={previewStamps}
          threshold={PREVIEW_THRESHOLD}
          rewardText="Gratis-Kaffee"
          cardName="Kaffee-Karte"
        />

        <p style={ds.note}>ℹ️ Farben & Logo kommen aus den Profil-Einstellungen</p>
      </div>
    </div>
  )
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

export default function Karten() {
  const [activeTab, setActiveTab] = useState('karten')
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shop, setShop] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    rewardThreshold: 10,
    rewardText: '',
  })

  useEffect(() => {
    loadCards()
    api.get('/api/shop/me').then(res => setShop(res.data))
  }, [])

  async function loadCards() {
    const res = await api.get('/api/shop/cards')
    setCards(res.data)
  }

  async function createCard() {
    setLoading(true)
    try {
      await api.post('/api/shop/cards', {
        ...form,
        rewardThreshold: parseInt(form.rewardThreshold),
      })
      setShowForm(false)
      setForm({ name: '', description: '', rewardThreshold: 10, rewardText: '' })
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
      loadCards()
    } catch {
      alert('Fehler beim Deaktivieren')
    }
  }

  const threshold = parseInt(form.rewardThreshold) || 10

  return (
    <div>
      {/* ─── Tabs ─── */}
      <div style={styles.tabRow}>
        {[
          { key: 'karten', label: '🃏 Karten verwalten' },
          { key: 'design', label: '🎨 Karten-Design' },
        ].map(({ key, label }) => (
          <button
            key={key}
            style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Karten verwalten ─── */}
      {activeTab === 'karten' && (
        <>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Karten verwalten</h1>
              <p style={styles.subtitle}>Erstelle und verwalte deine Stempelkarten</p>
            </div>
            <button style={styles.btnPrimary} onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Abbrechen' : '+ Neue Karte'}
            </button>
          </div>

          {showForm && (
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>Neue Stempelkarte</h2>
              <div style={styles.formLayout}>
                <div>
                  {[
                    { label: 'Kartenname', key: 'name', placeholder: 'z.B. Kaffee-Karte', type: 'text' },
                    { label: 'Beschreibung', key: 'description', placeholder: 'z.B. 10 Stempel = 1 Gratis-Kaffee', type: 'text' },
                    { label: 'Belohnung', key: 'rewardText', placeholder: 'z.B. Gratis-Kaffee', type: 'text' },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key} style={styles.field}>
                      <label style={styles.label}>{label}</label>
                      <input style={styles.input} value={form[key]} type={type}
                        placeholder={placeholder}
                        onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div style={styles.field}>
                    <label style={styles.label}>Stempel bis Belohnung</label>
                    <input style={styles.input} type="number" min="1" max="100"
                      value={form.rewardThreshold}
                      onChange={e => setForm({ ...form, rewardThreshold: e.target.value })} />
                  </div>
                  <button style={styles.btnCreate} type="button" onClick={createCard} disabled={loading}>
                    {loading ? 'Erstelle...' : 'Karte erstellen'}
                  </button>
                </div>

                <div>
                  <div style={styles.previewLabel}>Vorschau Google Wallet</div>
                  <GoogleWalletPreview
                    shop={shop}
                    design={null}
                    stamps={0}
                    threshold={threshold}
                    rewardText={form.rewardText}
                    cardName={form.name}
                  />
                  <p style={styles.previewHint}>Farben & Logo aus Profil-Einstellungen</p>
                </div>
              </div>
            </div>
          )}

          {cards.length === 0 ? (
            <div style={styles.empty}>
              Noch keine Karten vorhanden — klick auf "+ Neue Karte" um anzufangen!
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {cards.map(card => (
                <div key={card.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardName}>{card.name}</div>
                    <div style={styles.badge}>{card.rewardThreshold} Stempel</div>
                  </div>
                  <div style={styles.cardDesc}>{card.description}</div>
                  <div style={styles.cardReward}>Belohnung: {card.rewardText}</div>
                  <div style={styles.cardId}>ID: {card.id}</div>
                  <button style={styles.btnDelete} onClick={() => deleteCard(card.id, card.name)}>
                    Deaktivieren
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── TAB: Design ─── */}
      {activeTab === 'design' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={styles.title}>Karten-Design</h1>
            <p style={styles.subtitle}>Passe das Aussehen deiner Wallet-Karten an</p>
          </div>
          <DesignTab shop={shop} />
        </>
      )}
    </div>
  )
}

// ─── Styles (Karten-Tab) ─────────────────────────────────────────────────────

const styles = {
  tabRow: {
    display: 'flex', gap: 4, marginBottom: 28,
    borderBottom: '2px solid #efefef', paddingBottom: 0,
  },
  tab: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#999',
    borderBottom: '2px solid transparent', marginBottom: -2,
    borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
  },
  tabActive: { color: '#3C3489', borderBottom: '2px solid #3C3489', background: 'rgba(60,52,137,0.04)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#888', margin: 0 },
  btnPrimary: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  formCard: {
    background: 'white', borderRadius: 12, padding: 24,
    marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  formTitle: { fontSize: 18, fontWeight: 600, margin: '0 0 20px', color: '#1a1a1a' },
  formLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' },
  field: { display: 'flex', flexDirection: 'column', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 6 },
  input: {
    padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  btnCreate: {
    background: '#3C3489', color: 'white', border: 'none',
    borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', width: '100%', marginTop: 4,
  },
  previewLabel: { fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 10 },
  previewHint: { fontSize: 11, color: '#aaa', margin: '8px 0 0', textAlign: 'center' },
  empty: {
    background: 'white', borderRadius: 12, padding: 40,
    textAlign: 'center', color: '#888', fontSize: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#1a1a1a' },
  badge: { background: '#f0eeff', color: '#3C3489', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardReward: { fontSize: 13, color: '#2C5F2E', fontWeight: 500, marginBottom: 8 },
  cardId: { fontSize: 11, color: '#bbb', fontFamily: 'monospace', marginBottom: 12 },
  btnDelete: {
    background: '#fce8e6', color: '#c00', border: 'none',
    borderRadius: 8, padding: '7px 14px', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', width: '100%',
  },
}

// ─── Styles (Design-Tab) ─────────────────────────────────────────────────────

const ds = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 260px', gap: 32, alignItems: 'start' },
  section: {
    background: 'white', borderRadius: 12, padding: '18px 20px',
    marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 800, color: '#888', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  toggleRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  toggleCard: {
    border: '2px solid #e8e8e8', borderRadius: 10, padding: '11px 14px',
    cursor: 'pointer', transition: 'all 0.15s', background: '#fafafa',
  },
  toggleCardActive: { border: '2px solid #3C3489', background: '#f0eeff' },
  toggleLabel: { fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 },
  toggleDesc: { fontSize: 11, color: '#999' },
  presetGrid: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  presetBtn: {
    padding: '6px 14px', borderRadius: 20, border: '2px solid #e0e0e0',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#fafafa',
    transition: 'all 0.12s',
  },
  presetBtnActive: { border: '2px solid #3C3489', background: '#f0eeff', color: '#3C3489' },
  uploadArea: { marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  uploadPreview: { width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid #e0e0e0' },
  uploadBtn: {
    padding: '8px 16px', borderRadius: 8, border: '2px solid #3C3489',
    background: 'white', color: '#3C3489', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  uploadHint: { fontSize: 11, color: '#2C5F2E', fontWeight: 600 },
  colorRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  colorDot: {
    width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
    transition: 'transform 0.12s', flexShrink: 0,
  },
  colorPicker: {
    width: 30, height: 30, borderRadius: '50%', border: '2px solid #e0e0e0',
    padding: 2, cursor: 'pointer', background: 'none',
  },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 12 },
  slider: { flex: 1, accentColor: '#3C3489' },
  sliderVal: { fontSize: 13, fontWeight: 700, color: '#3C3489', minWidth: 36, textAlign: 'center' },
  saveBtn: {
    width: '100%', padding: 14, borderRadius: 12, border: 'none',
    background: '#3C3489', color: 'white', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.2s',
  },
  saveBtnSuccess: { background: '#2C5F2E' },
  previewBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  note: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 16 },
}