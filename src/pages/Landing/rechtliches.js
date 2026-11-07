/**
 * Feste Angaben fuer Impressum, Datenschutz, Vertrauensseite und AVV.
 * An EINER Stelle, damit sich nichts widerspricht.
 *
 * Eckige Klammern = noch vom Betreiber auszufuellen, bevor die Seiten live
 * gehen. Die Server-Region steht im Render-Dashboard beim Dienst (Frankfurt
 * oder Oregon) - sie entscheidet, ob die Kundendaten in der EU liegen.
 */
export const BETREIBER = {
  marke: 'Stampit',
  inhaber: 'Adham Khalil',
  strasse: '[Straße und Hausnummer]',
  plzOrt: '[PLZ] Berlin',
  land: 'Deutschland',
  email: 'info@stampit-app.de',
  website: 'https://www.stampit-app.de',
  ustId: null,                 // z. B. 'DE123456789' oder null (Kleinunternehmer)
}

/** Region des Render-Dienstes und der Datenbank. Bitte im Render-Dashboard pruefen. */
export const SERVER_REGION = 'Frankfurt (EU)'

export const STAND = '7. November 2026'

/** Unterauftragsverarbeiter: wer ausser uns Daten sieht, wofuer, wo. */
export const UNTERAUFTRAGSVERARBEITER = [
  { name: 'Render Services, Inc.', sitz: 'San Francisco, USA', zweck: `Server und Datenbank (Rechenzentrum ${SERVER_REGION})` },
  { name: 'Vercel Inc.', sitz: 'San Francisco, USA', zweck: 'Auslieferung der Website und der App-Oberfläche' },
  { name: 'Cloudflare, Inc.', sitz: 'San Francisco, USA', zweck: 'Netz vor dem Server (über Render), Schutz vor Angriffen' },
  { name: 'Apple Inc. / Apple Distribution International Ltd.', sitz: 'Cupertino, USA / Cork, Irland', zweck: 'Apple-Wallet-Karte, Push-Aktualisierung der Karte, „Mit Apple anmelden“' },
  { name: 'Google Ireland Ltd. / Google LLC', sitz: 'Dublin, Irland / Mountain View, USA', zweck: 'Google-Wallet-Karte, „Mit Google anmelden“, Schriftarten der Website' },
  { name: 'Brevo (Sendinblue SAS)', sitz: 'Paris, Frankreich', zweck: 'Versand von E-Mails (Bestätigung, Karte, Newsletter, Erinnerungen)' },
  { name: 'Cloudinary Ltd.', sitz: 'Petach Tikwa, Israel / USA', zweck: 'Speichern und Zuschneiden von Bildern (Logos, Hintergründe)' },
]

/** Was zu einem Kunden eines Ladens gespeichert wird. */
export const KUNDENDATEN = [
  'Name und E-Mail-Adresse (zur Anmeldung, Bestätigung und Zustellung der Karte)',
  'Stempel, Punkte oder Besuche mit Zeitpunkt, eingelöste Prämien',
  'Gewählte Sprache (Deutsch, Englisch, Arabisch, Türkisch)',
  'Einwilligungen mit Zeitpunkt (E-Mail-Bestätigung, Newsletter)',
  'Geburtstag und Telefonnummer nur, wenn der Laden diese Felder abfragt und der Kunde sie ausfüllt',
  'Technische Kennungen der Wallet-Karte (Seriennummer, bei Apple eine Gerätekennung für Aktualisierungen)',
  'Freiwillige Rückmeldungen an den Laden (Sterne, kurzer Text)',
]

export const NICHT_GESPEICHERT = [
  'Keine Zahlungsdaten, keine Bankkarten',
  'Kein Standort des Kunden, keine Bewegungsprofile',
  'Keine Werbe-Tracker, keine Analyse-Dienste auf der Website',
]
