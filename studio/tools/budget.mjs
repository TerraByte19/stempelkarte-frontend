#!/usr/bin/env node
// budget.mjs - das Kassenbuch fuer die Stimme.
//
//   node studio/tools/budget.mjs lage         --buch B --tag JJJJ-MM-TT
//   node studio/tools/budget.mjs pruefen      --buch B --tag JJJJ-MM-TT --art voll|satz --zeichen N --video ORDNER [--zweck neu|aenderung|nachholen] [--begleitet ja]
//   node studio/tools/budget.mjs buchen       wie pruefen, dazu --zeit JJJJ-MM-TTThh:mm:ssZ --aus NEU
//   node studio/tools/budget.mjs abschliessen --buch B --tag JJJJ-MM-TT --id ID --ausgegeben N --aus NEU
//   node studio/tools/budget.mjs unklar       --buch B --tag JJJJ-MM-TT --id ID --aus NEU
//   node studio/tools/budget.mjs selbsttest
//
// Warum es das gibt: ein unbeaufsichtigter Lauf darf die Stimme aufnehmen, aber
// nur innerhalb fester Grenzen (studio/state/konfig.json, Abschnitt "stimme").
// Die Grenzen im Kopf nachzurechnen ist genau die Art Fehler, die niemand
// bemerkt, bis das Guthaben weg ist. Deshalb rechnet dieses Werkzeug, und der
// Lauf fragt es vor JEDER Aufnahme.
//
// Warum "erst buchen, dann senden": stuerzt ein Lauf zwischen Aufnahme und
// Buchung ab, wuesste der naechste nichts von den verbrauchten Zeichen und
// naehme am selben Tag noch einmal auf. Eine Buchung mit Stand "geplant"
// zaehlt deshalb schon als verbraucht. Nach der Aufnahme wird sie mit der
// wirklich verbrauchten Zahl abgeschlossen ("bestaetigt"), bei 0 Zeichen
// storniert. Blieb der Aufruf ohne Antwort, heisst der Stand "unklar" und
// zaehlt weiter: er kann trotzdem berechnet worden sein.
//
// Warum "unklar" den Tag sperrt und nicht laenger: blieb eine Aufnahme ohne
// Antwort, weiss niemand, ob sie berechnet wurde. Ein zweiter Versuch am selben
// Tag liefe ins selbe Netzproblem und koennte noch einmal kosten, deshalb gibt
// es an diesem Tag gar keine Aufnahme mehr. Am naechsten Tag darf einmal neu
// aufgenommen werden, auch wenn das im schlimmsten Fall rund 700 Zeichen
// doppelt kostet: so ist es entschieden, damit kein Video tagelang ohne Stimme
// bleibt. Die Sperre haengt am Buch und nicht an der Datei
// voice/*.pending.json: das Buch liegt auf dem Board, die Datei hat eine
// frische Maschine nicht.
//
// Warum "unbeaufsichtigt_erlaubt": das ist der Not-Aus. Steht der Schalter auf
// false, bekommt kein unbeaufsichtigter Lauf ein Ja; nur ein Aufruf mit
// "--begleitet ja" (den setzt allein eine begleitete Sitzung) nimmt dann noch auf.
//
// Das Werkzeug sendet nichts und kennt das Netz nicht. Es liest ein Buch
// (JSON-Datei), rechnet, und schreibt das neue Buch in eine andere Datei. Das
// Buch selbst liegt auf dem Board (gedaechtnis/stimme); den Weg dorthin geht
// der Lauf mit ArtifactData.
//
// Ende-Codes: 0 erlaubt bzw. erledigt | 1 nicht erlaubt | 2 Fehler (Aufruf,
// Konfiguration oder Buch unlesbar). Alles ausser 0 heisst: NICHT aufnehmen.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const KONFIG = path.join(HIER, '..', 'state', 'konfig.json')
const ZAHLEN = ['limit_monat', 'automatik_max_monat', 'warnen_ab_anteil', 'max_zeichen_voll', 'max_zeichen_satz',
  'max_voll_pro_tag', 'max_satz_pro_tag', 'sparbetrieb_max_satz_pro_tag', 'max_zeichen_pro_tag', 'nachholen_extra_voll_pro_tag']
