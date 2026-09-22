/**
 * Wallet-Vorschauen fuer die Karten-Verwaltung: wie die Karte spaeter in
 * Apple Wallet und Google Wallet aussieht.
 *
 * Lagen in Karten.jsx, die damit auf 860 Zeilen stand. Beide muessen jetzt
 * zusaetzlich die Punkte-Variante zeichnen - deshalb vorher hier heraus,
 * sonst waere die Seite auf ueber 1200 Zeilen gewachsen und niemand faende
 * sich mehr zurecht.
 *
 * Der Umzug ist wortgleich: an der Darstellung aendert sich nichts. Der
 * ganze Icon-, Raster- und QR-Stapel kommt mit, weil ihn ausserhalb der
 * Vorschauen niemand benutzt.
 */

import { DEFAULT_DESIGN } from '../lib/cardDesign'
import { formatierePunkte } from '../lib/pointsOf'




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

/**
 * Dieselbe Regel wie RewardService.naechstesZiel im Backend: die billigste
 * Praemie, die der Kunde sich noch NICHT leisten kann. Kann er alle, ist es
 * die teuerste - sonst stuende auf einer vollen Karte gar nichts.
 */
function naechstesZiel(rewards, pointsX100) {
  if (!rewards || rewards.length === 0) return null
  const offen = rewards.filter(r => r.costPointsX100 > pointsX100)
  const pool = offen.length > 0 ? offen : rewards
  return pool.reduce((a, b) =>
    offen.length > 0
      ? (b.costPointsX100 < a.costPointsX100 ? b : a)
      : (b.costPointsX100 > a.costPointsX100 ? b : a))
}

// ─── Wallet Vorschauen ───────────────────────────────────────────────────────

export function ApplePreview({ design, stamps, threshold, rewardText, cardName, t,
                              cardType='STAMP', rewards=[], pointsX100=0 }) {
  const d = {...DEFAULT_DESIGN, ...design}
  const useUpload = d.stampIconType==='upload' && d.stampIconUrl
  const punkte = cardType==='POINTS'
  const ziel = punkte ? naechstesZiel(rewards, pointsX100) : null
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
                <span style={{fontSize:12,fontWeight:600,flex:1,letterSpacing:0.2}}>{cardName||t('preview_default_name')}</span>
                <span style={{fontSize:15,fontWeight:600,color:d.colorLabel}}>
                  {punkte ? formatierePunkte(pointsX100) : `${stamps}/${threshold}`}
                </span>
              </div>

              {/* Inhalt je nach Kartentyp und Stil */}
              {punkte ? (
                  <div style={{display:'flex',gap:18,padding:'9px 12px 11px'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>{t('scan_points_next_goal')}</div>
                      <div style={{fontSize:11,fontWeight:500}}>{ziel ? ziel.name : t('scan_points_no_goal')}</div>
                    </div>
                    <div>
                      <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>{t('cards_catalog_cost')}</div>
                      <div style={{fontSize:11,fontWeight:500}}>
                        {ziel
                          ? t('scan_points_missing', { n: formatierePunkte(Math.max(0, ziel.costPointsX100 - pointsX100)) })
                          : formatierePunkte(pointsX100)}
                      </div>
                    </div>
                  </div>
              ) : d.walletStyle==='grid' ? (
                  <div style={{padding:'10px 10px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={useUpload} stampIconUrl={d.stampIconUrl}/>
                  </div>
              ) : (
                  <div style={{display:'flex',gap:18,padding:'9px 12px 11px'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>{t('preview_reward_label')}</div>
                      <div style={{fontSize:11,fontWeight:500}}>{rewardText||'—'}</div>
                    </div>
                    <div>
                      <div style={{fontSize:8,fontWeight:600,letterSpacing:0.5,color:d.colorLabel,marginBottom:2,opacity:0.95}}>{t('preview_stamps_label')}</div>
                      <div style={{fontSize:11,fontWeight:500}}>{t('preview_stamps_of', { stamps, threshold })}</div>
                    </div>
                  </div>
              )}

              {/* Barcode-Bereich: Hintergrund = Kartenfarbe, nur hinter dem QR weiß */}
              <div style={{padding:'12px 12px 11px',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <MockQR size={92}/>
                <span style={{fontSize:9,color:d.colorForeground,opacity:0.55,fontFamily:'"SF Mono",monospace',letterSpacing:1}}>CC-7F3A···902B</span>
              </div>
            </div>

            {/* Detail-Hinweis unter der Karte (wie echtes Wallet) */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginTop:11,fontSize:11,color:'#8e8e93'}}>
              <span>􀅴</span><span>{t('preview_tap_update')}</span>
            </div>
          </div>
        </div>
      </div>
  )
}

export function GooglePreview({ design, stamps, threshold, rewardText, cardName, t,
                               cardType='STAMP', rewards=[], pointsX100=0 }) {
  const d = {...DEFAULT_DESIGN, ...design}
  const punkte = cardType==='POINTS'
  const ziel = punkte ? naechstesZiel(rewards, pointsX100) : null
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
              <div style={{fontSize:14,fontWeight:500,letterSpacing:0.2}}>{cardName||t('preview_default_name')}</div>
            </div>

            {/* Felder. Google fuellt loyaltyPoints und secondaryLoyaltyPoints -
                bei Punkten stehen dort Stand und naechste Praemie. */}
            <div style={{display:'flex',gap:20,padding:'0 14px 14px'}}>
              <div>
                <div style={{fontSize:9,fontWeight:500,letterSpacing:0.6,color:d.colorLabel,marginBottom:3,textTransform:'uppercase'}}>
                  {punkte ? t('cards_catalog_cost') : t('preview_stamps_field')}
                </div>
                <div style={{fontSize:14,fontWeight:500}}>
                  {punkte ? formatierePunkte(pointsX100) : `${stamps}/${threshold}`}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,fontWeight:500,letterSpacing:0.6,color:d.colorLabel,marginBottom:3,textTransform:'uppercase'}}>
                  {punkte ? t('scan_points_next_goal') : t('cards_reward')}
                </div>
                <div style={{fontSize:14,fontWeight:500}}>
                  {punkte
                    ? (ziel ? `${ziel.name}, ${t('scan_points_missing', { n: formatierePunkte(Math.max(0, ziel.costPointsX100 - pointsX100)) })}` : t('scan_points_no_goal'))
                    : (rewardText||'-')}
                </div>
              </div>
            </div>

            {/* Stempel-Raster, falls gewählt. Bei Punkten gibt es nichts zu rastern. */}
            {!punkte && d.walletStyle==='grid' && (
                <div style={{padding:'0 14px 12px',display:'flex',justifyContent:'center'}}>
                  <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={d.stampIconType==='upload'&&d.stampIconUrl} stampIconUrl={d.stampIconUrl}/>
                </div>
            )}

            {/* QR-Bereich: Hintergrund = Kartenfarbe, nur hinter dem QR weiß */}
            <div style={{padding:'14px',display:'flex',justifyContent:'center'}}>
              <MockQR size={104}/>
            </div>

            {/* Hero-Image unten (Android-typisch) */}
            {d.heroImageUrl && <img src={d.heroImageUrl} alt="" style={{width:'100%',height:80,objectFit:'cover',display:'block'}}/>}
          </div>
        </div>
      </div>
  )
}

