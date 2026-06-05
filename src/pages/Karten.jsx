import { useEffect, useRef, useState } from 'react'
import api from '../api'

const PRESETS = [
  { key: 'coffee', label: '☕ Kaffee' },
  { key: 'star',   label: '⭐ Stern'  },
  { key: 'heart',  label: '❤️ Herz'  },
  { key: 'dot',    label: '● Punkt'  },
  { key: 'square', label: '■ Eckig'  },
]

const DEFAULT_DESIGN = {
  colorBackground: '#3C3489',
  colorForeground: '#FFFFFF',
  colorLabel: '#FAC875',
  logoUrl: '',
  heroImageUrl: '',
  walletStyle: 'number',
  stampIconType: 'preset',
  stampPreset: 'coffee',
  stampColor: '#6F4E37',
  emptyStampStyle: 'number',
  stampIconUrl: '',
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function StarIcon({ cx, cy, r, color }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${cx + Math.cos(a) * rad},${cy - Math.sin(a) * rad}`
  }).join(' ')
  return <polygon points={pts} fill={color} />
}
function HeartIcon({ cx, cy, size: s, color }) {
  return <path d={`M ${cx} ${cy+s*.55} C ${cx-s*1.2} ${cy-s*.2},${cx-s*.4} ${cy-s},${cx} ${cy-s*.35} C ${cx+s*.4} ${cy-s},${cx+s*1.2} ${cy-s*.2},${cx} ${cy+s*.55} Z`} fill={color}/>
}
function CoffeeIcon({ cx, cy, size, color }) {
  const bw=size*.65,bh=size*.78,bx=cx-size*.38,by=cy-bh/2
  return <g><rect x={bx} y={by} width={bw} height={bh} rx={bw*.18} fill={color}/><path d={`M ${bx+bw*.85} ${by+bh*.18} a ${size*.18} ${bh*.28} 0 0 1 0 ${bh*.52}`} stroke={color} strokeWidth={size*.1} fill="none" strokeLinecap="round"/></g>
}
function PresetIcon({ preset, cx, cy, size, color, alpha=1, useUpload, stampIconUrl }) {
  if (useUpload && stampIconUrl) return <image href={stampIconUrl} x={cx-size/2} y={cy-size/2} width={size} height={size} opacity={alpha} preserveAspectRatio="xMidYMid meet"/>
  switch(preset) {
    case 'star':   return <StarIcon cx={cx} cy={cy} r={size/2} color={color}/>
    case 'heart':  return <HeartIcon cx={cx} cy={cy} size={size/2} color={color}/>
    case 'dot':    return <circle cx={cx} cy={cy} r={size/2.2} fill={color}/>
    case 'square': { const s=size*.75; return <rect x={cx-s/2} y={cy-s/2} width={s} height={s} rx={s*.2} fill={color}/> }
    default: return <CoffeeIcon cx={cx} cy={cy} size={size} color={color}/>
  }
}

function StempelRaster({ stamps, threshold, stampColor, emptyStyle, preset, useUpload, stampIconUrl }) {
  const cols = threshold<=5 ? threshold : Math.ceil(threshold/2)
  const rows = Math.ceil(threshold/cols)
  const cellSize = Math.min(200/cols, 75/rows)*.85
  const w=cols*cellSize+16, h=rows*cellSize+10, r=cellSize*.38
  const items = Array.from({length:threshold},(_,i)=>{
    const col=i%cols,row=Math.floor(i/cols)
    const rowOffset=((cols-Math.min(cols,threshold-row*cols))*cellSize)/2
    return {cx:8+rowOffset+col*cellSize+cellSize/2, cy:5+row*cellSize+cellSize/2, filled:i<stamps, num:i+1}
  })
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      {items.map(({cx,cy,filled,num})=>(
        <g key={num}>
          {filled ? (<><circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.92)"/><PresetIcon preset={preset} cx={cx} cy={cy} size={r*1.1} color={stampColor} useUpload={useUpload} stampIconUrl={stampIconUrl}/></>) :
           emptyStyle==='number' ? (<><circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1}/><text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.6)" fontSize={r*.85} fontWeight="700">{num}</text></>) :
           (<><circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.15)"/><PresetIcon preset={preset} cx={cx} cy={cy} size={r*1.1} color="rgba(255,255,255,0.35)" alpha={0.4} useUpload={useUpload} stampIconUrl={stampIconUrl}/></>)}
        </g>
      ))}
    </svg>
  )
}

function MockQR({ size=64 }) {
  return (
    <div style={{background:'white',padding:4,borderRadius:6,display:'inline-block'}}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <rect width="80" height="80" fill="white"/>
        <rect x="8" y="8" width="20" height="20" fill="black"/><rect x="14" y="14" width="8" height="8" fill="white"/>
        <rect x="52" y="8" width="20" height="20" fill="black"/><rect x="58" y="14" width="8" height="8" fill="white"/>
        <rect x="8" y="52" width="20" height="20" fill="black"/><rect x="14" y="58" width="8" height="8" fill="white"/>
        <rect x="36" y="8" width="6" height="6" fill="black"/><rect x="36" y="20" width="6" height="6" fill="black"/>
        <rect x="36" y="36" width="6" height="6" fill="black"/><rect x="48" y="48" width="6" height="6" fill="black"/>
        <rect x="60" y="60" width="6" height="6" fill="black"/><rect x="48" y="60" width="6" height="6" fill="black"/>
        <rect x="60" y="48" width="6" height="6" fill="black"/>
      </svg>
    </div>
  )
}

// ─── Wallet Vorschauen ───────────────────────────────────────────────────────

function ApplePreview({ design, stamps, threshold, rewardText, cardName }) {
  const d = {...DEFAULT_DESIGN, ...design}
  const useUpload = d.stampIconType==='upload' && d.stampIconUrl
  const cols = threshold<=5 ? threshold : Math.ceil(threshold/2)
  return (
    <div style={{width:210,background:'#1c1c1e',borderRadius:30,padding:'10px 8px 14px',boxShadow:'0 16px 48px rgba(0,0,0,0.45)',margin:'0 auto'}}>
      <div style={{width:65,height:8,background:'#333',borderRadius:4,margin:'0 auto 7px'}}/>
      <div style={{background:'#f2f2f7',borderRadius:20,overflow:'hidden',padding:8}}>
        <div style={{borderRadius:11,overflow:'hidden',background:d.colorBackground,color:d.colorForeground,boxShadow:'0 4px 14px rgba(0,0,0,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'8px 8px 5px'}}>
            <div style={{width:20,height:20,borderRadius:'50%',background:'rgba(255,255,255,0.95)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
              {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:8,fontWeight:700,color:d.colorBackground}}>SK</span>}
            </div>
            <span style={{fontSize:10,fontWeight:700,flex:1}}>{cardName||'Karte'}</span>
            <span style={{fontSize:10,fontWeight:800,color:d.colorLabel}}>{stamps}/{threshold}</span>
          </div>
          {d.walletStyle==='grid' ? (
            <div style={{padding:'5px 7px',minHeight:60,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={useUpload} stampIconUrl={d.stampIconUrl}/>
            </div>
          ) : (
            <>
              <div style={{display:'flex',gap:10,padding:'3px 8px 7px'}}>
                <div><div style={{fontSize:7,fontWeight:700,letterSpacing:0.4,color:d.colorLabel,marginBottom:1}}>BELOHNUNG</div><div style={{fontSize:9,fontWeight:600}}>{rewardText||'—'}</div></div>
                <div><div style={{fontSize:7,fontWeight:700,letterSpacing:0.4,color:d.colorLabel,marginBottom:1}}>KARTE</div><div style={{fontSize:9,fontWeight:600}}>{cardName||'—'}</div></div>
              </div>
              {d.heroImageUrl && <img src={d.heroImageUrl} alt="" style={{width:'100%',height:40,objectFit:'cover',display:'block'}}/>}
            </>
          )}
          <div style={{display:'flex',justifyContent:'center',padding:7,background:'rgba(255,255,255,0.1)'}}><MockQR size={52}/></div>
        </div>
      </div>
    </div>
  )
}

function GooglePreview({ design, stamps, threshold, rewardText, cardName }) {
  const d = {...DEFAULT_DESIGN, ...design}
  return (
    <div style={{borderRadius:14,overflow:'hidden',background:d.colorBackground,color:d.colorForeground,boxShadow:'0 6px 20px rgba(0,0,0,0.15)'}}>
      <div style={{display:'flex',alignItems:'center',gap:9,padding:'12px 12px 7px'}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
          {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{color:'#3C3489',fontWeight:700,fontSize:11}}>SK</span>}
        </div>
        <div style={{fontSize:13,fontWeight:600}}>{cardName||'Karte'}</div>
      </div>
      <div style={{display:'flex',gap:14,padding:'0 12px 10px'}}>
        <div><div style={{fontSize:9,fontWeight:700,letterSpacing:0.5,color:d.colorLabel,marginBottom:2}}>STEMPEL</div><div style={{fontSize:12,fontWeight:600}}>{stamps}/{threshold}</div></div>
        <div><div style={{fontSize:9,fontWeight:700,letterSpacing:0.5,color:d.colorLabel,marginBottom:2}}>BELOHNUNG</div><div style={{fontSize:12,fontWeight:600}}>{rewardText||'—'}</div></div>
      </div>
      {d.heroImageUrl && <img src={d.heroImageUrl} alt="" style={{width:'100%',height:75,objectFit:'cover',display:'block'}}/>}
      <div style={{display:'flex',justifyContent:'center',padding:10,background:'rgba(255,255,255,0.08)'}}><MockQR size={60}/></div>
    </div>
  )
}

// ─── Komplettes Design Panel ─────────────────────────────────────────────────

function DesignPanel({ design, onChange, cardId=null }) {
  const logoRef = useRef()
  const heroRef = useRef()
  const stampRef = useRef()
  const [uploading, setUploading] = useState('')
  const d = design

  async function upload(file, endpoint, field) {
    if (!file) return
    setUploading(field)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target.result.split(',')[1]
        const ext = file.name.split('.').pop()
        const res = await api.post(endpoint, {base64, extension:ext})
        onChange({...d, ...res.data})
      } catch { alert('Upload fehlgeschlagen') }
      setUploading('')
    }
    reader.readAsDataURL(file)
  }

  const logoEndpoint = cardId ? `/api/shop/cards/${cardId}/logo` : '/api/shop/logo'
  const heroEndpoint = cardId ? `/api/shop/cards/${cardId}/hero` : '/api/shop/hero'
  const stampEndpoint = cardId ? `/api/shop/cards/${cardId}/stamp-icon` : '/api/shop/stamp-icon'

  return (
    <div>
      {/* ── Farben ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>🎨 Farben</div>
        {[
          {label:'Hintergrund', key:'colorBackground'},
          {label:'Textfarbe',   key:'colorForeground'},
          {label:'Label-Farbe', key:'colorLabel'},
        ].map(({label,key})=>(
          <div key={key} style={dp.field}>
            <label style={dp.label}>{label}</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="color" value={d[key]} onChange={e=>onChange({...d,[key]:e.target.value})}
                style={{width:40,height:40,border:'none',borderRadius:8,cursor:'pointer',padding:2,flexShrink:0}}/>
              <input style={dp.input} value={d[key]} onChange={e=>onChange({...d,[key]:e.target.value})} placeholder="#3C3489"/>
            </div>
          </div>
        ))}
      </div>

      {/* ── Logo ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>🖼️ Logo</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:52,height:52,borderRadius:10,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
            {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:11,color:'#aaa'}}>SK</span>}
          </div>
          <div>
            <button style={dp.uploadBtn} onClick={()=>logoRef.current?.click()} disabled={uploading==='logo'}>
              {uploading==='logo'?'Lädt…':'📁 Logo hochladen'}
            </button>
            <div style={{fontSize:11,color:'#aaa',marginTop:4}}>PNG, empfohlen 480×150px</div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>upload(e.target.files[0], logoEndpoint, 'logo')}/>
        </div>
      </div>

      {/* ── Banner ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>🌅 Banner</div>
        {d.heroImageUrl ? (
          <img src={d.heroImageUrl} alt="" style={{width:'100%',height:70,objectFit:'cover',borderRadius:8,marginBottom:8}}/>
        ) : (
          <div style={{width:'100%',height:50,background:'#f5f5f7',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
            <span style={{fontSize:12,color:'#bbb'}}>Kein Banner</span>
          </div>
        )}
        <button style={dp.uploadBtn} onClick={()=>heroRef.current?.click()} disabled={uploading==='hero'}>
          {uploading==='hero'?'Lädt…':'📁 Banner hochladen'}
        </button>
        <div style={{fontSize:11,color:'#aaa',marginTop:4}}>PNG/JPG, empfohlen 1125×369px</div>
        <input ref={heroRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>upload(e.target.files[0], heroEndpoint, 'hero')}/>
      </div>

      {/* ── Wallet-Stil ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>📱 Wallet-Stil</div>
        <div style={dp.row2}>
          {[{val:'number',label:'🔢 Zahlen',desc:'Klassisch'},{val:'grid',label:'🟡 Raster',desc:'Stempel-Grid'}].map(({val,label,desc})=>(
            <div key={val} style={{...dp.card,...(d.walletStyle===val?dp.active:{})}} onClick={()=>onChange({...d,walletStyle:val})}>
              <div style={dp.cardLabel}>{label}</div><div style={dp.cardDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stempel-Icon ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>✏️ Stempel-Icon</div>
        <div style={dp.row2}>
          {[{val:'preset',label:'🎨 Vorlage'},{val:'upload',label:'📁 Eigenes'}].map(({val,label})=>(
            <div key={val} style={{...dp.card,...(d.stampIconType===val?dp.active:{})}} onClick={()=>onChange({...d,stampIconType:val})}>
              <div style={dp.cardLabel}>{label}</div>
            </div>
          ))}
        </div>
        {d.stampIconType==='preset' && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
            {PRESETS.map(({key,label})=>(
              <div key={key} style={{...dp.preset,...(d.stampPreset===key?dp.presetActive:{})}} onClick={()=>onChange({...d,stampPreset:key})}>{label}</div>
            ))}
          </div>
        )}
        {d.stampIconType==='upload' && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8}}>
            {d.stampIconUrl && <img src={d.stampIconUrl} alt="" style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'2px solid #e0e0e0'}}/>}
            <button style={dp.uploadBtn} onClick={()=>stampRef.current?.click()} disabled={uploading==='stamp'}>
              {uploading==='stamp'?'Lädt…':d.stampIconUrl?'✏️ Ändern':'📁 Hochladen'}
            </button>
            <input ref={stampRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>upload(e.target.files[0], stampEndpoint, 'stamp')}/>
          </div>
        )}
      </div>

      {/* ── Stempel-Farbe ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>🎨 Stempel-Farbe</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {['#6F4E37','#FFD700','#E74C3C','#2ECC71','#3498DB','#9B59B6','#1A1A1A','#FFFFFF'].map(c=>(
            <div key={c} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',flexShrink:0,
              border:d.stampColor===c?'3px solid #3C3489':'2px solid #e0e0e0',
              transform:d.stampColor===c?'scale(1.25)':'scale(1)',transition:'transform 0.1s'}}
              onClick={()=>onChange({...d,stampColor:c})}/>
          ))}
          <input type="color" value={d.stampColor} onChange={e=>onChange({...d,stampColor:e.target.value})}
            style={{width:28,height:28,borderRadius:'50%',border:'2px solid #e0e0e0',padding:2,cursor:'pointer'}}/>
        </div>
      </div>

      {/* ── Leere Stempel ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>⭕ Leere Stempel</div>
        <div style={dp.row2}>
          {[{val:'number',label:'🔢 Nummer'},{val:'faded',label:'👻 Verblasst'}].map(({val,label})=>(
            <div key={val} style={{...dp.card,...(d.emptyStampStyle===val?dp.active:{})}} onClick={()=>onChange({...d,emptyStampStyle:val})}>
              <div style={dp.cardLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const dp = {
  section: {marginBottom:16},
  sectionTitle: {fontSize:11,fontWeight:800,color:'#888',marginBottom:10,textTransform:'uppercase',letterSpacing:0.8},
  field: {marginBottom:10},
  label: {fontSize:12,fontWeight:500,color:'#555',marginBottom:5,display:'block'},
  input: {flex:1,padding:'8px 12px',borderRadius:8,border:'1.5px solid #e0e0e0',fontSize:13,outline:'none',boxSizing:'border-box'},
  row2: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:8},
  card: {border:'2px solid #e8e8e8',borderRadius:8,padding:'9px 12px',cursor:'pointer',background:'#fafafa'},
  active: {border:'2px solid #3C3489',background:'#f0eeff'},
  cardLabel: {fontSize:12,fontWeight:700,color:'#1a1a1a',marginBottom:1},
  cardDesc: {fontSize:10,color:'#999'},
  preset: {padding:'5px 11px',borderRadius:16,border:'2px solid #e0e0e0',fontSize:12,fontWeight:600,cursor:'pointer',background:'#fafafa'},
  presetActive: {border:'2px solid #3C3489',background:'#f0eeff',color:'#3C3489'},
  uploadBtn: {padding:'7px 14px',borderRadius:7,border:'2px solid #3C3489',background:'white',color:'#3C3489',fontSize:12,fontWeight:600,cursor:'pointer'},
}

// ─── Haupt-Komponente ────────────────────────────────────────────────────────

export default function Karten() {
  const [cards, setCards] = useState([])
  const [shop, setShop] = useState(null)
  const [mode, setMode] = useState('list')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewStamps, setPreviewStamps] = useState(3)

  const [form, setForm] = useState({name:'',description:'',rewardThreshold:10,rewardText:''})
  const [design, setDesign] = useState({...DEFAULT_DESIGN})
  const [editCard, setEditCard] = useState(null)
  const [editDesign, setEditDesign] = useState({...DEFAULT_DESIGN})

  useEffect(()=>{
    loadCards()
    api.get('/api/shop/me').then(r=>{
      setShop(r.data)
      setDesign(d=>({
        ...d,
        colorBackground: r.data.colorBackground||'#3C3489',
        colorForeground: r.data.colorForeground||'#FFFFFF',
        colorLabel: r.data.colorLabel||'#FAC875',
        logoUrl: r.data.logoUrl||'',
        heroImageUrl: r.data.heroImageUrl||'',
      }))
    })
  },[])

  async function loadCards() {
    const r = await api.get('/api/shop/cards')
    setCards(r.data)
  }

  async function createCard() {
    if (!form.name||!form.rewardText) return alert('Bitte Name und Belohnung ausfüllen')
    setLoading(true)
    try {
      await api.post('/api/shop/cards', {
        ...form,
        rewardThreshold: parseInt(form.rewardThreshold),
        ...design,
      })
      setMode('list')
      setForm({name:'',description:'',rewardThreshold:10,rewardText:''})
      loadCards()
    } catch { alert('Fehler beim Erstellen') }
    finally { setLoading(false) }
  }

  async function saveEditDesign() {
    setLoading(true)
    try {
      await api.put(`/api/shop/cards/${editCard.id}/design`, editDesign)
      setSaved(true); setTimeout(()=>setSaved(false),2500)
      loadCards()
    } catch { alert('Fehler beim Speichern') }
    finally { setLoading(false) }
  }

  async function deleteCard(cardId, cardName) {
    if (!confirm(`Karte "${cardName}" wirklich löschen?`)) return
    try {
      await api.delete(`/api/shop/cards/${cardId}`)
      if (editCard?.id===cardId) setMode('list')
      loadCards()
    } catch { alert('Fehler') }
  }

  function openEdit(card) {
    setEditCard(card)
    setEditDesign({
      colorBackground: card.colorBackground||'#3C3489',
      colorForeground: card.colorForeground||'#FFFFFF',
      colorLabel: card.colorLabel||'#FAC875',
      logoUrl: card.logoUrl||'',
      heroImageUrl: card.heroImageUrl||'',
      walletStyle: card.walletStyle||'number',
      stampIconType: card.stampIconType||'preset',
      stampPreset: card.stampPreset||'coffee',
      stampColor: card.stampColor||'#6F4E37',
      emptyStampStyle: card.emptyStampStyle||'number',
      stampIconUrl: card.stampIconUrl||'',
    })
    setMode('edit')
  }

  const threshold = parseInt(form.rewardThreshold)||10
  const editThreshold = editCard?.rewardThreshold||10

  // ─── LIST ───────────────────────────────────────────────────────────────
  if (mode==='list') return (
    <div>
      <div style={s.header}>
        <div><h1 style={s.title}>Karten</h1><p style={s.subtitle}>Deine Stempelkarten</p></div>
        <button style={s.btnPrimary} onClick={()=>setMode('create')}>+ Neue Karte</button>
      </div>
      {cards.length===0 ? (
        <div style={s.empty}>Noch keine Karten — klick auf "+ Neue Karte"!</div>
      ) : (
        <div style={s.cardGrid}>
          {cards.map(card=>(
            <div key={card.id} style={{...s.card, borderTop:`4px solid ${card.colorBackground||'#3C3489'}`}}>
              <div style={s.cardTop}>
                <div style={s.cardName}>{card.name}</div>
                <div style={{...s.badge,background:card.colorBackground||'#3C3489',color:card.colorForeground||'#fff'}}>{card.rewardThreshold} Stempel</div>
              </div>
              <div style={s.cardDesc}>{card.description}</div>
              <div style={s.cardReward}>🎁 {card.rewardText}</div>
              <div style={s.designBadge}>
                {card.walletStyle==='grid'?'🟡 Raster':'🔢 Zahlen'} · {PRESETS.find(p=>p.key===card.stampPreset)?.label||'☕ Kaffee'}
              </div>
              <div style={s.cardId}>ID: {card.id}</div>
              <div style={s.btnRow}>
                <button style={s.btnEdit} onClick={()=>openEdit(card)}>✏️ Bearbeiten</button>
                <button style={s.btnDelete} onClick={()=>deleteCard(card.id,card.name)}>Löschen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ─── CREATE ─────────────────────────────────────────────────────────────
  if (mode==='create') return (
    <div>
      <div style={s.header}>
        <div><h1 style={s.title}>Neue Karte</h1><p style={s.subtitle}>Infos + vollständiges Design</p></div>
        <button style={s.btnSecondary} onClick={()=>setMode('list')}>← Zurück</button>
      </div>
      <div style={s.createGrid}>
        {/* Spalte 1: Infos */}
        <div style={s.panel}>
          <div style={s.panelTitle}>Karten-Infos</div>
          {[
            {label:'Kartenname',key:'name',placeholder:'z.B. Kaffee-Karte'},
            {label:'Beschreibung',key:'description',placeholder:'z.B. 10 Stempel = 1 Gratis-Kaffee'},
            {label:'Belohnung',key:'rewardText',placeholder:'z.B. Gratis-Kaffee'},
          ].map(({label,key,placeholder})=>(
            <div key={key} style={s.field}>
              <label style={s.label}>{label}</label>
              <input style={s.input} value={form[key]} placeholder={placeholder} onChange={e=>setForm({...form,[key]:e.target.value})}/>
            </div>
          ))}
          <div style={s.field}>
            <label style={s.label}>Stempel bis Belohnung</label>
            <input style={s.input} type="number" min="1" max="100" value={form.rewardThreshold} onChange={e=>setForm({...form,rewardThreshold:e.target.value})}/>
          </div>
          <div style={{margin:'16px 0'}}>
            <div style={{fontSize:12,fontWeight:600,color:'#3C3489',marginBottom:6}}>Vorschau: {previewStamps}/{threshold} Stempel</div>
            <input type="range" min={0} max={threshold} value={previewStamps} onChange={e=>setPreviewStamps(Number(e.target.value))} style={{width:'100%',accentColor:'#3C3489'}}/>
          </div>
          <button style={s.btnCreate} onClick={createCard} disabled={loading}>
            {loading?'Erstelle…':'✓ Karte erstellen'}
          </button>
        </div>

        {/* Spalte 2: Design */}
        <div style={{...s.panel,maxHeight:'80vh',overflowY:'auto'}}>
          <div style={s.panelTitle}>Design</div>
          <DesignPanel design={design} onChange={setDesign}/>
        </div>

        {/* Spalte 3: Vorschau */}
        <div>
          <div style={s.previewLabel}>🍎 Apple Wallet</div>
          <ApplePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name}/>
          <div style={{...s.previewLabel,marginTop:20}}>🤖 Google Wallet</div>
          <GooglePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name}/>
        </div>
      </div>
    </div>
  )

  // ─── EDIT ───────────────────────────────────────────────────────────────
  if (mode==='edit') return (
    <div>
      <div style={s.header}>
        <div><h1 style={s.title}>{editCard.name}</h1><p style={s.subtitle}>Design bearbeiten</p></div>
        <div style={{display:'flex',gap:8}}>
          <button style={s.btnDelete2} onClick={()=>deleteCard(editCard.id,editCard.name)}>Löschen</button>
          <button style={s.btnSecondary} onClick={()=>setMode('list')}>← Zurück</button>
        </div>
      </div>
      <div style={s.editGrid}>
        <div style={{...s.panel,maxHeight:'80vh',overflowY:'auto'}}>
          <div style={s.panelTitle}>Design</div>
          <DesignPanel design={editDesign} onChange={setEditDesign} cardId={editCard.id}/>
          <button style={{...s.btnCreate,...(saved?{background:'#2C5F2E'}:{})}} onClick={saveEditDesign} disabled={loading}>
            {saved?'✓ Gespeichert!':loading?'Speichere…':'💾 Speichern'}
          </button>
        </div>
        <div>
          <div style={s.previewLabel}>🍎 Apple Wallet</div>
          <ApplePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name}/>
          <div style={{...s.previewLabel,marginTop:20}}>🤖 Google Wallet</div>
          <GooglePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name}/>
        </div>
      </div>
    </div>
  )
}

const s = {
  header: {display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28},
  title: {fontSize:24,fontWeight:700,margin:'0 0 4px',color:'#1a1a1a'},
  subtitle: {fontSize:14,color:'#888',margin:0},
  btnPrimary: {background:'#3C3489',color:'white',border:'none',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer'},
  btnSecondary: {background:'#f0f0f0',color:'#444',border:'none',borderRadius:10,padding:'10px 18px',fontSize:14,fontWeight:600,cursor:'pointer'},
  btnDelete2: {background:'#fce8e6',color:'#c00',border:'none',borderRadius:10,padding:'10px 18px',fontSize:14,fontWeight:600,cursor:'pointer'},
  panel: {background:'white',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'},
  panelTitle: {fontSize:14,fontWeight:700,color:'#1a1a1a',marginBottom:16},
  createGrid: {display:'grid',gridTemplateColumns:'1fr 1fr 210px',gap:20,alignItems:'start'},
  editGrid: {display:'grid',gridTemplateColumns:'1fr 210px',gap:20,alignItems:'start'},
  field: {display:'flex',flexDirection:'column',marginBottom:12},
  label: {fontSize:13,fontWeight:500,color:'#444',marginBottom:5},
  input: {padding:'9px 13px',borderRadius:8,border:'1.5px solid #e0e0e0',fontSize:14,outline:'none',boxSizing:'border-box'},
  btnCreate: {width:'100%',marginTop:8,padding:13,borderRadius:10,border:'none',background:'#3C3489',color:'white',fontSize:14,fontWeight:700,cursor:'pointer',transition:'background 0.2s'},
  previewLabel: {fontSize:12,fontWeight:700,color:'#555',marginBottom:10},
  empty: {background:'white',borderRadius:12,padding:40,textAlign:'center',color:'#888',fontSize:14,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'},
  cardGrid: {display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16},
  card: {background:'white',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'},
  cardTop: {display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  cardName: {fontSize:16,fontWeight:600,color:'#1a1a1a'},
  badge: {borderRadius:20,padding:'3px 10px',fontSize:12,fontWeight:600},
  cardDesc: {fontSize:13,color:'#666',marginBottom:6},
  cardReward: {fontSize:13,color:'#2C5F2E',fontWeight:500,marginBottom:6},
  designBadge: {fontSize:11,color:'#888',background:'#f5f5f5',borderRadius:6,padding:'3px 8px',display:'inline-block',marginBottom:8},
  cardId: {fontSize:11,color:'#bbb',fontFamily:'monospace',marginBottom:12},
  btnRow: {display:'flex',gap:8},
  btnEdit: {flex:1,background:'#f0eeff',color:'#3C3489',border:'none',borderRadius:8,padding:'8px 0',fontSize:13,fontWeight:600,cursor:'pointer'},
  btnDelete: {flex:1,background:'#fce8e6',color:'#c00',border:'none',borderRadius:8,padding:'8px 0',fontSize:13,fontWeight:600,cursor:'pointer'},
}