const TAG = /^\d{4}-\d{2}-\d{2}$/
const ZEIT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
const STAENDE = ['geplant', 'bestaetigt', 'storniert', 'unklar']
// neu = das Video des Tages | aenderung = Aenderungswunsch | nachholen = Stimme fuer einen Entwurf von gestern
const ZWECKE = ['neu', 'aenderung', 'nachholen']

class Fehler extends Error {}

// ---------------------------------------------------------------- Grenzen und Buch lesen
// Fehlt eine Grenze oder ist sie keine Zahl, wird abgebrochen statt mit einer
// Vorgabe weiterzurechnen: eine stille Vorgabe waere eine Grenze, die niemand gesetzt hat.
function grenzen(k) {
  if (!k || typeof k !== 'object') throw new Fehler('in der Konfiguration fehlt der Abschnitt "stimme"')
  for (const n of ZAHLEN) {
    if (typeof k[n] !== 'number' || !Number.isFinite(k[n]) || k[n] < 0) throw new Fehler(`"stimme.${n}" fehlt oder ist keine Zahl`)
  }
  if (typeof k.unbeaufsichtigt_erlaubt !== 'boolean') throw new Fehler('"stimme.unbeaufsichtigt_erlaubt" fehlt oder ist weder true noch false')
  if (k.limit_monat <= 0) throw new Fehler('"stimme.limit_monat" muss größer als 0 sein')
  if (k.automatik_max_monat > k.limit_monat) throw new Fehler('"stimme.automatik_max_monat" darf nicht über "stimme.limit_monat" liegen')
  if (k.warnen_ab_anteil <= 0 || k.warnen_ab_anteil > 1) throw new Fehler('"stimme.warnen_ab_anteil" muss zwischen 0 und 1 liegen')
  if (k.vortrag != null) {
    const v = k.vortrag
    if (typeof v !== 'object' || !/^\d{4}-\d{2}$/.test(String(v.monat)) || typeof v.zeichen !== 'number' || !(v.zeichen >= 0)) {
      throw new Fehler('"stimme.vortrag" braucht "monat" (JJJJ-MM) und "zeichen" (Zahl)')
    }
  }
  return k
}

// Das Buch kommt entweder als reines Dokument oder in der Huelle {id, data, version},
// in der ArtifactData gelesene Dokumente ausgibt. Ein Buch ohne Liste wird NICHT als
// leeres Buch gelesen: sonst saehe ein kaputter Lesevorgang aus wie "noch nichts verbraucht".
function buchAus(obj) {
  const d = obj && typeof obj === 'object' && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) ? obj.data : obj
  if (!d || typeof d !== 'object' || !Array.isArray(d.buchungen)) throw new Fehler('das Buch hat keine Liste "buchungen"')
  for (const b of d.buchungen) {
    // "zweck" darf fehlen: Buchungen aus der Zeit davor gelten als "neu"
    const ok = b && typeof b === 'object' && typeof b.id === 'string' && TAG.test(String(b.tag)) && (b.art === 'voll' || b.art === 'satz') &&
      typeof b.zeichen === 'number' && b.zeichen >= 0 && STAENDE.includes(b.stand) && (b.zweck === undefined || ZWECKE.includes(b.zweck))
    if (!ok) throw new Fehler(`eine Buchung ist unvollständig: ${JSON.stringify(b)}`)
  }
  return { format: 1, buchungen: d.buchungen.map(b => ({ ...b })) }
}

// ---------------------------------------------------------------- Rechnen
const zaehlt = b => b.stand !== 'storniert'   // geplant, bestaetigt und unklar gelten als verbraucht
const summe = liste => liste.reduce((s, b) => s + b.zeichen, 0)

function stufeVon(verbraucht, k) {
  if (verbraucht >= k.automatik_max_monat) return 'gesperrt'
  return verbraucht >= k.limit_monat * k.warnen_ab_anteil ? 'sparbetrieb' : 'normal'
}

