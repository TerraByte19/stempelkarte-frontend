import { Link } from 'react-router-dom'
import RechtSeite, { UavTabelle } from './RechtSeite'
import { BETREIBER, KUNDENDATEN, SERVER_REGION, STAND } from './rechtliches'

/**
 * /avv: Muster des Auftragsverarbeitungsvertrags nach Art. 28 DSGVO zwischen
 * Laden (Verantwortlicher) und Stampit (Auftragsverarbeiter). Lesbar und
 * druckbar ("Als PDF speichern" = Druckdialog). Mit dem Vertrag bekommt der
 * Laden die unterschriebene Fassung.
 */
export default function Avv() {
  return (
    <RechtSeite breit
                eyebrow="Muster"
                titel="Vertrag zur Auftragsverarbeitung (AVV)"
                beschreibung="Nach Art. 28 DSGVO zwischen dem Laden als Verantwortlichem und Stampit als Auftragsverarbeiter. Dieses Muster ist Teil jedes Stampit-Vertrags.">

      <div className="lp-recht-aktionen">
        <button type="button" className="lp-btn lp-btn--primary" onClick={() => window.print()}>Drucken oder als PDF speichern</button>
        <Link className="lp-btn lp-btn--ghost" to="/vertrauen">Zurück zu Vertrauen und Datenschutz</Link>
      </div>

      <div className="lp-recht-box lp-recht-box--hinweis">
        <p><strong>Muster, Stand {STAND}.</strong> Die unterschriebene Fassung mit den Angaben des Ladens erhältst du
          mit dem Vertrag. Änderungswünsche deines Datenschutzbeauftragten nehmen wir gern auf.</p>
      </div>

      <div className="lp-avv-parteien">
        <div className="lp-recht-karte">
          <h3>Verantwortlicher (Auftraggeber)</h3>
          <p>[Name des Ladens]<br />[Inhaber]<br />[Anschrift]<br />nachfolgend „Laden“</p>
        </div>
        <div className="lp-recht-karte">
          <h3>Auftragsverarbeiter (Auftragnehmer)</h3>
          <p>{BETREIBER.marke}, Inhaber {BETREIBER.inhaber}<br />
            {BETREIBER.strasse && <>{BETREIBER.strasse}<br />{BETREIBER.plzOrt}<br /></>}
            {BETREIBER.email}<br />
            nachfolgend „Stampit“</p>
        </div>
      </div>

      <h2>§ 1 Gegenstand und Dauer</h2>
      <ol>
        <li>Stampit stellt dem Laden ein digitales Treueprogramm bereit: Stempel-, Punkte-, Mitglieds- und
          Paketkarten für Apple Wallet und Google Wallet, Anmeldeseiten für Kunden, Scanner für das Personal,
          Mitteilungen an Kunden sowie Auswertungen. Dabei verarbeitet Stampit personenbezogene Daten der Kunden
          des Ladens in dessen Auftrag.</li>
        <li>Dieser Vertrag gilt für die Dauer des Nutzungsvertrags über Stampit. Er endet mit ihm.</li>
      </ol>

      <h2>§ 2 Art, Zweck und Umfang der Verarbeitung</h2>
      <ol>
        <li><strong>Zweck:</strong> Führung des Treueprogramms des Ladens, Ausstellung und Aktualisierung der
          Wallet-Karten, Versand von Bestätigungen, Karten, Erinnerungen und, bei Einwilligung, Werbung,
          Auswertung der Nutzung für den Laden.</li>
        <li><strong>Art der Daten:</strong>
          <ul>{KUNDENDATEN.map(x => <li key={x}>{x}</li>)}</ul>
        </li>
        <li><strong>Betroffene:</strong> Kunden des Ladens, die eine Karte holen; Mitarbeitende des Ladens mit
          Zugang zum Scanner (Name des Zugangs, Zeitpunkte der Scans).</li>
        <li><strong>Ort:</strong> Server und Datenbank bei Render{SERVER_REGION ? ` im Rechenzentrum ${SERVER_REGION}` : ''}. Weitere
          Dienste siehe § 7.</li>
      </ol>

      <h2>§ 3 Weisungen des Ladens</h2>
      <ol>
        <li>Stampit verarbeitet die Daten nur nach dokumentierter Weisung des Ladens. Die Nutzung der Funktionen
          in der App (Karten anlegen, Nachrichten senden, Kunden löschen, Einstellungen ändern) gilt als Weisung.</li>
        <li>Weitere Weisungen erteilt der Laden per E-Mail an {BETREIBER.email}. Hält Stampit eine Weisung für
          rechtswidrig, teilt es das unverzüglich mit und darf die Ausführung aussetzen, bis der Laden sie bestätigt.</li>
        <li>Stampit darf die Daten nicht für eigene Zwecke nutzen, insbesondere nicht für eigene Werbung, und nicht
          an Dritte verkaufen oder weitergeben, außer an die in § 7 genannten Dienste.</li>
      </ol>

      <h2>§ 4 Pflichten von Stampit</h2>
      <ol>
        <li>Stampit verpflichtet alle Personen, die Zugang zu den Daten haben, zur Vertraulichkeit.</li>
        <li>Stampit trifft die technischen und organisatorischen Maßnahmen nach Anlage 1 und passt sie dem Stand
          der Technik an, ohne das Schutzniveau zu senken.</li>
        <li>Stampit unterstützt den Laden bei der Erfüllung der Rechte der Betroffenen (Auskunft, Berichtigung,
          Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch). Löschanfragen von Kunden, die über den
          Lösch-Link in E-Mails eingehen, führt Stampit unmittelbar aus und informiert den Laden auf Wunsch.</li>
        <li>Stampit unterstützt den Laden bei Datenschutz-Folgenabschätzungen und bei Anfragen von
          Aufsichtsbehörden, soweit sie diese Verarbeitung betreffen.</li>
        <li>Stampit meldet dem Laden Verletzungen des Schutzes personenbezogener Daten unverzüglich, spätestens
          innerhalb von 48 Stunden nach Kenntnis, mit allen Angaben, die der Laden für seine Meldung nach
          Art. 33 DSGVO braucht.</li>
        <li>Stampit benennt als Ansprechpartner für den Datenschutz: {BETREIBER.inhaber}, {BETREIBER.email}.</li>
      </ol>

      <h2>§ 5 Pflichten des Ladens</h2>
      <ol>
        <li>Der Laden ist für die Rechtmäßigkeit der Verarbeitung verantwortlich, insbesondere für die Information
          seiner Kunden (Art. 13 DSGVO). Stampit stellt dafür Texte auf der Anmeldeseite und in den E-Mails bereit.</li>
        <li>Der Laden fragt bei der Anmeldung nur Daten ab, die er braucht, und setzt Geburtstag und Telefonnummer
          nur ein, wenn er dafür einen Zweck hat.</li>
        <li>Der Laden sichert die Zugänge seines Personals und sperrt sie, wenn Mitarbeitende ausscheiden.</li>
        <li>Werbung per E-Mail oder Mitteilung versendet der Laden nur an Kunden, die eingewilligt haben, und hält
          sich an die Vorgaben der App.</li>
      </ol>

      <h2>§ 6 Kontrollrechte</h2>
      <ol>
        <li>Stampit weist die Einhaltung dieses Vertrags auf Anfrage nach, in der Regel durch diese Unterlagen,
          die Beschreibung der Maßnahmen in Anlage 1 und Auskünfte per E-Mail.</li>
        <li>Reicht das nicht aus, kann der Laden nach Ankündigung von mindestens 14 Tagen einmal im Jahr eine
          Prüfung durchführen oder durch einen zur Vertraulichkeit verpflichteten Dritten durchführen lassen, im
          Umfang, der für die Verarbeitung nach diesem Vertrag erforderlich ist.</li>
      </ol>

      <h2>§ 7 Unterauftragsverarbeiter</h2>
      <ol>
        <li>Der Laden stimmt dem Einsatz der folgenden Unterauftragsverarbeiter zu:</li>
      </ol>
      <UavTabelle />
      <ol start="2">
        <li>Stampit verpflichtet Unterauftragsverarbeiter vertraglich auf ein Schutzniveau, das diesem Vertrag
          entspricht. Für Dienste außerhalb der EU gelten EU-Standardvertragsklauseln bzw. das EU-US Data
          Privacy Framework.</li>
        <li>Stampit informiert den Laden über geplante Änderungen (neue oder ausgetauschte Dienste) per E-Mail
          mindestens 30 Tage im Voraus. Der Laden kann aus wichtigem Grund widersprechen; kommt keine Einigung
          zustande, darf er den Nutzungsvertrag zum Zeitpunkt der Änderung kündigen.</li>
      </ol>

      <h2>§ 8 Löschung und Rückgabe</h2>
      <ol>
        <li>Nach Ende des Nutzungsvertrags löscht Stampit alle Kundendaten des Ladens innerhalb von 30 Tagen,
          sofern der Laden sie nicht vorher exportiert hat oder gesetzliche Aufbewahrungspflichten entgegenstehen.
          Auf Wunsch stellt Stampit die Daten vorher in einem gängigen Format bereit.</li>
        <li>Wallet-Karten der Kunden werden mit der Löschung ungültig; der Kunde entfernt sie selbst aus seinem Wallet.</li>
        <li>Stampit bestätigt die Löschung auf Anfrage schriftlich.</li>
      </ol>

      <h2>§ 9 Haftung, Schlussbestimmungen</h2>
      <ol>
        <li>Für die Haftung gilt Art. 82 DSGVO. Im Übrigen gelten die Haftungsregeln des Nutzungsvertrags.</li>
        <li>Änderungen dieses Vertrags bedürfen der Textform. Es gilt deutsches Recht. Sollte eine Bestimmung
          unwirksam sein, bleibt der Vertrag im Übrigen wirksam.</li>
      </ol>

      <h2>Anlage 1: Technische und organisatorische Maßnahmen</h2>
      <h3>Zugang und Zutritt</h3>
      <ul>
        <li>Betrieb in Rechenzentren von Render{SERVER_REGION ? ` (${SERVER_REGION})` : ''} mit Zutrittskontrolle durch den
          Anbieter; kein eigener Serverraum.</li>
        <li>Zugang zur Verwaltung nur für den Betreiber mit eigenem Zugang; Zugang der Läden mit E-Mail und
          Passwort (nur als Hash gespeichert); Zugänge des Personals über Einmal-Codes mit Rollen (Aushilfe,
          Mitarbeiter, Tablet), die der Laden jederzeit sperren kann.</li>
        <li>Schnittstellen-Schlüssel werden nur als Hash gespeichert; Webhook-Aufrufe sind signiert.</li>
      </ul>
      <h3>Übertragung und Speicherung</h3>
      <ul>
        <li>Verschlüsselte Übertragung (TLS) für Website, App, Wallet-Dienste und zur Datenbank.</li>
        <li>Trennung der Daten je Laden über Kennungen; jeder Zugriff prüft die Zugehörigkeit zum Laden.</li>
        <li>Offene Endpunkte (Anmeldung, Formulare, Demo) sind gegen Massenanfragen gedrosselt; Formulare haben
          einen Schutz gegen automatisierte Eingaben.</li>
      </ul>
      <h3>Integrität und Verfügbarkeit</h3>
      <ul>
        <li>Datenbank und Anwendung werden von Render betrieben und überwacht; Software-Änderungen durchlaufen
          automatisierte Tests, bevor sie live gehen.</li>
        <li>Protokollierung von Stempeln, Prämien und Nachrichten mit Zeitpunkt; Scans außerhalb des Ladens werden
          als Vorfall festgehalten.</li>
      </ul>
      <h3>Datenschutz durch Technik</h3>
      <ul>
        <li>Datensparsamkeit: Geburtstag und Telefonnummer nur, wenn der Laden sie einschaltet; keine Zahlungsdaten,
          kein Kundenstandort.</li>
        <li>Double-Opt-In bei E-Mail-Anmeldung; Lösch-Link in jeder E-Mail; Werbung nur mit Einwilligung.</li>
        <li>Löschung eines Kunden entfernt alle seine Daten einschließlich der Wallet-Registrierungen.</li>
      </ul>

      <h2>Anlage 2: Weisungsberechtigte und Ansprechpartner</h2>
      <p>Für den Laden: der Inhaber oder von ihm benannte Personen mit Zugang zum Konto des Ladens.<br />
        Für Stampit: {BETREIBER.inhaber}, {BETREIBER.email}.</p>

      <div className="lp-recht-aktionen">
        <button type="button" className="lp-btn lp-btn--primary" onClick={() => window.print()}>Drucken oder als PDF speichern</button>
      </div>
      <p className="lp-recht-meta">Stand: {STAND}</p>
    </RechtSeite>
  )
}
