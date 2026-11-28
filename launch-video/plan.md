# Stampit - Werbevideo (Entwurf)

**Eine Zeile:** Aus Laufkundschaft werden Stammkunden - die Stempelkarte liegt in der Wallet, nicht im Portemonnaie.
**Struktur:** Before / After
**Beweis-Moment:** Sperrbildschirm 08:14, die Karte meldet sich von selbst: "Café Nordwind - 6 von 6, dein Kaffee wartet".
**Tempo:** 120 BPM (1 Schlag = 0,5 s), ca. 23 s

Alle Texte stammen von der Landing Page (i18n `lp_*`), nichts Erfundenes.

| # | Zeit | Bild | Text | Bewegung | Übergang |
|---|------|------|------|----------|----------|
| 1 | 0,0-2,0 | Zerknitterte Papier-Stempelkarte, 3 von 6 Stempeln | "Papier, das im Portemonnaie zerfällt." | Karte kippt, leichter Zoom | harter Schnitt |
| 2 | 2,0-3,5 | Drei schnelle Schnitte auf Lila/Weiß/Lila | "Kein Download." / "Kein Plastik." / "Kein Papier." | je 0,5 s, pop | push |
| 3 | 3,5-6,0 | QR-Code am Tresen, Handy davor | "Kunde scannt den QR-Code." | Handy gleitet ins Bild | slide |
| 4 | 6,0-9,0 | Café-Nordwind-Karte gleitet in die Wallet | "Liegt in Apple und Google Wallet." | Karte slide-in, Ken Burns | wipe |
| 5 | 9,0-14,0 | Dieselbe Karte, Stempel 1 bis 6 füllen sich auf dem Takt | "Personal stempelt jeden Besuch." | Stempel pop je Schlag | push |
| 6 | 14,0-17,5 | Sperrbildschirm 08:14, Benachrichtigung fällt herein | "Die Karte meldet sich von selbst." | Benachrichtigung slide von oben | cross-zoom (Akzent) |
| 7 | 17,5-19,5 | Lila Vollfläche | "Aus Laufkundschaft werden Stammkunden." | Wort für Wort | push |
| 8 | 19,5-23,0 | Logo + Wortmarke | "Stampit" / "14 Tage kostenlos testen" / "stampit-app.de" | fade, halten | - |

Marke: Lila #3C3489, Tinte #1A1A2E, Fläche #F6F5FB; Schrift Space Grotesk (Titel), Hanken Grotesk (Text); Logo = Stempel im abgerundeten Quadrat (`src/components/Logo.jsx`).

## Stimme (gewaehlt)
ElevenLabs "Liam" (TX3LPaxmHKxFdv7VOQHJ), Modell eleven_multilingual_v2, stability 0.35, similarity 0.75, style 0.6, speed 1.0 - Probe: stimmen/runde3/Hoerprobe-Liam-lebhaft.mp3