function lage(buch, k, tag) {
  if (!TAG.test(String(tag))) throw new Fehler('--tag muss JJJJ-MM-TT sein')
  const monat = tag.slice(0, 7)
  const imMonat = buch.buchungen.filter(b => zaehlt(b) && b.tag.slice(0, 7) === monat)
  const heute = imMonat.filter(b => b.tag === tag)
  const vortrag = k.vortrag && k.vortrag.monat === monat ? k.vortrag.zeichen : 0
  const verbraucht = vortrag + summe(imMonat)
  const stufe = stufeVon(verbraucht, k)
  const frei_monat = Math.max(0, k.automatik_max_monat - verbraucht)
  // Die zusaetzliche volle Aufnahme fuers Nachholen gilt in jeder Stufe: sonst liefe im
  // Sparbetrieb nach einem Tag ohne Stimme jeden Tag ein Video hinterher. Die Monatsgrenze haelt trotzdem.
  const extra = k.nachholen_extra_voll_pro_tag
  const grenzen_heute = {
    voll: k.max_voll_pro_tag + extra,
    satz: stufe === 'normal' ? k.max_satz_pro_tag : k.sparbetrieb_max_satz_pro_tag,
    // eine feste Zahl aus der Konfiguration, damit sie dieselbe ist wie im Auftragstext der Aufgabe
    zeichen: k.max_zeichen_pro_tag
  }
  const voll = heute.filter(b => b.art === 'voll')
  const h = { voll: voll.length, nachgeholt: voll.filter(b => b.zweck === 'nachholen').length, satz: heute.filter(b => b.art === 'satz').length, zeichen: summe(heute) }
  return {
    monat, verbraucht, vortrag,
    anteil: +(verbraucht / k.limit_monat).toFixed(4),
    stufe, frei_monat,
    heute: h, grenzen_heute,
    // frei_heute beantwortet die Frage VOR einer Aenderung mit mehreren Saetzen: passen alle noch in den Tag?
    frei_heute: { satz: Math.max(0, grenzen_heute.satz - h.satz), zeichen: Math.max(0, Math.min(grenzen_heute.zeichen - h.zeichen, frei_monat)) },
    offen: buch.buchungen.filter(b => b.stand === 'geplant' || b.stand === 'unklar').map(b => ({ id: b.id, stand: b.stand, video: b.video }))
  }
}

function pruefe(buch, k, { tag, art, zeichen, video, zweck = 'neu', begleitet = false }) {
  const l = lage(buch, k, tag)
  const gruende = []
  if (art !== 'voll' && art !== 'satz') gruende.push(`unbekannte Art "${art}" (erlaubt: voll, satz)`)
  if (!ZWECKE.includes(zweck)) gruende.push(`unbekannter Zweck "${zweck}" (erlaubt: ${ZWECKE.join(', ')})`)
  if (!Number.isInteger(zeichen) || zeichen <= 0) gruende.push('die Zeichenzahl fehlt oder ist keine positive ganze Zahl')
  if (!gruende.length) {
    if (!k.unbeaufsichtigt_erlaubt && !begleitet) gruende.push('die Stimme ist für unbeaufsichtigte Läufe noch nicht freigegeben ("stimme.unbeaufsichtigt_erlaubt" steht auf false): erst die begleitete Probe')
    // Gilt fuer jedes Video, nicht nur fuer das betroffene: der Grund war fast immer das Netz, und das ist fuer alle dasselbe.
    const ungeklaert = buch.buchungen.filter(b => b.stand === 'unklar' && b.tag === tag)
    if (ungeklaert.length) gruende.push(`heute blieb schon eine Aufnahme ohne Antwort (${ungeklaert.map(b => b.id).join(', ')}): an diesem Tag gibt es keinen zweiten Versuch, ab morgen darf einmal neu aufgenommen werden`)
    const maxEinzel = art === 'voll' ? k.max_zeichen_voll : k.max_zeichen_satz
    if (zeichen > maxEinzel) gruende.push(`${zeichen} Zeichen sind mehr als die Grenze von ${maxEinzel} für ${art === 'voll' ? 'eine volle Aufnahme' : 'einen einzelnen Satz'}`)
    if (art === 'voll') {
      if (zweck === 'nachholen') {
        // Nachholen darf den freien Platz des Tages nehmen oder den zusaetzlichen, aber nie mehr als einmal je zusaetzlichem Platz.
        if (l.heute.voll >= l.grenzen_heute.voll) gruende.push(`heute gab es schon ${l.heute.voll} volle Aufnahme(n), mehr als ${l.grenzen_heute.voll} gibt es auch zum Nachholen nicht`)
        else if (l.heute.nachgeholt >= Math.max(1, l.grenzen_heute.voll - k.max_voll_pro_tag)) gruende.push('heute wurde schon eine Stimme nachgeholt')
      } else {
        // Der zusaetzliche Platz gehoert allein dem Nachholen: ein neues Video oder ein Aenderungswunsch bekommt ihn nie.
        const regulaer = l.heute.voll - l.heute.nachgeholt
        if (regulaer >= k.max_voll_pro_tag || l.heute.voll >= l.grenzen_heute.voll) gruende.push(`heute gab es schon ${l.heute.voll} volle Aufnahme(n), erlaubt ist ${k.max_voll_pro_tag} am Tag`)
        if (zweck === 'aenderung' && l.stufe !== 'normal') gruende.push('im Sparbetrieb gibt es keine volle Aufnahme für einen Änderungswunsch')
      }
    }
    if (art === 'satz' && l.heute.satz >= l.grenzen_heute.satz) gruende.push(`heute gab es schon ${l.heute.satz} einzelne Sätze, erlaubt sind ${l.grenzen_heute.satz} am Tag${l.stufe === 'normal' ? '' : ' (Sparbetrieb)'}`)
    if (l.heute.zeichen + zeichen > l.grenzen_heute.zeichen) gruende.push(`mit dieser Aufnahme wären es heute ${l.heute.zeichen + zeichen} Zeichen, erlaubt sind ${l.grenzen_heute.zeichen} am Tag`)
    if (l.verbraucht + zeichen > k.automatik_max_monat) gruende.push(`mit dieser Aufnahme wären es im Monat ${l.verbraucht + zeichen} Zeichen, die Automatik darf bis ${k.automatik_max_monat}`)
  }
  return { erlaubt: gruende.length === 0, gruende, art, zweck, zeichen, ...l, nach_aufnahme: l.verbraucht + (Number.isInteger(zeichen) && zeichen > 0 ? zeichen : 0) }
}

