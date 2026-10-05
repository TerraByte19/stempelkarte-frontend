import { useEffect, useRef, useState } from 'react'
import api from '../api'
import { useLang, dirArrow } from '../LangContext'
import BildCropper from '../components/BildCropper'
import Icon from '../components/Icon'
import { ApplePreview, GooglePreview } from '../components/CardPreview'
import PointsSettings from '../components/PointsSettings'
import RewardCatalog from '../components/RewardCatalog'
import { DEFAULT_DESIGN } from '../lib/cardDesign'
import { blobZuBase64 } from '../lib/bild'
import { formatierePunkte } from '../lib/pointsOf'

const PRESET_KEYS = ['coffee', 'star', 'heart', 'dot', 'square']

// ─── Komplettes Design Panel ─────────────────────────────────────────────────

function DesignPanel({ design, onChange, cardId=null, onStampFile=null, onStripFile=null, t,
                      zeigeStempelDesign=true }) {
  const logoRef = useRef()
  const heroRef = useRef()
  const stampRef = useRef()
  const stripRef = useRef()
  const [uploading, setUploading] = useState('')
  // Bild-Zuschnitt-Dialog: {datei, form, ratio, ausgabe, aufFertig}
  const [cropper, setCropper] = useState(null)
  const d = design

  // Datei ausgewaehlt -> erst zuschneiden lassen, dann hochladen
  function waehleBild(e, config) {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''            // gleiche Datei erneut waehlbar
    if (f) setCropper({ ...config, datei: f })
  }

  async function upload(fileOrBlob, endpoint, field, originalBlob) {
    if (!fileOrBlob) return
    setUploading(field)
    try {
      const base64 = await blobZuBase64(fileOrBlob)
      const ext = fileOrBlob.name ? fileOrBlob.name.split('.').pop() : 'png'
      const body = { base64, extension: ext }
      // Original mitschicken -> spaeter erneut zuschneidbar
      if (originalBlob) body.originalBase64 = await blobZuBase64(originalBlob)
      const res = await api.post(endpoint, body)
      onChange({ ...d, ...res.data })
    } catch { alert(t('common_upload_failed')) }
    setUploading('')
  }

  // Gespeichertes Bild erneut in den Zuschnitt-Editor laden (Original holen).
  async function bearbeite(originalUrl, config) {
    if (!originalUrl) return
    try {
      const r = await fetch(originalUrl, { mode: 'cors' })
      const blob = await r.blob()
      setCropper({ ...config, datei: blob })
    } catch { alert(t('common_upload_failed')) }
  }

  // Stempel-Bild: Im Erstell-Modus (keine cardId) NICHT sofort hochladen —
  // sonst landet es am Shop und färbt auf andere Karten ab. Stattdessen lokal
  // als Vorschau zeigen und die Datei nach oben geben; createCard lädt sie
  // nach dem Anlegen an die frische Karte hoch.
  function handleStampFile(file, original) {
    if (!file) return
    if (cardId) {
      upload(file, `/api/shop/cards/${cardId}/stamp-icon`, 'stamp', original)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange({...d, stampIconUrl: ev.target.result})  // lokale Data-URL als Vorschau
        if (onStampFile) onStampFile({ blob: file, original })
      }
      reader.readAsDataURL(file)
    }
  }

  const cropDialog = cropper && (
    <BildCropper
      datei={cropper.datei}
      form={cropper.form}
      ratio={cropper.ratio}
      ausgabe={cropper.ausgabe}
      onFertig={(blob) => { const cb = cropper.aufFertig; const orig = cropper.datei; setCropper(null); if (blob) cb(blob, orig) }}
      onAbbrechen={() => setCropper(null)}
    />
  )

  // Streifenbild gehoert immer zu EINER Karte - es gibt keinen Shop-Endpunkt.
  // Beim Anlegen ist die Karte noch nicht da: Bild lokal zeigen und nach dem
  // Anlegen hochladen, genau wie beim Stempel-Bild.
  function handleStripFile(file, original) {
    if (!file) return
    if (cardId) {
      upload(file, `/api/shop/cards/${cardId}/strip`, 'strip', original)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange({ ...d, stripImageUrl: ev.target.result })
        if (onStripFile) onStripFile({ blob: file, original })
      }
      reader.readAsDataURL(file)
    }
  }

  const logoEndpoint = cardId ? `/api/shop/cards/${cardId}/logo` : '/api/shop/logo'
  const heroEndpoint = cardId ? `/api/shop/cards/${cardId}/hero` : '/api/shop/hero'

  return (
      <div>
        {cropDialog}
        {/* ── Farben ── */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_colors')}</div>
          {[
            {label:t('design_color_bg'), key:'colorBackground'},
            {label:t('design_color_fg'),   key:'colorForeground'},
            {label:t('design_color_label'), key:'colorLabel'},
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
          <div style={dp.sectionTitle}>{t('design_logo')}</div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:52,height:52,borderRadius:10,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
              {d.logoUrl ? <img src={d.logoUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span style={{fontSize:11,color:'#aaa'}}>SK</span>}
            </div>
            <div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button style={dp.uploadBtn} onClick={()=>logoRef.current?.click()} disabled={uploading==='logo'}>
                  {uploading==='logo'?t('common_loading'):t('profil_logo_upload')}
                </button>
                {d.logoOriginalUrl && (
                    <button style={dp.uploadBtn} disabled={uploading==='logo'}
                            onClick={()=>bearbeite(d.logoOriginalUrl, { form:'kreis', ausgabe:600,
                              aufFertig:(b,orig)=>upload(b, logoEndpoint, 'logo', orig) })}>
                      {t('common_edit')}
                    </button>
                )}
              </div>
              <div style={{fontSize:11,color:'#aaa',marginTop:4}}>{t('design_logo_hint')}</div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" style={{display:'none'}}
                   onChange={e=>waehleBild(e, { form:'kreis', ausgabe:600,
                     aufFertig:(b,orig)=>upload(b, logoEndpoint, 'logo', orig) })}/>
          </div>
        </div>

        {/* ── Logo Ring ── */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_logo_ring')}</div>
          <div style={dp.row2}>
            {[{val:false,label:t('common_off')},{val:true,label:t('common_on')}].map(({val,label})=>(
                <div key={String(val)} style={{...dp.card,...(!!d.logoRing===val?dp.active:{})}} onClick={()=>onChange({...d,logoRing:val})}>
                  <div style={dp.cardLabel}>{label}</div>
                </div>
            ))}
          </div>
        </div>

        {/* ── Banner ── */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_banner')}</div>
          {d.heroImageUrl ? (
              <img src={d.heroImageUrl} alt="" style={{width:'100%',height:70,objectFit:'cover',borderRadius:8,marginBottom:8}}/>
          ) : (
              <div style={{width:'100%',height:50,background:'#f5f5f7',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <span style={{fontSize:12,color:'#bbb'}}>{t('profil_hero_none')}</span>
              </div>
          )}
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button style={dp.uploadBtn} onClick={()=>heroRef.current?.click()} disabled={uploading==='hero'}>
              {uploading==='hero'?t('common_loading'):d.heroImageUrl?t('design_banner_change'):t('profil_hero_upload')}
            </button>
            {d.heroOriginalUrl && (
                <button style={dp.uploadBtn} disabled={uploading==='hero'}
                        onClick={()=>bearbeite(d.heroOriginalUrl, { form:'breit', ratio:3, ausgabe:1200,
                          aufFertig:(b,orig)=>upload(b, heroEndpoint, 'hero', orig) })}>
                  {t('common_edit')}
                </button>
            )}
            {d.heroImageUrl && (
                <button style={dp.removeBtn} onClick={()=>onChange({...d, heroImageUrl:''})} disabled={uploading==='hero'}>
                  {t('common_remove')}
                </button>
            )}
          </div>
          <div style={{fontSize:11,color:'#aaa',marginTop:4}}>{t('design_banner_hint')}</div>
          <input ref={heroRef} type="file" accept="image/*" style={{display:'none'}}
                 onChange={e=>waehleBild(e, { form:'breit', ratio:3, ausgabe:1200,
                   aufFertig:(b,orig)=>upload(b, heroEndpoint, 'hero', orig) })}/>
        </div>

        {/* ── Wallet-Stil ── */}
        {/* Stempelkarte: Zahlen oder Raster, wie gehabt. Punktekarte: Zahlen
           oder ein eigenes Bild. Balken, Ring und Fuellstand kann das
           Backend weiterhin zeichnen, stehen aber nicht zur Auswahl -
           ein Laden soll sich nicht durch sechs Varianten arbeiten. */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_wallet_style')}</div>
          <div style={dp.row2}>
            {[
              {val:'number',label:t('design_style_numbers'),desc:t('design_style_numbers_desc')},
              ...(zeigeStempelDesign
                ? [{val:'grid',label:t('design_style_grid'),desc:t('design_style_grid_desc')}]
                : [{val:'foto',label:t('design_style_photo'),desc:t('design_style_photo_desc')}]),
            ].map(({val,label,desc})=>(
                <div key={val} style={{...dp.card,...(d.walletStyle===val?dp.active:{})}} onClick={()=>onChange({...d,walletStyle:val})}>
                  <div style={dp.cardLabel}>{label}</div><div style={dp.cardDesc}>{desc}</div>
                </div>
            ))}
          </div>
        </div>

        {/* ── Streifenbild (nur beim Foto-Stil) ── */}
        {d.walletStyle==='foto' && (
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_strip')}</div>
          {d.stripImageUrl ? (
              <img src={d.stripImageUrl} alt="" style={{width:'100%',aspectRatio:'375 / 144',objectFit:'cover',borderRadius:8,marginBottom:8,display:'block'}}/>
          ) : (
              <div style={{width:'100%',height:50,background:'#f5f5f7',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:8}}>
                <span style={{fontSize:12,color:'#bbb'}}>{t('design_strip_none')}</span>
              </div>
          )}
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button style={dp.uploadBtn} onClick={()=>stripRef.current?.click()} disabled={uploading==='strip'}>
              {uploading==='strip'?t('common_loading'):d.stripImageUrl?t('common_change'):t('common_upload')}
            </button>
            {d.stripOriginalUrl && (
                <button style={dp.uploadBtn} disabled={uploading==='strip'}
                        onClick={()=>bearbeite(d.stripOriginalUrl, { form:'breit', ratio:375/144, ausgabe:1125,
                          aufFertig:(b,orig)=>handleStripFile(b,orig) })}>
                  {t('common_edit')}
                </button>
            )}
            {d.stripImageUrl && (
                <button style={dp.removeBtn} onClick={()=>onChange({...d, stripImageUrl:''})} disabled={uploading==='strip'}>
                  {t('common_remove')}
                </button>
            )}
          </div>
          <div style={{fontSize:11,color:'#aaa',marginTop:4}}>{t('design_strip_hint')}</div>
          <input ref={stripRef} type="file" accept="image/*" style={{display:'none'}}
                 onChange={e=>waehleBild(e, { form:'breit', ratio:375/144, ausgabe:1125,
                   aufFertig:(b,orig)=>handleStripFile(b,orig) })}/>
        </div>
        )}

        {/* Stempel-Icon, -Farbe und leere Stempel zeichnen auf einer
           Punktekarte nichts - dort gibt es kein Raster. */}
        {zeigeStempelDesign && (<>

        {/* ── Stempel-Icon ── */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_stamp_icon')}</div>
          <div style={dp.row2}>
            {[{val:'preset',label:t('design_icon_preset')},{val:'upload',label:t('design_icon_upload')}].map(({val,label})=>(
                <div key={val} style={{...dp.card,...(d.stampIconType===val?dp.active:{})}} onClick={()=>onChange({...d,stampIconType:val})}>
                  <div style={dp.cardLabel}>{label}</div>
                </div>
            ))}
          </div>
          {d.stampIconType==='preset' && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
                {PRESET_KEYS.map(key=>(
                    <div key={key} style={{...dp.preset,...(d.stampPreset===key?dp.presetActive:{})}} onClick={()=>onChange({...d,stampPreset:key})}>{t(`preset_${key}`)}</div>
                ))}
              </div>
          )}
          {d.stampIconType==='upload' && (
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:8,flexWrap:'wrap'}}>
                {d.stampIconUrl && <img src={d.stampIconUrl} alt="" style={{width:36,height:36,borderRadius:8,objectFit:'cover',border:'2px solid #e0e0e0'}}/>}
                <button style={dp.uploadBtn} onClick={()=>stampRef.current?.click()} disabled={uploading==='stamp'}>
                  {uploading==='stamp'?t('common_loading'):d.stampIconUrl?t('common_change'):t('common_upload')}
                </button>
                {d.stampIconOriginalUrl && (
                    <button style={dp.uploadBtn} disabled={uploading==='stamp'}
                            onClick={()=>bearbeite(d.stampIconOriginalUrl, { form:'kreis', ausgabe:600,
                              aufFertig:(b,orig)=>handleStampFile(b,orig) })}>
                      {t('common_edit')}
                    </button>
                )}
                <input ref={stampRef} type="file" accept="image/*" style={{display:'none'}}
                       onChange={e=>waehleBild(e, { form:'kreis', ausgabe:600,
                         aufFertig:(b,orig)=>handleStampFile(b,orig) })}/>
              </div>
          )}
        </div>

        {/* ── Stempel-Farbe ── */}
        <div style={dp.section}>
          <div style={dp.sectionTitle}>{t('design_stamp_color')}</div>
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
          <div style={dp.sectionTitle}>{t('design_empty_stamps')}</div>
          <div style={dp.row2}>
            {[{val:'number',label:t('design_empty_number')},{val:'faded',label:t('design_empty_faded')}].map(({val,label})=>(
                <div key={val} style={{...dp.card,...(d.emptyStampStyle===val?dp.active:{})}} onClick={()=>onChange({...d,emptyStampStyle:val})}>
                  <div style={dp.cardLabel}>{label}</div>
                </div>
            ))}
          </div>
        </div>
        </>)}
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
  const { t, dir } = useLang()
  const [cards, setCards] = useState([])
  const [shop, setShop] = useState(null)
  const [mode, setMode] = useState('list')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [previewStamps, setPreviewStamps] = useState(3)
  // null = noch nicht angefasst, dann richtet sich die Vorschau nach dem
  // Katalog. Sobald der Laden schiebt, gilt seine Zahl.
  const [vorschauPunkte, setVorschauPunkte] = useState(null)

  const [form, setForm] = useState({name:'',description:'',rewardThreshold:10,rewardText:''})
  const [design, setDesign] = useState({...DEFAULT_DESIGN})
  const [pendingStampFile, setPendingStampFile] = useState(null)
  const [pendingStripFile, setPendingStripFile] = useState(null)

  // Kartentyp: nur beim Anlegen waehlbar, danach fest. Ein Wechsel wuerde
  // bestehende Staende bedeutungslos machen - 7 Stempel sind keine 7 Punkte.
  const [cardType, setCardType] = useState('STAMP')
  const [pointsForm, setPointsForm] = useState({
    pointsPerEuroX100: 100, pointsRounding: 'GENAU',
  })
  const [pendingRewards, setPendingRewards] = useState([])
  const [editRewards, setEditRewards] = useState([])
  const [editCard, setEditCard] = useState(null)
  const [editDesign, setEditDesign] = useState({...DEFAULT_DESIGN})
  const [editReward, setEditReward] = useState('')
  const [editStamps, setEditStamps] = useState(10)

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
        logoOriginalUrl: r.data.logoOriginalUrl||'',
        heroOriginalUrl: r.data.heroOriginalUrl||'',
      }))
    })
  },[])

  async function loadCards() {
    const r = await api.get('/api/shop/cards')
    setCards(r.data)
  }

  async function createCard() {
    // Eine Punktekarte hat keinen Belohnungstext - der Katalog ersetzt ihn.
    // Ohne diese Unterscheidung liesse sich gar keine anlegen.
    const pflichtFehlt = cardType==='POINTS'
      ? !form.name
      : !form.name || !form.rewardText
    if (pflichtFehlt) {
      return alert(t(cardType==='POINTS' ? 'cards_err_required_points' : 'cards_err_required'))
    }
    setLoading(true)
    try {
      // Falls ein eigenes Stempel-Bild ausgewählt wurde, ist stampIconUrl aktuell
      // eine lokale Data-URL (Vorschau) — die NICHT speichern. Wird nach dem
      // Anlegen separat an die neue Karte hochgeladen.
      // stripImageUrl ist im Anlege-Modus ebenfalls nur eine Data-URL.
      const { stampIconUrl, stripImageUrl, stripOriginalUrl, ...designToSave } = design

      if (cardType==='POINTS') {
        const res = await api.post('/api/shop/cards/points', {
          name: form.name,
          description: form.description || form.name,
          pointsPerEuroX100: pointsForm.pointsPerEuroX100,
          pointsRounding: pointsForm.pointsRounding,
          colorBackground: designToSave.colorBackground,
          colorForeground: designToSave.colorForeground,
          colorLabel: designToSave.colorLabel,
          logoUrl: designToSave.logoUrl,
          heroImageUrl: designToSave.heroImageUrl,
        })
        // Praemien der Reihe nach anhaengen - die Sortierung ergibt sich
        // aus der Reihenfolge des Anlegens.
        for (const r of pendingRewards) {
          await api.post(`/api/shop/cards/${res.data.id}/rewards`, {
            name: r.name, costPointsX100: r.costPointsX100,
          })
        }
        zurueckZurListe()
        return
      }

      const res = await api.post('/api/shop/cards', {
        ...form,
        description: form.description,
        rewardThreshold: parseInt(form.rewardThreshold),
        ...designToSave,
      })

      // Stempel-Bild jetzt an die frisch erstellte Karte hochladen
      // (pendingStampFile = { blob: zugeschnitten, original: unbeschnitten })
      if (pendingStampFile?.blob && res.data?.id) {
        try {
          const toB64 = (b) => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(b)
          })
          const ext = pendingStampFile.blob.name ? pendingStampFile.blob.name.split('.').pop() : 'png'
          const body = { base64: await toB64(pendingStampFile.blob), extension: ext }
          if (pendingStampFile.original) body.originalBase64 = await toB64(pendingStampFile.original)
          await api.post(`/api/shop/cards/${res.data.id}/stamp-icon`, body)
        } catch {
          alert(t('cards_err_stamp_upload'))
        }
      }

      // Streifenbild derselbe Weg: erst die Karte, dann das Bild.
      if (pendingStripFile?.blob && res.data?.id) {
        try {
          const toB64 = (b) => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result.split(',')[1])
            reader.onerror = reject
            reader.readAsDataURL(b)
          })
          const ext = pendingStripFile.blob.name ? pendingStripFile.blob.name.split('.').pop() : 'png'
          const body = { base64: await toB64(pendingStripFile.blob), extension: ext }
          if (pendingStripFile.original) body.originalBase64 = await toB64(pendingStripFile.original)
          await api.post(`/api/shop/cards/${res.data.id}/strip`, body)
        } catch {
          alert(t('cards_err_stamp_upload'))
        }
      }

      zurueckZurListe()
    } catch (e) {
      // 404 heisst hier fast immer: der Backend-Deploy laeuft noch. Das ist
      // eine andere Auskunft als "Anlegen fehlgeschlagen" und erspart die
      // Suche nach einem Fehler, den es nicht gibt.
      alert(e.response?.status === 404
        ? t('scan_points_backend_old')
        : (e.response?.data?.error || t('cards_err_create')))
    }
    finally { setLoading(false) }
  }

  /**
   * Kartentyp umschalten.
   *
   * Eine Punktekarte gehoert meistens dem ganzen Laden, nicht einem
   * Produkt - deshalb kommt der Ladenname als Vorschlag ins Namensfeld.
   * Nur wenn dort noch nichts steht: eingetippte Namen werden nie
   * ueberschrieben. Gekuerzt auf die 18 Zeichen des Feldes.
   */
  function waehleTyp(typ) {
    setCardType(typ)
    if (typ === 'POINTS' && !form.name.trim() && shop?.name) {
      setForm(f => ({ ...f, name: shop.name.slice(0, 18) }))
    }
  }

  function zurueckZurListe() {
    setMode('list')
    setForm({name:'',description:'',rewardThreshold:10,rewardText:''})
    setDesign({...DEFAULT_DESIGN})
    setPendingStampFile(null)
    setPendingRewards([])
    setPointsForm({pointsPerEuroX100:100, pointsRounding:'GENAU'})
    setCardType('STAMP')
    loadCards()
  }

  async function saveEditDesign() {
    setLoading(true)
    try {
      await api.put(`/api/shop/cards/${editCard.id}/design`, editDesign)
      const rw = editReward.trim()
      const st = parseInt(editStamps)
      const rewardChanged = rw && rw !== (editCard.rewardText || '')
      const stampsChanged = st >= 1 && st <= 100 && st !== editCard.rewardThreshold
      if (rewardChanged || stampsChanged) {
        await api.put(`/api/shop/cards/${editCard.id}/info`, {
          rewardText: rewardChanged ? rw : null,
          rewardThreshold: stampsChanged ? st : null,
        })
        setEditCard(c => ({
          ...c,
          rewardText: rewardChanged ? rw : c.rewardText,
          rewardThreshold: stampsChanged ? st : c.rewardThreshold,
        }))
      }
      setSaved(true); setTimeout(()=>setSaved(false),2500)
      loadCards()
    } catch { alert(t('profil_save_error')) }
    finally { setLoading(false) }
  }

  async function deleteCard(cardId, cardName) {
    if (!confirm(t('cards_confirm_delete', { name: cardName }))) return
    try {
      await api.delete(`/api/shop/cards/${cardId}`)
      if (editCard?.id===cardId) setMode('list')
      loadCards()
    } catch { alert(t('common_error_generic')) }
  }

  async function ladeRewards(cardId) {
    try {
      const r = await api.get(`/api/shop/cards/${cardId}/rewards`)
      setEditRewards(r.data)
    } catch {
      // Aelteres Backend kennt die Route noch nicht. Leerer Katalog statt
      // Fehlermeldung - das Bearbeiten der uebrigen Felder soll gehen.
      setEditRewards([])
    }
  }

  async function rewardHinzufuegen(name, costPointsX100) {
    await api.post(`/api/shop/cards/${editCard.id}/rewards`, { name, costPointsX100 })
    ladeRewards(editCard.id)
  }

  async function rewardEntfernen(reward) {
    await api.delete(`/api/shop/cards/${editCard.id}/rewards/${reward.id}`)
    ladeRewards(editCard.id)
  }

  async function openEdit(card) {
    setEditCard(card)
    setEditReward(card.rewardText || '')
    setEditStamps(card.rewardThreshold || 10)
    setEditRewards([])
    if ((card.type ?? 'STAMP') === 'POINTS') ladeRewards(card.id)
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
    // Die Karten-Liste enthaelt die *OriginalUrl-Felder nicht - ohne die
    // erscheint kein "Bearbeiten"-Knopf (v.a. von einem anderen Geraet).
    // Nur diese Felder nachladen, Rest der Liste-Werte unangetastet lassen.
    try {
      const r = await api.get(`/api/shop/cards/${card.id}/design`)
      setEditDesign(cur => ({
        ...cur,
        logoOriginalUrl: r.data.logoOriginalUrl || '',
        heroOriginalUrl: r.data.heroOriginalUrl || '',
        stampIconOriginalUrl: r.data.stampIconOriginalUrl || '',
      }))
    } catch { /* Liste-Werte reichen als Fallback */ }
  }

  const threshold = parseInt(form.rewardThreshold)||10
  // Vorschau folgt direkt dem Eingabefeld, damit die Aenderung sichtbar wird,
  // bevor gespeichert ist.
  const editThreshold = Math.min(100, Math.max(1, parseInt(editStamps) || editCard?.rewardThreshold || 10))

  // Beispiel-Punktestand fuer die Vorschau: die Haelfte der billigsten
  // Praemie. Bei 0 stuende dort immer "noch der volle Preis", und der Laden
  // saehe nie, wie die Karte mitten im Sammeln aussieht.
  const halberPreis = (liste) => liste.length === 0 ? 0
    : Math.round(Math.min(...liste.map(r => r.costPointsX100)) / 2)
  const vorschauPunkteX100 = vorschauPunkte ?? halberPreis(pendingRewards)
  // Obergrenze des Reglers: die teuerste Praemie, sonst 20 Punkte. So
  // laesst sich jeder Stand bis zum Ziel durchspielen.
  const vorschauMaxX100 = Math.max(
    2000, ...pendingRewards.map(r => r.costPointsX100 || 0))
  const editVorschauPunkteX100 = halberPreis(editRewards)

  // ?? 'STAMP', weil ein aelteres Backend das Feld noch nicht mitliefert.
  const istPunktekarte = (editCard?.type ?? 'STAMP') === 'POINTS'

  // ─── LIST ───────────────────────────────────────────────────────────────
  if (mode==='list') return (
      <div>
        <div style={s.header}>
          <div><h1 style={s.title}>{t('cards_title')}</h1><p style={s.subtitle}>{t('cards_subtitle')}</p></div>
          <button style={s.btnPrimary} onClick={()=>setMode('create')}>{t('cards_new')}</button>
        </div>
        {cards.length===0 ? (
            <div style={s.empty}>{t('cards_empty')}</div>
        ) : (
            <div style={s.cardGrid}>
              {cards.map(card=>(
                  <div key={card.id} style={{...s.card, borderTop:`4px solid ${card.colorBackground||'#3C3489'}`}}>
                    <div style={s.cardTop}>
                      <div style={s.cardName}>{card.name}</div>
                      {/* card.type ?? 'STAMP': ein aelteres Backend liefert
                          das Feld noch nicht mit. */}
                      <div style={{...s.badge,background:card.colorBackground||'#3C3489',color:card.colorForeground||'#fff'}}>
                        {(card.type ?? 'STAMP')==='POINTS'
                          ? t('cards_type_points')
                          : t('cards_stamp_count', { n: card.rewardThreshold })}
                      </div>
                    </div>
                    <div style={s.cardReward}>{card.rewardText}</div>
                    {/* Raster-Stil und Stempel-Symbol zeichnen auf einer
                        Punktekarte nichts - dann auch nicht hier nennen. */}
                    {(card.type ?? 'STAMP')!=='POINTS' && (
                      <div style={s.designBadge}>
                        {card.walletStyle==='grid'?t('design_style_grid'):t('design_style_numbers')} · {t(`preset_${card.stampPreset||'coffee'}`)}
                      </div>
                    )}
                    <div style={s.cardId}>{t('cards_id_label')} {card.id}</div>
                    <div style={s.btnRow}>
                      <button style={s.btnEdit} onClick={()=>openEdit(card)}>{t('common_edit')}</button>
                      <button style={s.btnDelete} onClick={()=>deleteCard(card.id,card.name)}>{t('common_delete')}</button>
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
        <style>{`
        .sk-create-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }
        .sk-design-col { max-height: 80vh; overflow-y: auto; }
        @media (max-width: 768px) {
          .sk-create-grid { grid-template-columns: 1fr; }
          .sk-design-col { max-height: none; overflow-y: visible; }
        }
      `}</style>
        <div style={s.header}>
          <div><h1 style={s.title}>{t('cards_form_title')}</h1><p style={s.subtitle}>{t('cards_create_subtitle')}</p></div>
          <button style={s.btnSecondary} onClick={()=>setMode('list')}>{dirArrow(dir)} {t('common_back')}</button>
        </div>
        <div className="sk-create-grid">
          {/* Spalte 1: Infos */}
          <div style={s.panel}>
            <div style={s.panelTitle}>{t('cards_info_panel')}</div>

            {/* Typ zuerst: er entscheidet, welche Felder darunter stehen,
                und ist nach dem Anlegen fest. */}
            <div style={s.typeRow}>
              {['STAMP','POINTS'].map(typ=>(
                <button key={typ}
                        style={{...s.typeBtn,
                          background: cardType===typ ? '#3C3489' : '#f0f0f0',
                          color: cardType===typ ? 'white' : '#333'}}
                        onClick={()=>waehleTyp(typ)}>
                  {t(typ==='STAMP' ? 'cards_type_stamp' : 'cards_type_points')}
                </button>
              ))}
            </div>
            <div style={s.typeHint}>{t('cards_type_hint')}</div>

            {/* Beschreibung nur bei Stempelkarten. Das Feld wird nirgends
                angezeigt - nicht auf der Kundenkarte, nicht im Wallet-Pass,
                nicht in der Liste. Bei einer Punktekarte ist es reine
                Reibung; createCard schickt dort den Kartennamen. */}
            {[
              {label:t('cards_name'),key:'name',max:18,
               placeholder:t(cardType==='POINTS' ? 'cards_name_ph_points' : 'cards_name_ph')},
              ...(cardType==='STAMP'
                ? [{label:t('cards_desc'),key:'description',placeholder:t('cards_desc_ph'),max:40},
                   {label:t('cards_reward'),key:'rewardText',placeholder:t('cards_reward_ph'),max:25}]
                : []),
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
            {cardType==='STAMP' ? (
              <>
                <div style={s.field}>
                  <label style={s.label}>{t('cards_threshold')}</label>
                  <input style={s.input} type="number" min="1" max="100" value={form.rewardThreshold} onChange={e=>setForm({...form,rewardThreshold:e.target.value})}/>
                </div>
                <div style={{margin:'16px 0'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#3C3489',marginBottom:6}}>{t('cards_preview_count', { n: previewStamps, threshold })}</div>
                  <input type="range" min={0} max={threshold} value={previewStamps} onChange={e=>setPreviewStamps(Number(e.target.value))} style={{width:'100%',accentColor:'#3C3489'}}/>
                </div>
              </>
            ) : (
              <>
                <PointsSettings value={pointsForm} onChange={setPointsForm} t={t}/>
                {/* Derselbe Regler wie bei Stempelkarten: ohne ihn sieht man
                    nicht, wie Balken, Ring oder Fuellstand mitwachsen. */}
                <div style={{margin:'16px 0'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#3C3489',marginBottom:6}}>
                    {t('cards_preview_points', { n: formatierePunkte(vorschauPunkteX100) })}
                  </div>
                  <input type="range" min={0} max={vorschauMaxX100} step={100}
                         value={Math.min(vorschauPunkteX100, vorschauMaxX100)}
                         onChange={e=>setVorschauPunkte(Number(e.target.value))}
                         style={{width:'100%',accentColor:'#3C3489'}}/>
                </div>
                {/* Praemien werden lokal gesammelt und erst nach dem Anlegen
                    hochgeladen - genau wie das Stempel-Bild, das auch erst
                    eine Karten-ID braucht. */}
                <RewardCatalog
                  rewards={pendingRewards}
                  onAdd={(name,costPointsX100)=>setPendingRewards(r=>[...r,{name,costPointsX100}])}
                  onRemove={weg=>setPendingRewards(r=>r.filter(x=>x!==weg))}
                  pointsPerEuroX100={pointsForm.pointsPerEuroX100}
                  t={t}/>
              </>
            )}
            <button style={s.btnCreate} onClick={createCard} disabled={loading}>
              {loading ? t('cards_creating') : (
                  <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                    <Icon name="check" size={16} strokeWidth={2.4}/>{t('cards_create')}
                  </span>
              )}
            </button>
          </div>

          {/* Spalte 2: Design */}
          <div className="sk-design-col" style={s.panel}>
            <div style={s.panelTitle}>{t('cards_design_panel')}</div>
            <DesignPanel design={design} onChange={setDesign} onStampFile={setPendingStampFile} onStripFile={setPendingStripFile} t={t} zeigeStempelDesign={cardType==='STAMP'}/>
          </div>

          {/* Vorschau — volle Breite, nebeneinander */}
          <div style={{gridColumn:'1 / -1', display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', background:'white', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div>
              <div style={s.previewLabel}>Apple Wallet</div>
              <ApplePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name} t={t}
                            cardType={cardType} rewards={pendingRewards} pointsX100={vorschauPunkteX100}/>
            </div>
            <div>
              <div style={s.previewLabel}>Google Wallet</div>
              <GooglePreview design={design} stamps={previewStamps} threshold={threshold} rewardText={form.rewardText} cardName={form.name} t={t}
                            cardType={cardType} rewards={pendingRewards} pointsX100={vorschauPunkteX100}/>
            </div>
          </div>
        </div>
      </div>
  )

  // ─── EDIT ───────────────────────────────────────────────────────────────
  if (mode==='edit') return (
      <div>
        <div style={s.header}>
          <div><h1 style={s.title}>{editCard.name}</h1><p style={s.subtitle}>{t('cards_edit_subtitle')}</p></div>
          <div style={{display:'flex',gap:8}}>
            <button style={s.btnDelete2} onClick={()=>deleteCard(editCard.id,editCard.name)}>{t('common_delete')}</button>
            <button style={s.btnSecondary} onClick={()=>setMode('list')}>{dirArrow(dir)} {t('common_back')}</button>
          </div>
        </div>
        <div style={s.editGrid}>
          <div style={{...s.panel,maxHeight:'80vh',overflowY:'auto'}}>
            <div style={s.panelTitle}>{t('cards_design_panel')}</div>

            {/* Bei einer Punktekarte ersetzt der Katalog Belohnung und
                Schwelle. Der Typ selbst wird nicht angeboten - er ist fest. */}
            {istPunktekarte ? (
              <RewardCatalog rewards={editRewards} onAdd={rewardHinzufuegen}
                             onRemove={rewardEntfernen} t={t}/>
            ) : (
              <>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,fontWeight:800,color:'#888',marginBottom:8,textTransform:'uppercase',letterSpacing:0.8,display:'block'}}>
                    {t('cards_reward')}
                  </label>
                  <input style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #e0e0e0',fontSize:13,outline:'none',boxSizing:'border-box'}}
                         value={editReward} onChange={e=>setEditReward(e.target.value)} placeholder={t('cards_reward_ph')}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,fontWeight:800,color:'#888',marginBottom:8,textTransform:'uppercase',letterSpacing:0.8,display:'block'}}>
                    {t('cards_threshold')}
                  </label>
                  <input style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1.5px solid #e0e0e0',fontSize:13,outline:'none',boxSizing:'border-box'}}
                         type="number" min="1" max="100" value={editStamps}
                         onChange={e=>setEditStamps(e.target.value)}/>
                  {parseInt(editStamps) !== editCard.rewardThreshold && (
                      <div style={{fontSize:11,color:'#B35309',marginTop:6,lineHeight:1.45}}>
                        {t('cards_threshold_warn', { from: editCard.rewardThreshold, to: parseInt(editStamps) || '-' })}
                      </div>
                  )}
                </div>
              </>
            )}
            <DesignPanel design={editDesign} onChange={setEditDesign} cardId={editCard.id} t={t} zeigeStempelDesign={!istPunktekarte}/>
            <button style={{...s.btnCreate,...(saved?{background:'#2C5F2E'}:{})}} onClick={saveEditDesign} disabled={loading}>
              {saved ? (
                  <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                    <Icon name="check" size={16} strokeWidth={2.4}/>{t('profil_saved')}
                  </span>
              ) : loading ? t('profil_saving') : t('profil_save')}
            </button>
          </div>
          {/* Vorschau — volle Breite, nebeneinander */}
          <div style={{display:'flex', gap:32, flexWrap:'wrap', justifyContent:'center', background:'white', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div>
              <div style={s.previewLabel}>Apple Wallet</div>
              <ApplePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name} t={t}
                            cardType={istPunktekarte ? 'POINTS' : 'STAMP'} rewards={editRewards} pointsX100={editVorschauPunkteX100}/>
            </div>
            <div>
              <div style={s.previewLabel}>Google Wallet</div>
              <GooglePreview design={editDesign} stamps={Math.floor(editThreshold/2)} threshold={editThreshold} rewardText={editCard.rewardText} cardName={editCard.name} t={t}
                            cardType={istPunktekarte ? 'POINTS' : 'STAMP'} rewards={editRewards} pointsX100={editVorschauPunkteX100}/>
            </div>
          </div>
        </div>
      </div>
  )
}

const s = {
  typeRow: { display:'flex', gap:'8px', marginBottom:'6px' },
  typeBtn: { flex:1, padding:'12px', borderRadius:'10px', border:'none', fontSize:'15px', fontWeight:'700', cursor:'pointer' },
  typeHint: { fontSize:'12px', color:'#999', marginBottom:'16px', textAlign:'start' },
  header: {display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28},
  title: {fontSize:24,fontWeight:700,margin:'0 0 4px',color:'#1a1a1a'},
  subtitle: {fontSize:14,color:'#888',margin:0},
  btnPrimary: {background:'#3C3489',color:'white',border:'none',borderRadius:10,padding:'10px 20px',fontSize:14,fontWeight:600,cursor:'pointer'},
  btnSecondary: {background:'#f0f0f0',color:'#444',border:'none',borderRadius:10,padding:'10px 18px',fontSize:14,fontWeight:600,cursor:'pointer'},
  btnDelete2: {background:'#fce8e6',color:'#c00',border:'none',borderRadius:10,padding:'10px 18px',fontSize:14,fontWeight:600,cursor:'pointer'},
  panel: {background:'white',borderRadius:12,padding:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',minWidth:0},
  panelTitle: {fontSize:14,fontWeight:700,color:'#1a1a1a',marginBottom:16},
  createGrid: {display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:20,alignItems:'start'},
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