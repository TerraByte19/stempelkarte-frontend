# Prüfdaten

Kopien aus dem ersten Video (`launch-video/build`), damit `tools/selftest.mjs`
auch ohne diesen Ordner läuft. Nicht ändern.

| Datei | Herkunft | Wozu |
|---|---|---|
| `satz-austausch-vorher.mp3` + `.alignment.json` | `voice/liam-v6.mp3`, `voice/alignment-v6.json` | Aufnahme vor dem Satz-Austausch ("Und das lohnt sich:") |
| `satz-austausch-neuer-satz.mp3` | `voice/clip.mp3` | der neu aufgenommene Satz ("Und das lohnt sich!") |
| `referenz-times.json` | `video/times.js` | Wort-Zeiten des ersten Videos |
| `referenz-cues.json` | `events.json` | die 35 Töne des ersten Videos |

Das erwartete Ergebnis des Satz-Austauschs ist die Aufnahme im Cache des
Referenzvideos (`videos/2026-11-14-kaffee-aufs-haus/voice/`).