function vormonat(monat) {
  const [j, m] = monat.split('-').map(Number)
  return m === 1 ? `${j - 1}-12` : `${j}-${String(m - 1).padStart(2, '0')}`
}

// Das Buch soll nicht ohne Ende wachsen: es liegt als EIN Dokument auf dem Board.
// Behalten werden dieser und der letzte Monat (der letzte, damit ein Lauf kurz
// nach dem Monatswechsel noch sieht, was am Vortag war). Das gilt auch fuer
// unklare Buchungen: sie sperren nur ihren eigenen Tag und zaehlen danach
// einfach in ihrem Monat mit.
function raeumeAuf(buch, tag) {
  const monat = tag.slice(0, 7), davor = vormonat(monat)
  return { format: 1, buchungen: buch.buchungen.filter(b => { const m = b.tag.slice(0, 7); return m === monat || m === davor }) }
}

function buche(buch, k, { tag, art, zeichen, video, zeit, zweck = 'neu', begleitet = false }) {
  if (!ZEIT.test(String(zeit))) throw new Fehler('--zeit muss JJJJ-MM-TTThh:mm:ssZ sein (UTC)')
  if (typeof video !== 'string' || !video) throw new Fehler('--video (Ordner des Videos) fehlt')
  const p = pruefe(buch, k, { tag, art, zeichen, video, zweck, begleitet })
  if (!p.erlaubt) return { ok: false, pruefung: p }
  const id = `${zeit.replace(/[-:]/g, '')}-${art}`
  if (buch.buchungen.some(b => b.id === id)) throw new Fehler(`eine Buchung mit der id ${id} gibt es schon`)
  const neu = { id, zeit, tag, art, zweck, zeichen, video, stand: 'geplant' }
  return { ok: true, id, pruefung: p, buch: raeumeAuf({ format: 1, buchungen: [...buch.buchungen, neu] }, tag) }
}

function aendere(buch, id, tag, wie) {
  if (!TAG.test(String(tag))) throw new Fehler('--tag muss JJJJ-MM-TT sein')
  if (!buch.buchungen.some(b => b.id === id)) throw new Fehler(`keine Buchung mit der id ${id}`)
  return raeumeAuf({ format: 1, buchungen: buch.buchungen.map(b => b.id === id ? wie({ ...b }) : b) }, tag)
}

// ausgegeben = was der Anbieter wirklich berechnet hat (report bzw. check.json: elevenLabs.spent)
function schliesseAb(buch, id, ausgegeben, tag) {
  if (!Number.isInteger(ausgegeben) || ausgegeben < 0) throw new Fehler('--ausgegeben muss eine ganze Zahl ab 0 sein')
  return aendere(buch, id, tag, b => ausgegeben > 0 ? { ...b, zeichen: ausgegeben, stand: 'bestaetigt' } : { ...b, stand: 'storniert' })
}

