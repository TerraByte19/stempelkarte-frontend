import { useEffect, useRef, useState } from 'react'
import api from '../api'

const PRESETS = [
  { key: 'coffee', label: 'Kaffee' },
  { key: 'star',   label: 'Stern'  },
  { key: 'heart',  label: 'Herz'  },
  { key: 'dot',    label: '● Punkt'  },
  { key: 'square', label: '■ Eckig'  },
]

const DEFAULT_DESIGN = {
  colorBackground: '#3C3489',
  colorForeground: '#FFFFFF',
  colorLabel: '#FAC875',
  logoUrl: '',
  logoRing: false,
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
  // Realistischeres QR-Muster: 21x21 Module mit Finder-Patterns + Streuung
  const N = 21
  const finder = (ox, oy, x, y) => {
    const dx = x - ox, dy = y - oy
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return null
    const ring = dx === 0 || dx === 6 || dy === 0 || dy === 6
    const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
    return ring || core
  }
  const cells = []
  // Pseudo-zufälliges, aber stabiles Muster
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let on
      const f1 = finder(0, 0, x, y)
      const f2 = finder(N-7, 0, x, y)
      const f3 = finder(0, N-7, x, y)
      if (f1 !== null) on = f1
      else if (f2 !== null) on = f2
      else if (f3 !== null) on = f3
      else if ((x===7&&y<8)||(y===7&&x<8)||(x===N-8&&y<8)||(y===7&&x>=N-8)||(x===7&&y>=N-8)) on = false
      else on = rnd() > 0.52
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="black"/>)
    }
  }
  return (
    <div style={{background:'white',padding:5,borderRadius:7,display:'inline-block',lineHeight:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges">
        <rect width={N} height={N} fill="white"/>
        {cells}
      </svg>
    </div>
  )
}

// ─── Wallet Vorschauen ───────────────────────────────────────────────────────

function ApplePreview({ design, stamps, threshold, rewardText, cardName }) {
  const d = {...DEFAULT_DESIGN, ...design}
  const useUpload = d.stampIconType==='upload' && d.stampIconUrl
  return (
    <div style={{width:236,background:'linear-gradient(160deg,#3a3a3c,#1c1c1e)',borderRadius:42,padding:11,boxShadow:'0 22px 60px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,255,255,0.06)',margin:'0 auto'}}>
      {/* Bildschirm */}
      <div style={{background:'#000',borderRadius:32,overflow:'hidden',position:'relative',paddingTop:0}}>
        {/* Dynamic Island */}
        <div style={{position:'absolute',top:9,left:'50%',transform:'translateX(-50%)',width:72,height:21,background:'#000',borderRadius:14,zIndex:5}}/>
        {/* Statusleiste */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 18px 6px',fontSize:11,color:'white',fontWeight:600,fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif'}}>
          <span>9:41</span>
          <span style={{display:'flex',gap:4,alignItems:'center',fontSize:10}}>
            <span>􀙇</span><span>􀋨</span><span>􀛨</span>
          </span>
        </div>
        {/* Wallet-Hintergrund */}
        <div style={{background:'#f2f2f7',padding:'8px 10px 16px',minHeight:200}}>
          {/* Die Karte */}
          <div style={{borderRadius:13,overflow:'hidden',background:d.colorBackground,color:d.colorForeground,boxShadow:'0 6px 18px rgba(0,0,0,0.28)',fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif'}}>
            {/* Header: Logo + Name links, Stempelzahl rechts */}
            <div style={{display:'flex',alignItems:'center',gap:7,padding:'11px 12px 8px'}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.97)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:d.logoRing?'2px solid white':'none',boxSizing:'border-box'}}>
                {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:d.logoRing?'80%':'100%',height:d.logoRing?'80%':'100%',objectFit:'cover',borderRadius:d.logoRing?'50%':0}}/> : <span style={{fontSize:9,fontWeight:700,color:d.colorBackground}}>SK</span>}
              </div>
              <span style={{fontSize:12,fontWeight:600,flex:1,letterSpacing:0.2}}>{cardName||'Stempelkarte'}</span>
              <span style={{fontSize:15,fontWeight:600,color:d.colorLabel}}>{stamps}/{threshold}</span>
            </div>

            {/* Hero-Strip (Apple zeigt das Bild als breiten Strip) */}
            {d.heroImageUrl && (
              <img src={d.heroImageUrl} alt="" style={{width:'100%',height:84,objectFit:'cover',display:'block'}}/>
            )}

            {/* Inhalt je nach Stil */}
            {d.walletStyle==='grid' ? (
              <div style={{padding:'10px 10px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={useUpload} stampIconUrl={d.stampIconUrl}/>
              </div>
            ) : (
              <div style={{display:'flex',gap:18,padding:'9px 12px 11px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>BELOHNUNG</div>
                  <div style={{fontSize:11,fontWeight:500}}>{rewardText||'—'}</div>
                </div>
                <div>
                  <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>STEMPEL</div>
                  <div style={{fontSize:11,fontWeight:500}}>{stamps} von {threshold}</div>
                </div>
              </div>
            )}

            {/* Barcode-Bereich (Apple: heller Block unten mit Seriennummer) */}
            <div style={{background:'white',padding:'12px 12px 9px',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <MockQR size={92}/>
              <span style={{fontSize:9,color:'#8e8e93',fontFamily:'"SF Mono",monospace',letterSpacing:1}}>CC-7F3A···902B</span>
            </div>
          </div>

          {/* Detail-Hinweis unter der Karte (wie echtes Wallet) */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginTop:11,fontSize:11,color:'#8e8e93'}}>
            <span>􀅴</span><span>Zum Aktualisieren tippen</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function GooglePreview({ design, stamps, threshold, rewardText, cardName }) {
  const d = {...DEFAULT_DESIGN, ...design}
  return (
    <div style={{width:236,background:'#fff',borderRadius:24,padding:11,boxShadow:'0 22px 60px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.04)',margin:'0 auto'}}>
      {/* Android-Bildschirm */}
      <div style={{background:'#f5f5f7',borderRadius:18,overflow:'hidden'}}>
        {/* Statusleiste */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 16px 6px',fontSize:11,color:'#202124',fontWeight:500,fontFamily:'Roboto,"Segoe UI",sans-serif'}}>
          <span>9:41</span>
          <span style={{display:'flex',gap:5,fontSize:10}}><span>􀙇</span><span>􀋨</span><span>100%</span></span>
        </div>

        {/* Google Wallet App-Titelzeile */}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 14px 10px',fontFamily:'Roboto,sans-serif'}}>
          <span style={{fontSize:13,color:'#5f6368'}}>←</span>
          <span style={{fontSize:13,fontWeight:500,color:'#202124',flex:1}}>Wallet</span>
          <span style={{fontSize:14,color:'#5f6368'}}>⋮</span>
        </div>

        {/* Die Karte (Google: abgerundet, Hero unten) */}
        <div style={{margin:'0 12px 14px',borderRadius:16,overflow:'hidden',background:d.colorBackground,color:d.colorForeground,boxShadow:'0 3px 10px rgba(0,0,0,0.2)',fontFamily:'Roboto,"Segoe UI",sans-serif'}}>
          {/* Kopf: Logo + Name */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 14px 10px'}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:d.logoRing?'2px solid white':'none',boxSizing:'border-box'}}>
              {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:d.logoRing?'80%':'100%',height:d.logoRing?'80%':'100%',objectFit:'cover',borderRadius:d.logoRing?'50%':0}}/> : <span style={{color:'#3C3489',fontWeight:700,fontSize:12}}>SK</span>}
            </div>
            <div style={{fontSize:14,fontWeight:500,letterSpacing:0.2}}>{cardName||'Stempelkarte'}</div>
          </div>

          {/* Felder */}
          <div style={{display:'flex',gap:20,padding:'0 14px 14px'}}>
            <div>
              <div style={{fontSize:9,fontWeight:500,letterSpacing:0.6,color:d.colorLabel,marginBottom:3,textTransform:'uppercase'}}>Stempel</div>
              <div style={{fontSize:14,fontWeight:500}}>{stamps}/{threshold}</div>
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:500,letterSpacing:0.6,color:d.colorLabel,marginBottom:3,textTransform:'uppercase'}}>Belohnung</div>
              <div style={{fontSize:14,fontWeight:500}}>{rewardText||'—'}</div>
            </div>
          </div>

          {/* Stempel-Raster, falls gewählt */}
          {d.walletStyle==='grid' && (
            <div style={{padding:'0 14px 12px',display:'flex',justifyContent:'center'}}>
              <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={d.stampIconType==='upload'&&d.stampIconUrl} stampIconUrl={d.stampIconUrl}/>
            </div>
          )}

          {/* QR-Bereich (Google: weißer Block) */}
          <div style={{background:'white',padding:'14px',display:'flex',justifyContent:'center'}}>
            <MockQR size={104}/>
          </div>

          {/* Hero-Image unten (Android-typisch) */}
          {d.heroImageUrl && <img src={d.heroImageUrl} alt="" style={{width:'100%',height:80,objectFit:'cover',display:'block'}}/>}
        </div>
      </div>
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
        <div style={dp.sectionTitle}>Farben</div>
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
        <div style={dp.sectionTitle}>Logo</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:52,height:52,borderRadius:10,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
            {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:11,color:'#aaa'}}>SK</span>}
          </div>
          <div>
            <button style={dp.uploadBtn} onClick={()=>logoRef.current?.click()} disabled={uploading==='logo'}>
              {uploading==='logo'?'Lädt…':'Logo hochladen'}
            </button>
            <div style={{fontSize:11,color:'#aaa',marginTop:4}}>PNG, empfohlen 480×150px</div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
            onChange={e=>upload(e.target.files[0], logoEndpoint, 'logo')}/>
        </div>
      </div>

      {/* ── Logo Ring ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>Weisser Ring um Logo</div>
        <div style={dp.row2}>
          {[{val:false,label:'Aus'},{val:true,label:'An'}].map(({val,label})=>(
            <div key={String(val)} style={{...dp.card,...(!!d.logoRing===val?dp.active:{})}} onClick={()=>onChange({...d,logoRing:val})}>
              <div style={dp.cardLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Banner ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>Banner</div>
        {d.heroImageUrl ? (
          <img src={d.heroImageUrl} alt="" style={{width:'100%',height:70,objectFit:'cover',borderRadius:8,marginBottom:8}}/>
        ) : (
          <div style={{width:'100%',height:50,background:'#f5f5f7',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
            <span style={{fontSize:12,color:'#bbb'}}>Kein Banner</span>
          </div>
        )}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button style={dp.uploadBtn} onClick={()=>heroRef.current?.click()} disabled={uploading==='hero'}>
            {uploading==='hero'?'Lädt…':d.heroImageUrl?'Banner ändern':'Banner hochladen'}
          </button>
          {d.heroImageUrl && (
            <button style={dp.removeBtn} onClick={()=>onChange({...d, heroImageUrl:''})} disabled={uploading==='hero'}>
              Entfernen
            </button>
          )}
        </div>
        <div style={{fontSize:11,color:'#aaa',marginTop:4}}>PNG/JPG, empfohlen 1125×369px</div>
        <input ref={heroRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>upload(e.target.files[0], heroEndpoint, 'hero')}/>
      </div>

      {/* ── Wallet-Stil ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>Wallet-Stil</div>
        <div style={dp.row2}>
          {[{val:'number',label:'Zahlen',desc:'Klassisch'},{val:'grid',label:'Raster',desc:'Stempel-Grid'}].map(({val,label,desc})=>(
            <div key={val} style={{...dp.card,...(d.walletStyle===val?dp.active:{})}} onClick={()=>onChange({...d,walletStyle:val})}>
              <div style={dp.cardLabel}>{label}</div><div style={dp.cardDesc}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stempel-Icon ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>Stempel-Icon</div>
        <div style={dp.row2}>
          {[{val:'preset',label:'Vorlage'},{val:'upload',label:'Eigenes'}].map(({val,label})=>(
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
              {uploading==='stamp'?'Lädt…':d.stampIconUrl?'Ändern':'Hochladen'}
            </button>
            <input ref={stampRef} type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>upload(e.target.files[0], stampEndpoint, 'stamp')}/>
          </div>
        )}
      </div>

      {/* ── Stempel-Farbe ── */}
      <div style={dp.section}>
        <div style={dp.sectionTitle}>Stempel-Farbe</div>
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
        <div style={dp.sectionTitle}>Leere Stempel</div>
        <div style={dp.row2}>
          {[{val:'number',label:'Nummer'},{val:'faded',label:'Verblasst'}].map(({val,label})=>(
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
  removeBtn: {padding:'7px 14px',borderRadius:7,border:'2px solid #c00',background:'white',color:'#c00',fontSize:12,fontWeight:600,cursor:'pointer'},
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
        description: form.description,
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
      logoRing: !!card.logoRing,
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
              <div style={s.cardReward}>{card.rewardText}</div>
              <div style={s.designBadge}>
                {card.walletStyle==='grid'?'Raster':'Zahlen'} · {PRESETS.find(p=>p.key===card.stampPreset)?.label||'Kaffee'}
              </div>
              <div style={s.cardId}>ID: {card.id}</div>
              <div style={s.btnRow}>
                <button style={s.btnEdit} onClick={()=>openEdit(card)}>Bearbeiten</button>
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
            {label:'Kartenname',key:'name',placeholder:'z.B. Kaffee-Karte',max:18},
            {label:'Beschreibung',key:'description',placeholder:'z.B. 10 Stempel = 1 Gratis-Kaffee',max:40},
            {label:'Belohnung',key:'rewardText',placeholder:'z.B. Gratis-Kaffee',max:25},
          ].map(({label,key,placeholder,max})=>(
            <div key={key} style={s.field}>
              <label style={s.label}>
                {label}
                <span style={{float:'right',fontSize:11,color:(form[key]?.length||0)>=max?'#c00':'#bbb',fontWeight:500}}>
                  {form[key]?.length||0}/{max}
                </span>
              </label>
              <input style={s.input} value={form[key]} placeholder={placeholder} maxLength={max}
                onChange={e=>setForm({...form,[key]:e.target.value})}/>
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

        {/* Vorschau — volle Breite, nebeneinander */}
        <div style={{gridColumn:'1 / -1', display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', background:'white', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div>
            <div style={s.previewLabel}>Apple Wallet</div>
            <ApplePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name}/>
          </div>
          <div>
            <div style={s.previewLabel}>Google Wallet</div>
            <GooglePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name}/>
          </div>
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
            {saved?'✓ Gespeichert!':loading?'Speichere…':'Speichern'}
          </button>
        </div>
        {/* Vorschau — volle Breite, nebeneinander */}
        <div style={{display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', background:'white', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <div>
            <div style={s.previewLabel}>Apple Wallet</div>
            <ApplePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name}/>
          </div>
          <div>
            <div style={s.previewLabel}>Google Wallet</div>
            <GooglePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name}/>
          </div>
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
  createGrid: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'},
  editGrid: {display:'grid',gridTemplateColumns:'1fr',gap:20,alignItems:'start'},
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