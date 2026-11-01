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
              {filled ? (<>{!(useUpload && stampIconUrl) && <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.92)"/>}<PresetIcon preset={preset} cx={cx} cy={cy} size={r*1.1} color={stampColor} useUpload={useUpload} stampIconUrl={stampIconUrl}/></>) :
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

/** Stile, die eine Grafik in den Streifen zeichnen (ohne das Stempelraster). */
export const STREIFEN_STILE = ['balken', 'ring', 'fuellstand', 'foto']

/** Gedeckelt auf 0..1 - dieselbe Regel wie PassTemplateGenerator.anteil. */
function anteilVon(stand, ziel) {
  if (!ziel || ziel <= 0) return 1
  if (!stand || stand <= 0) return 0
  return Math.min(1, stand / ziel)
}

/**
 * Der Streifen, wie ihn der Pass zeichnet. Bewusst dieselben Verhaeltnisse
 * wie im Backend (Balken im unteren Drittel, Ring rechts, Foto links
 * abgedunkelt) - sonst verspricht die Vorschau etwas anderes als die Karte.
 */
// Wie GoogleWalletService.willkommenFelder: Geschenk mit Titel als Label,
// nur Titel als Wert ohne Label, Hinweis daneben. Abgeschaltetes fehlt.
function GoogleWillkommenFelder({ wd, geschenk, farbe, t }) {
  const titel = wd.showTitle ? (wd.title?.trim() || t('preview_welcome_google')) : null
  const haupt = wd.showGift ? { label: titel, wert: geschenk } : titel ? { label: null, wert: titel } : null
  const neben = wd.showHint ? { label: t('preview_welcome_how'), wert: wd.hint?.trim() || t('preview_welcome_how_value') } : null
  const felder = [haupt, neben].filter(Boolean)
  if (!felder.length) return null
  return (
    <div style={{display:'flex',gap:20,padding:'0 14px 14px'}}>
      {felder.map((f, i) => (
        <div key={i}>
          {f.label && <div style={{fontSize:9,fontWeight:500,letterSpacing:0.6,color:farbe,marginBottom:3,textTransform:'uppercase'}}>{f.label}</div>}
          <div style={{fontSize:14,fontWeight:500}}>{f.wert}</div>
        </div>
      ))}
    </div>
  )
}

function Streifen({ stil, anteil, akzent, fotoUrl, grund }) {
  const rahmen = { position:'relative', width:'100%', aspectRatio:'375 / 144', overflow:'hidden' }
  const prozent = Math.round(Math.max(0, Math.min(1, anteil)) * 100)

  // Ohne Bild zeichnet der Pass den Balken - die Vorschau muss dasselbe
  // zeigen, sonst verspricht sie ein Foto, das auf der Karte nicht kommt.
  if (stil === 'foto' && fotoUrl) {
    return (
        <div style={rahmen}>
          <img src={fotoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg, rgba(0,0,0,0.67) 0%, rgba(0,0,0,0) 70%)'}}/>
        </div>
    )
  }

  if (stil === 'ring') {
    return (
        <div style={{...rahmen, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:'7%'}}>
          <div style={{width:'24%', aspectRatio:'1', borderRadius:'50%',
            background:`conic-gradient(${akzent} 0% ${prozent}%, rgba(255,255,255,0.25) ${prozent}% 100%)`,
            display:'grid', placeItems:'center'}}>
            <div style={{width:'66%', aspectRatio:'1', borderRadius:'50%', background:grund}}/>
          </div>
        </div>
    )
  }

  if (stil === 'fuellstand') {
    const hoehe = 8 + prozent * 0.84
    const pegel = 100 - hoehe
    return (
        <div style={rahmen}>
          <svg viewBox="0 0 375 144" preserveAspectRatio="none" style={{width:'100%',height:'100%',display:'block'}}>
            <path d={wellenPfad(pegel / 100 * 144)} fill={akzent}/>
          </svg>
        </div>
    )
  }

  // Balken: unteres Drittel, damit oben Platz fuer Text bleibt.
  return (
      <div style={rahmen}>
        <div style={{position:'absolute', left:'6%', right:'6%', top:'68%', height:'16%',
          borderRadius:999, background:'rgba(255,255,255,0.25)', overflow:'hidden'}}>
          <div style={{width:`${prozent}%`, height:'100%', borderRadius:999, background:akzent}}/>
        </div>
      </div>
  )
}

/** Sinuswelle wie im Backend: drei halbe Wellen ueber die Breite. */
function wellenPfad(pegel) {
  let d = `M0 ${pegel}`
  for (let x = 0; x <= 375; x += 15) {
    d += ` L${x} ${(pegel + Math.sin((x / 375) * Math.PI * 3) * 10).toFixed(1)}`
  }
  return d + ' L375 144 L0 144 Z'
}

// ─── Wallet Vorschauen ───────────────────────────────────────────────────────

// Beispielname im Feld KUNDE - auf der echten Karte steht der Kundenname.
const BEISPIEL_KUNDE = 'Anna'

/**
 * Die Felder des Apple-Passes, genau wie ApplePassService.baueFelder sie
 * setzt. Die Beschriftungen sind dort fest deutsch, also hier auch - die
 * Vorschau soll zeigen, was auf dem iPhone steht, nicht die Sprache des Panels.
 *
 * kopf: rechts oben. haupt: grosses Feld (ueber dem Streifen, falls einer da
 * ist). zeile: Secondary + Auxiliary - iOS setzt sie in EINE Reihe.
 */
function appleFelder({ punkte, willkommen, wd, grid, stamps, threshold, rewardText, ziel, pointsX100 }) {
  const kunde = { label: 'KUNDE', wert: BEISPIEL_KUNDE }

  if (willkommen) {
    const zeile = []
    if (wd.showGift) zeile.push({ label: '🎁 GESCHENK', wert: willkommen })
    if (wd.showHint) zeile.push({ label: "SO GEHT'S", wert: wd.hint?.trim() || 'An der Kasse vorzeigen' })
    zeile.push(kunde)
    return {
      kopf: { label: null, wert: wd.showTitle ? (wd.title?.trim() || 'Willkommen') : '' },
      haupt: null,
      zeile,
    }
  }

  if (punkte) {
    const stand = formatierePunkte(pointsX100)
    if (!ziel) {
      return { kopf: { label: 'PUNKTE', wert: stand }, haupt: { label: 'PUNKTE', wert: stand }, zeile: [kunde] }
    }
    const fehlend = Math.max(0, ziel.costPointsX100 - pointsX100)
    return {
      kopf: { label: 'PUNKTE', wert: stand },
      haupt: fehlend > 0
        ? { label: 'Punkte bis ↓', wert: formatierePunkte(fehlend) }
        : { label: 'BEREIT', wert: 'Bereit! 🎉' },
      zeile: [{ label: 'NÄCHSTE PRÄMIE', wert: ziel.name }, kunde],
    }
  }

  const rest = Math.max(0, threshold - stamps)
  return {
    kopf: { label: 'STEMPEL', wert: `${Math.min(stamps, threshold)}/${threshold}` },
    haupt: grid ? null : rest > 0
      ? { label: 'Stempel bis ↓', wert: String(rest) }
      : { label: 'BELOHNUNG', wert: 'Bereit! 🎉' },
    zeile: [{ label: 'BELOHNUNG', wert: rewardText || '—' }, kunde],
  }
}

// iOS verkleinert alle Werte der Zeile gleich, bis alles hineinpasst: kurze
// Texte stehen gross (16), drei lange Felder wie auf dem Foto bei ~8.
// 198 = Kartenbreite ohne Rand, 0,5 = mittlere Zeichenbreite je Schriftgrad.
function zeilenGroesse(zeile) {
  const zeichen = zeile.reduce((n, f) => n + String(f.wert).length, 0)
  const platz = 198 - 8 * (zeile.length - 1)
  return Math.max(6.5, Math.min(16, platz / (zeichen * 0.5)))
}

function PassFeld({ feld, labelFarbe, wertGroesse, rechts }) {
  return (
    <div style={{minWidth:0,textAlign:rechts?'right':'left',flexShrink:rechts?0:1}}>
      {feld.label && (
        <div style={{fontSize:6.5,fontWeight:500,letterSpacing:0.4,color:labelFarbe,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:1}}>
          {feld.label}
        </div>
      )}
      <div style={{fontSize:wertGroesse,fontWeight:400,lineHeight:1.15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {feld.wert}
      </div>
    </div>
  )
}

// titel/titelFarbe: der echte Pass zeigt oben den Ladennamen (logoText),
// mit eigener Namensfarbe als Bild in dieser Farbe. Ohne titel bleibt es
// beim Kartennamen wie bisher.
// willkommen: Geschenktext einer noch gesperrten Karte. Dann wie der echte
// Pass (baueFelderGesperrt): Ueberschrift statt Stempelstand, Willkommensbild
// statt Streifen, kein Raster.
// willkommenDesign: {title, hint, imageUrl, colorBackground, show*...}, leer = Standard.
//
// Masse nach einem Foto der echten Karte: Seitenverhaeltnis 1 : 1,41,
// Streifen 375:144 direkt unter dem Kopf, eine Feldzeile, QR ganz unten.
export function ApplePreview({ design, stamps, threshold, rewardText, cardName, t,
                              cardType='STAMP', rewards=[], pointsX100=0, titel, titelFarbe,
                              willkommen, willkommenDesign }) {
  const wd = willkommen ? (willkommenDesign || {}) : {}
  // Eigene Farben gelten nur im gesperrten Zustand, jede einzeln.
  const d = {...DEFAULT_DESIGN, ...design,
    ...(wd.colorBackground ? { colorBackground: wd.colorBackground } : {}),
    ...(wd.colorForeground ? { colorForeground: wd.colorForeground } : {}),
    ...(wd.colorLabel ? { colorLabel: wd.colorLabel } : {})}
  const useUpload = d.stampIconType==='upload' && d.stampIconUrl
  const punkte = cardType==='POINTS'
  const ziel = punkte ? naechstesZiel(rewards, pointsX100) : null
  const grid = !punkte && d.walletStyle==='grid'
  const streifenStil = STREIFEN_STILE.includes(d.walletStyle) ? d.walletStyle : null
  const anteil = punkte
      ? anteilVon(pointsX100, ziel ? ziel.costPointsX100 : 0)
      : anteilVon(stamps, threshold)
  const { kopf, haupt, zeile } = appleFelder({ punkte, willkommen, wd, grid, stamps, threshold, rewardText, ziel, pointsX100 })
  const schrift = '-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif'

  // Streifen wie im Pass: gesperrt nur das Willkommensbild, sonst Raster
  // oder Streifen-Stil. Kein Streifen = kein Platz dafuer.
  let streifen = null
  if (willkommen) {
    if (wd.imageUrl) streifen = <img src={wd.imageUrl} alt="" style={{width:'100%',aspectRatio:'375 / 144',objectFit:'cover',display:'block'}}/>
  } else if (grid) {
    streifen = (
      <div style={{width:'100%',aspectRatio:'375 / 144',display:'flex',alignItems:'center',justifyContent:'center',transform:'scale(1.1)'}}>
        <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={useUpload} stampIconUrl={d.stampIconUrl}/>
      </div>
    )
  } else if (streifenStil) {
    streifen = <Streifen stil={streifenStil} anteil={anteil} akzent={d.stampColor || d.colorLabel} fotoUrl={d.stripImageUrl} grund={d.colorBackground}/>
  }

  const hauptFeld = haupt && (
    <div style={{padding:'4px 10px'}}>
      <div style={{fontSize:7,fontWeight:500,letterSpacing:0.4,color:d.colorLabel,textTransform:'uppercase'}}>{haupt.label}</div>
      <div style={{fontSize:28,fontWeight:300,lineHeight:1.05}}>{haupt.wert}</div>
    </div>
  )

  return (
      <div style={{width:236,background:'linear-gradient(160deg,#3a3a3c,#1c1c1e)',borderRadius:42,padding:11,boxShadow:'0 22px 60px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,255,255,0.06)',margin:'0 auto'}}>
        {/* Bildschirm: Wallet zeigt eine geoeffnete Karte auf Schwarz */}
        <div style={{background:'#000',borderRadius:32,overflow:'hidden',position:'relative',fontFamily:schrift}}>
          {/* Dynamic Island */}
          <div style={{position:'absolute',top:9,left:'50%',transform:'translateX(-50%)',width:72,height:21,background:'#000',borderRadius:14,zIndex:5}}/>
          {/* Statusleiste */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 18px 4px',fontSize:11,color:'white',fontWeight:600}}>
            <span>9:41</span>
            <span style={{fontSize:10}}>5G ▮</span>
          </div>
          {/* Wallet-Leiste */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 14px 8px',color:'white'}}>
            <span style={{fontSize:12,fontWeight:600}}>Fertig</span>
            <span style={{width:18,height:18,borderRadius:'50%',border:'1.5px solid white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,lineHeight:1}}>···</span>
          </div>

          <div style={{padding:'0 8px 18px'}}>
            {/* Die Karte */}
            <div style={{borderRadius:10,overflow:'hidden',background:d.colorBackground,color:d.colorForeground,aspectRatio:'1 / 1.41',display:'flex',flexDirection:'column'}}>
              {/* Kopf: Logo + Ladenname links, Kopffeld rechts */}
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'7px 9px',minHeight:44,boxSizing:'border-box'}}>
                <div style={{width:29,height:29,borderRadius:'50%',background:'rgba(255,255,255,0.97)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:d.logoRing?'1.5px solid white':'none',boxSizing:'border-box'}}>
                  {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:9,fontWeight:700,color:d.colorBackground}}>SK</span>}
                </div>
                <span style={{fontSize:12,fontWeight:500,flex:1,minWidth:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:titelFarbe || d.colorForeground}}>
                  {titel||cardName||t('preview_default_name')}
                </span>
                <div style={{textAlign:'right',flexShrink:0,maxWidth:'50%'}}>
                  {kopf.label && <div style={{fontSize:6.5,fontWeight:500,letterSpacing:0.4,color:d.colorLabel}}>{kopf.label}</div>}
                  <div style={{fontSize:13,fontWeight:400,lineHeight:1.1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{kopf.wert}</div>
                </div>
              </div>

              {/* Hauptfeld liegt auf dem Streifen, ohne Streifen steht es frei */}
              {streifen ? (
                <div style={{position:'relative'}}>
                  {streifen}
                  {hauptFeld && <div style={{position:'absolute',left:0,top:0,right:0}}>{hauptFeld}</div>}
                </div>
              ) : hauptFeld}

              {/* Secondary + Auxiliary in einer Reihe, letztes Feld rechtsbuendig */}
              <div style={{display:'flex',justifyContent:'space-between',gap:8,padding:'6px 9px 0'}}>
                {zeile.map((f, i) => (
                  <PassFeld key={i} feld={f} labelFarbe={d.colorLabel}
                            wertGroesse={zeilenGroesse(zeile)}
                            rechts={i === zeile.length - 1 && zeile.length > 1}/>
                ))}
              </div>

              {/* Barcode ganz unten, nur hinter dem QR weiss. Kein Text darunter:
                  der Pass setzt alternateText leer. */}
              <div style={{marginTop:'auto',padding:'0 0 9px',display:'flex',justifyContent:'center'}}>
                <MockQR size={78}/>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

// ladenName: Google zeigt neben dem Logo den issuerName (Ladenname) und
// darunter gross den programName (Kartenname). nameHervorheben rahmt den
// Kartennamen ein, solange im Namensfeld getippt wird - so sieht der
// Laden, welcher Name auf Android wo landet.
export function GooglePreview({ design, stamps, threshold, rewardText, cardName, t,
                               cardType='STAMP', rewards=[], pointsX100=0,
                               ladenName, nameHervorheben=false, willkommen, willkommenDesign }) {
  const d = {...DEFAULT_DESIGN, ...design}
  // Keine eigenen Farben: Google kennt Farben nur an der Klasse des Ladens.
  const wd = willkommen ? (willkommenDesign || {}) : {}
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
            {/* Kopf: Logo + Ladenname, darunter gross der Kartenname */}
            <div style={{padding:'14px 14px 10px'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,border:d.logoRing?'2px solid white':'none',boxSizing:'border-box'}}>
                  {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:d.logoRing?'80%':'100%',height:d.logoRing?'80%':'100%',objectFit:'cover',borderRadius:d.logoRing?'50%':0}}/> : <span style={{color:'#3C3489',fontWeight:700,fontSize:12}}>SK</span>}
                </div>
                {ladenName && <div style={{fontSize:12,fontWeight:500,opacity:0.85,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ladenName}</div>}
              </div>
              <div style={{fontSize:18,fontWeight:500,letterSpacing:0.2,marginTop:10,display:'inline-block',maxWidth:'100%',overflowWrap:'anywhere',borderRadius:4,
                outline:nameHervorheben?'2px dashed currentColor':'2px dashed transparent',outlineOffset:3,
                transition:'outline-color 0.15s'}}>
                {cardName||t('preview_default_name')}
              </div>
            </div>

            {/* Felder. Google fuellt loyaltyPoints und secondaryLoyaltyPoints -
                bei Punkten stehen dort Stand und naechste Praemie. */}
            {willkommen ? (
              <GoogleWillkommenFelder wd={wd} geschenk={willkommen} farbe={d.colorLabel} t={t}/>
            ) : (
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
            )}

            {/* Stempel-Raster, falls gewählt. Bei Punkten gibt es nichts zu rastern. */}
            {!punkte && !willkommen && d.walletStyle==='grid' && (
                <div style={{padding:'0 14px 12px',display:'flex',justifyContent:'center'}}>
                  <StempelRaster stamps={stamps} threshold={threshold} stampColor={d.stampColor} emptyStyle={d.emptyStampStyle} preset={d.stampPreset} useUpload={d.stampIconType==='upload'&&d.stampIconUrl} stampIconUrl={d.stampIconUrl}/>
                </div>
            )}

            {/* QR-Bereich: Hintergrund = Kartenfarbe, nur hinter dem QR weiß */}
            <div style={{padding:'14px',display:'flex',justifyContent:'center'}}>
              <MockQR size={104}/>
            </div>

            {/* Hero-Image unten (Android-typisch) */}
            {/* Gesperrt: Willkommensbild am Objekt, sonst das der Klasse. */}
            {(wd.imageUrl || d.heroImageUrl) && <img src={wd.imageUrl || d.heroImageUrl} alt="" style={{width:'100%',height:80,objectFit:'cover',display:'block'}}/>}
          </div>
        </div>
      </div>
  )
}