const markiereUnklar = (buch, id, tag) => aendere(buch, id, tag, b => ({ ...b, stand: 'unklar' }))

// ---------------------------------------------------------------- Selbsttest (ohne Dateien, ohne Netz)
function selbsttest() {
  const k = grenzen({ limit_monat: 30000, automatik_max_monat: 27000, warnen_ab_anteil: 0.8, max_zeichen_voll: 900, max_zeichen_satz: 200,
    max_voll_pro_tag: 1, max_satz_pro_tag: 2, sparbetrieb_max_satz_pro_tag: 1, max_zeichen_pro_tag: 1300,
    nachholen_extra_voll_pro_tag: 0, unbeaufsichtigt_erlaubt: true })
  const T = '2026-11-16', faelle = []
  const soll = (name, ist, erwartet) => faelle.push({ name, ok: ist === erwartet, ist, erwartet })
  const fehlt = f => { try { f(); return false } catch (e) { return e instanceof Fehler } }
  const leer = () => buchAus({ format: 1, buchungen: [] })

  let b = leer()
  soll('leeres Buch erlaubt eine volle Aufnahme', pruefe(b, k, { tag: T, art: 'voll', zeichen: 700 }).erlaubt, true)
  soll('901 Zeichen sind zu viel für eine volle Aufnahme', pruefe(b, k, { tag: T, art: 'voll', zeichen: 901 }).erlaubt, false)
  soll('201 Zeichen sind zu viel für einen Satz', pruefe(b, k, { tag: T, art: 'satz', zeichen: 201 }).erlaubt, false)
  soll('0 Zeichen werden abgelehnt', pruefe(b, k, { tag: T, art: 'voll', zeichen: 0 }).erlaubt, false)
  soll('eine unbekannte Art wird abgelehnt', pruefe(b, k, { tag: T, art: 'alles', zeichen: 100 }).erlaubt, false)
  soll('ein unbekannter Zweck wird abgelehnt', pruefe(b, k, { tag: T, art: 'voll', zeichen: 700, zweck: 'spass' }).erlaubt, false)

  let r = buche(b, k, { tag: T, art: 'voll', zeichen: 700, video: 'probe', zeit: '2026-11-16T05:00:00Z' })
  soll('buchen gelingt', r.ok, true)
  soll('die id entsteht aus Zeit und Art', r.id, '20261116T050000Z-voll')
  b = r.buch
  soll('zweite volle Aufnahme am selben Tag ist gesperrt', pruefe(b, k, { tag: T, art: 'voll', zeichen: 600 }).erlaubt, false)
  soll('am nächsten Tag ist sie wieder erlaubt', pruefe(b, k, { tag: '2026-11-17', art: 'voll', zeichen: 600 }).erlaubt, true)
  soll('eine geplante Buchung zählt schon als verbraucht', lage(b, k, T).verbraucht, 700)
  b = buche(b, k, { tag: T, art: 'satz', zeichen: 150, video: 'probe', zeit: '2026-11-16T05:10:00Z' }).buch
  b = buche(b, k, { tag: T, art: 'satz', zeichen: 150, video: 'probe', zeit: '2026-11-16T05:20:00Z' }).buch
  soll('zwei Sätze sind gebucht', lage(b, k, T).heute.satz, 2)
  soll('ein dritter Satz ist gesperrt', pruefe(b, k, { tag: T, art: 'satz', zeichen: 50 }).erlaubt, false)
  soll('ein abgelehntes Buchen schreibt kein Buch', buche(b, k, { tag: T, art: 'satz', zeichen: 50, video: 'probe', zeit: '2026-11-16T05:30:00Z' }).buch, undefined)
  soll('Monatssumme', lage(b, k, T).verbraucht, 1000)
  b = schliesseAb(b, '20261116T052000Z-satz', 0, T)
  soll('eine stornierte Buchung zählt nicht', lage(b, k, T).verbraucht, 850)
  soll('nach dem Storno ist wieder ein Satz frei', pruefe(b, k, { tag: T, art: 'satz', zeichen: 50 }).erlaubt, true)
  b = schliesseAb(b, '20261116T050000Z-voll', 688, T)
  soll('die bestätigte Zahl ersetzt die geplante', lage(b, k, T).verbraucht, 838)
  b = markiereUnklar(b, '20261116T051000Z-satz', T)
  soll('eine unklare Buchung zählt weiter', lage(b, k, T).verbraucht, 838)
  soll('eine unklare Buchung steht unter "offen"', lage(b, k, T).offen.length, 1)
  soll('die Tagesgrenze in Zeichen greift', pruefe(buchAus({ buchungen: [{ id: 'a', tag: T, art: 'voll', zeichen: 1200, stand: 'bestaetigt' }] }), k, { tag: T, art: 'satz', zeichen: 150 }).erlaubt, false)

  const fast = buchAus({ buchungen: [{ id: 'x', tag: '2026-11-01', art: 'voll', zeichen: 26500, stand: 'bestaetigt' }] })
  soll('ab 80 % gilt Sparbetrieb', pruefe(fast, k, { tag: T, art: 'satz', zeichen: 100 }).stufe, 'sparbetrieb')
  soll('über die Monatsgrenze geht nichts', pruefe(fast, k, { tag: T, art: 'voll', zeichen: 700 }).erlaubt, false)
  soll('genau bis zur Monatsgrenze geht es', pruefe(fast, k, { tag: T, art: 'voll', zeichen: 500 }).erlaubt, true)
  soll('im Sparbetrieb gibt es keine volle Aufnahme für einen Änderungswunsch', pruefe(fast, k, { tag: T, art: 'voll', zeichen: 400, zweck: 'aenderung' }).erlaubt, false)
  const spar = buche(fast, k, { tag: T, art: 'satz', zeichen: 100, video: 'probe', zeit: '2026-11-16T06:00:00Z' }).buch
  soll('im Sparbetrieb gibt es nur einen Satz am Tag', pruefe(spar, k, { tag: T, art: 'satz', zeichen: 100 }).erlaubt, false)
  soll('an der Monatsgrenze heißt die Stufe gesperrt', lage(buchAus({ buchungen: [{ id: 'y', tag: '2026-11-02', art: 'voll', zeichen: 27000, stand: 'bestaetigt' }] }), k, T).stufe, 'gesperrt')
  soll('lage nennt, wie viele Sätze heute noch frei sind', lage(leer(), k, T).frei_heute.satz, 2)
  soll('im Sparbetrieb ist nur einer frei', lage(fast, k, T).frei_heute.satz, 1)

  const kv = grenzen({ ...k, vortrag: { monat: '2026-11', zeichen: 2000 } })
  soll('der Vortrag zählt in seinem Monat', lage(leer(), kv, T).verbraucht, 2000)
  soll('der Vortrag zählt im nächsten Monat nicht', lage(leer(), kv, '2026-12-01').verbraucht, 0)

  const alt = buchAus({ buchungen: [
    { id: 'p', tag: '2026-09-30', art: 'voll', zeichen: 500, stand: 'bestaetigt' },
    { id: 'q', tag: '2026-10-31', art: 'voll', zeichen: 600, stand: 'bestaetigt' },
    { id: 's', tag: '2026-11-02', art: 'voll', zeichen: 300, stand: 'bestaetigt' }] })
  soll('Buchungen aus anderen Monaten zählen nicht', lage(alt, k, T).verbraucht, 300)
  soll('aufräumen behält diesen und den letzten Monat', raeumeAuf(alt, T).buchungen.length, 2)
  soll('im Januar ist der Vormonat der Dezember', vormonat('2027-01'), '2026-12')

  // Die Freigabe: vor der begleiteten Probe nimmt kein unbeaufsichtigter Lauf auf.
  const zu = grenzen({ ...k, unbeaufsichtigt_erlaubt: false })
  soll('ohne Freigabe bekommt ein unbeaufsichtigter Lauf kein Ja', pruefe(leer(), zu, { tag: T, art: 'voll', zeichen: 700 }).erlaubt, false)
  soll('eine begleitete Sitzung darf vor der Freigabe aufnehmen', pruefe(leer(), zu, { tag: T, art: 'voll', zeichen: 700, begleitet: true }).erlaubt, true)

  // Die Sperre nach einer Aufnahme ohne Antwort haengt am Buch, nicht an einer Datei, und gilt nur fuer ihren Tag.
  const offen = buchAus({ buchungen: [{ id: 'u', tag: T, art: 'voll', zeichen: 700, video: 'probe', stand: 'unklar' }] })
  soll('nach einer Aufnahme ohne Antwort gibt es am selben Tag keinen einzelnen Satz mehr', pruefe(offen, k, { tag: T, art: 'satz', zeichen: 80, video: 'probe' }).erlaubt, false)
  soll('auch nicht für ein anderes Video', pruefe(offen, k, { tag: T, art: 'satz', zeichen: 80, video: 'anderes' }).erlaubt, false)
  soll('am nächsten Tag darf einmal neu aufgenommen werden', pruefe(offen, k, { tag: '2026-11-17', art: 'voll', zeichen: 700, video: 'probe', zweck: 'nachholen' }).erlaubt, true)
  soll('die Aufnahme ohne Antwort zählt in ihrem Monat weiter', lage(offen, k, '2026-11-17').verbraucht, 700)
  const uralt = buchAus({ buchungen: [{ id: 'v', tag: '2026-08-03', art: 'voll', zeichen: 700, video: 'probe', stand: 'unklar' }] })
  soll('eine alte Aufnahme ohne Antwort wird aufgeräumt wie jede andere', raeumeAuf(uralt, T).buchungen.length, 0)
  soll('und zählt in einem späteren Monat nicht mit', lage(uralt, k, T).verbraucht, 0)

  // Stimme nachholen: ohne Ausnahme kostet es die Aufnahme des Tages, mit Ausnahme nicht.
  const holen = { tag: T, art: 'voll', zeichen: 700, video: 'gestern', zeit: '2026-11-16T05:00:00Z', zweck: 'nachholen' }
  const n0 = buche(leer(), k, holen).buch
  soll('ohne Ausnahme verbraucht das Nachholen die Aufnahme des Tages', pruefe(n0, k, { tag: T, art: 'voll', zeichen: 700, video: 'heute' }).erlaubt, false)
  // 1600 am Tag: zwei volle Aufnahmen zu je 700 und ein einzelner Satz. So steht es in konfig.json und im Auftragstext.
  const kx = grenzen({ ...k, nachholen_extra_voll_pro_tag: 1, max_zeichen_pro_tag: 1600 })
  let n1 = buche(leer(), kx, holen).buch
  soll('mit Ausnahme bleibt danach die Aufnahme für das neue Video', pruefe(n1, kx, { tag: T, art: 'voll', zeichen: 700, video: 'heute' }).erlaubt, true)
  soll('ein zweites Nachholen am selben Tag gibt es nicht', pruefe(n1, kx, { tag: T, art: 'voll', zeichen: 700, video: 'vorgestern', zweck: 'nachholen' }).erlaubt, false)
  n1 = buche(n1, kx, { tag: T, art: 'voll', zeichen: 700, video: 'heute', zeit: '2026-11-16T05:30:00Z' }).buch
  soll('die Ausnahme gilt nicht für einen Änderungswunsch', pruefe(n1, kx, { tag: T, art: 'voll', zeichen: 700, video: 'alt', zweck: 'aenderung' }).erlaubt, false)
  const erst = buche(leer(), kx, { tag: T, art: 'voll', zeichen: 700, video: 'heute', zeit: '2026-11-16T05:00:00Z' }).buch
  soll('nach dem neuen Video geht das Nachholen mit Ausnahme noch', pruefe(erst, kx, { tag: T, art: 'voll', zeichen: 700, video: 'gestern', zweck: 'nachholen' }).erlaubt, true)
  soll('und ohne Ausnahme nicht', pruefe(buche(leer(), k, { tag: T, art: 'voll', zeichen: 700, video: 'heute', zeit: '2026-11-16T05:00:00Z' }).buch, k, { tag: T, art: 'voll', zeichen: 700, video: 'gestern', zweck: 'nachholen' }).erlaubt, false)

  soll('die Hülle von ArtifactData wird gelesen', buchAus({ id: 'stimme', version: 3, data: { format: 1, buchungen: [] } }).buchungen.length, 0)
  soll('ein Buch ohne Liste wird abgelehnt', fehlt(() => buchAus({ format: 1 })), true)
  soll('eine unvollständige Buchung wird abgelehnt', fehlt(() => buchAus({ buchungen: [{ id: 'z', tag: T, art: 'voll', stand: 'geplant' }] })), true)
  soll('eine fehlende Grenze wird abgelehnt', fehlt(() => grenzen({ limit_monat: 30000 })), true)
  soll('ein fehlender Schalter für die Freigabe wird abgelehnt', fehlt(() => grenzen({ ...k, unbeaufsichtigt_erlaubt: undefined })), true)
  soll('eine unbekannte id wird abgelehnt', fehlt(() => schliesseAb(b, 'gibt-es-nicht', 5, T)), true)

  const rot = faelle.filter(f => !f.ok)
  for (const f of rot) console.error(`FEHLER ${f.name}: bekam ${JSON.stringify(f.ist)}, erwartet ${JSON.stringify(f.erwartet)}`)
  console.log(rot.length ? `budget.mjs: Selbsttest GESCHEITERT (${rot.length} von ${faelle.length} Fällen)` : `budget.mjs: Selbsttest bestanden (${faelle.length} Fälle)`)
  return rot.length ? 1 : 0
}

