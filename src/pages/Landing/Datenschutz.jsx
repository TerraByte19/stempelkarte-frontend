import { Link } from 'react-router-dom'
import RechtSeite, { UavTabelle } from './RechtSeite'
import { BETREIBER, KUNDENDATEN, SERVER_REGION, STAND } from './rechtliches'

/**
 * /datenschutz: Datenschutzerklaerung fuer drei Gruppen - Besucher der
 * Website, Laeden (Nutzer der App) und Kunden der Laeden (Stempelkarte).
 * Rechtsgrundlagen nach DSGVO, Stand in rechtliches.js.
 */
export default function Datenschutz() {
  return (
    <RechtSeite titel="Datenschutzerklärung"
                beschreibung="Welche Daten wir verarbeiten, wofür, wie lange, und welche Rechte du hast. Für Besucher der Website, für Läden und für Kunden mit einer Stempelkarte.">

      <h2>1. Verantwortlicher</h2>
      <p>{BETREIBER.marke}, Inhaber {BETREIBER.inhaber}, {BETREIBER.strasse}, {BETREIBER.plzOrt},
        E-Mail <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a>. Ein Datenschutzbeauftragter ist
        nicht bestellt, weil die gesetzlichen Voraussetzungen dafür nicht vorliegen.</p>

      <h2>2. Besucher der Website</h2>
      <h3>Aufruf der Seiten</h3>
      <p>Die Website wird von Vercel Inc. ausgeliefert. Beim Aufruf verarbeitet Vercel technisch notwendige
        Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) in Server-Protokollen, um die Seite
        auszuliefern und Angriffe abzuwehren. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse an einem sicheren Betrieb).</p>
      <h3>Keine Cookies zur Nachverfolgung, keine Analyse-Dienste</h3>
      <p>Wir setzen keine Werbe- oder Analyse-Dienste ein. Die Website merkt sich im Browser nur deine gewählte
        Sprache (Local Storage). Das ist technisch notwendig und erfordert keine Einwilligung.</p>
      <h3>Schriftarten</h3>
      <p>Die Website lädt Schriftarten von Google Fonts (Google Ireland Ltd.). Dabei erhält Google deine
        IP-Adresse. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (einheitliche Darstellung). Wenn du das nicht
        möchtest, blockiere in deinem Browser Anfragen an fonts.googleapis.com; die Seite bleibt lesbar.</p>
      <h3>Kontakt-, Einrichtungs- und Terminformular</h3>
      <p>Füllst du ein Formular aus, speichern wir die eingegebenen Daten (Name, Laden, E-Mail, Telefon,
        Nachricht, bei Terminen Wunschtag, Uhrzeit, Art und Adresse), um dir zu antworten und den Termin zu
        vereinbaren. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Anbahnung eines Vertrags). Zum Schutz vor
        Missbrauch begrenzen wir die Anzahl der Anfragen je IP-Adresse; die IP-Adresse wird dafür nur kurz im
        Arbeitsspeicher gehalten. Wir löschen Anfragen, sobald sie erledigt sind, spätestens nach zwölf Monaten.</p>
      <h3>Demo-Karte</h3>
      <p>Auf der Demo-Seite kannst du eine Beispielkarte in dein Wallet legen. Dafür gelten die Regeln unter
        Punkt 4, der „Laden“ ist dabei unsere eigene Demo. Demo-Daten löschen wir auf Wunsch sofort.</p>

      <h2>3. Läden (Nutzer der App)</h2>
      <p>Legt ein Laden ein Konto an, verarbeiten wir: E-Mail-Adresse, Name des Ladens, Passwort (nur als Hash),
        Einstellungen und Gestaltung der Karten, den Standort des Ladens (für die Mitteilung in der Nähe),
        Zugänge des Teams mit Namen und Rolle, das Protokoll der Stempel und Prämien, Tarif und Testphase sowie
        Rechnungsdaten. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag).</p>
      <p>Beim Scannen prüft die App den Standort des Geräts, mit dem gescannt wird, um Stempel außerhalb des
        Ladens zu erkennen. Der Standort wird nur verglichen und bei einer Abweichung mit Entfernung protokolliert
        (Art. 6 Abs. 1 lit. f DSGVO, Schutz vor Missbrauch). Hinweise zur Testphase und zum Konto schicken wir per
        E-Mail über Brevo. Daten des Kontos löschen wir sechs Monate nach Ende des Vertrags, soweit keine
        gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

      <h2>4. Kunden der Läden (Stempelkarte im Wallet)</h2>
      <p>Holst du dir bei einem Laden eine Stempelkarte, ist dieser Laden Verantwortlicher für deine Daten. Wir
        verarbeiten sie in seinem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags
        (<Link to="/avv">AVV</Link>, Art. 28 DSGVO). Gespeichert wird:</p>
      <ul>
        {KUNDENDATEN.map(x => <li key={x}>{x}</li>)}
      </ul>
      <h3>Anmeldung</h3>
      <p>Bei der Anmeldung mit E-Mail schicken wir einen Bestätigungslink; erst nach dem Klick wird die Karte
        aktiv (Double-Opt-In). Bei „Mit Google anmelden“ oder „Mit Apple anmelden“ erhalten wir von Google bzw.
        Apple deine E-Mail-Adresse und deinen Namen; die Adresse gilt dann als bestätigt. Rechtsgrundlage:
        Art. 6 Abs. 1 lit. b DSGVO (Teilnahme am Treueprogramm des Ladens).</p>
      <h3>Wallet-Karte</h3>
      <p>Die Karte wird für Apple Wallet oder Google Wallet erzeugt. Apple bzw. Google erhalten dafür die Inhalte
        der Karte (Name des Ladens, dein Vorname, Stempelstand, Prämientext) und technische Kennungen, um die
        Karte zu aktualisieren. Bei Apple registriert dein iPhone eine Gerätekennung bei uns, damit wir Änderungen
        anstoßen können; bei Google liegt das Kartenobjekt bei Google. Entfernst du die Karte aus dem Wallet,
        enden die Aktualisierungen.</p>
      <h3>Mitteilungen</h3>
      <p>Der Laden kann über die Wallet-Karte Mitteilungen senden (neuer Stempel, Karte voll, Angebote,
        Erinnerungen, Mitteilung in der Nähe des Ladens). Ob und wie diese angezeigt werden, steuerst du in den
        Einstellungen deines Handys. Den Standort für die Mitteilung in der Nähe ermittelt allein dein Handy;
        er wird nicht an uns übertragen.</p>
      <h3>E-Mails</h3>
      <p>Bestätigung, Karte und Erinnerungen gehen per E-Mail über Brevo. Werbung per E-Mail (Newsletter) nur
        mit deiner ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du in jeder Mail widerrufen
        kannst. Jede E-Mail enthält außerdem einen Lösch-Link, mit dem du alle deine Daten bei diesem Laden
        unwiderruflich löschst.</p>
      <h3>Speicherdauer</h3>
      <p>Deine Daten bleiben gespeichert, solange du die Karte nutzt. Löschst du sie über den Lösch-Link oder
        beendet der Laden seinen Vertrag mit uns, werden sie gelöscht. Stempel-Protokolle ohne Personenbezug
        können für Statistiken des Ladens anonymisiert erhalten bleiben.</p>

      <h2>5. Empfänger und Unterauftragsverarbeiter</h2>
      <p>Server und Datenbank stehen bei Render im Rechenzentrum {SERVER_REGION}. Folgende Dienste verarbeiten
        Daten in unserem Auftrag:</p>
      <UavTabelle />
      <p>Soweit Dienste Daten in den USA oder in Israel verarbeiten, geschieht das auf Grundlage von
        EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO), bei zertifizierten Anbietern zusätzlich
        auf Grundlage des EU-US Data Privacy Framework; für Israel liegt ein Angemessenheitsbeschluss der
        EU-Kommission vor.</p>

      <h2>6. Deine Rechte</h2>
      <p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
        Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen
        Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte Einwilligung kannst du
        jederzeit mit Wirkung für die Zukunft widerrufen. Schreib dafür an
        <a href={`mailto:${BETREIBER.email}`}> {BETREIBER.email}</a>; bei Daten einer Stempelkarte kannst du
        dich auch an den Laden wenden.</p>
      <p>Du kannst dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Berliner
        Beauftragten für Datenschutz und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin.</p>

      <h2>7. Sicherheit</h2>
      <p>Alle Verbindungen sind verschlüsselt (TLS). Passwörter und Schnittstellen-Schlüssel speichern wir nur
        als Hash. Zugriffe des Personals laufen über getrennte Zugänge mit Rollen; Prämien einlösen, Karten
        zurücksetzen und Nachrichten verschicken ist nur mit dem Konto des Ladens möglich.</p>

      <h2>8. Änderungen</h2>
      <p>Wir passen diese Erklärung an, wenn sich der Dienst oder die Rechtslage ändert. Es gilt die hier
        veröffentlichte Fassung.</p>
      <p className="lp-recht-meta">Stand: {STAND}. Siehe auch <Link to="/vertrauen">Vertrauen und Datenschutz
        für Läden</Link> und <Link to="/impressum">Impressum</Link>.</p>
    </RechtSeite>
  )
}