// ---------------------------------------------------------------- Aufruf
function lies(datei) {
  try { return JSON.parse(readFileSync(datei, 'utf8')) } catch (e) { throw new Fehler(`${datei} lässt sich nicht lesen: ${e.message}`) }
}

function haupt(argv) {
  const [befehl, ...rest] = argv
  if (befehl === 'selbsttest') return selbsttest()
  if (!['lage', 'pruefen', 'buchen', 'abschliessen', 'unklar'].includes(befehl)) {
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(0, 9).map(l => l.slice(3)).join('\n'))
    return 2
  }
  const a = {}
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--') || rest[i + 1] === undefined) throw new Fehler(`unverständliches Argument "${rest[i]}"`)
    a[rest[i].slice(2)] = rest[i + 1]
  }
  if (!a.buch) throw new Fehler('--buch (Datei mit dem Buch) fehlt')
  if (!a.tag) throw new Fehler('--tag (heutiges Datum in Europe/Berlin, JJJJ-MM-TT) fehlt')
  const k = grenzen(lies(a.konfig || KONFIG).stimme)
  const buch = buchAus(lies(a.buch))
  const zahl = v => /^\d+$/.test(String(v)) ? Number(v) : NaN
  const schreibe = neu => {
    if (!a.aus) throw new Fehler('--aus (Datei für das neue Buch) fehlt')
    writeFileSync(a.aus, JSON.stringify(neu, null, 1))
    const l = lage(neu, k, a.tag)
    return { geschrieben: a.aus, zeichen_monat: l.verbraucht, stufe: l.stufe, heute: l.heute, offen: l.offen }
  }
  if (befehl === 'lage') { console.log(JSON.stringify(lage(buch, k, a.tag), null, 1)); return 0 }
  if (befehl === 'pruefen' || befehl === 'buchen') {
    // Ohne den Ordner des Videos liesse sich die Sperre "unklar" nicht pruefen: dann lieber gar keine Antwort.
    if (!a.video) throw new Fehler('--video (Ordner des Videos) fehlt')
    const frage = { tag: a.tag, art: a.art, zeichen: zahl(a.zeichen), video: a.video, zweck: a.zweck || 'neu', begleitet: a.begleitet === 'ja' }
    if (befehl === 'pruefen') {
      const p = pruefe(buch, k, frage)
      console.log(JSON.stringify(p, null, 1)); return p.erlaubt ? 0 : 1
    }
    // --aus wird vor dem Rechnen verlangt: ein Buchen, das am Ende nirgends hingeschrieben wird, waere keins
    if (!a.aus) throw new Fehler('--aus (Datei für das neue Buch) fehlt')
    const r = buche(buch, k, { ...frage, zeit: a.zeit })
    if (!r.ok) { console.log(JSON.stringify({ ok: false, ...r.pruefung }, null, 1)); return 1 }
    console.log(JSON.stringify({ ok: true, id: r.id, ...schreibe(r.buch) }, null, 1)); return 0
  }
  if (!a.id) throw new Fehler('--id (id der Buchung) fehlt')
  const neu = befehl === 'abschliessen' ? schliesseAb(buch, a.id, zahl(a.ausgegeben), a.tag) : markiereUnklar(buch, a.id, a.tag)
  console.log(JSON.stringify({ ok: true, id: a.id, ...schreibe(neu) }, null, 1)); return 0
}

try {
  process.exitCode = haupt(process.argv.slice(2))
} catch (e) {
  if (!(e instanceof Fehler)) throw e
  console.error('budget: ' + e.message + ' Es wird NICHT aufgenommen.')
  process.exitCode = 2
}
