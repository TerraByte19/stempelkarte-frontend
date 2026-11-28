#!/bin/bash
# eyes-setup.sh - richtet das Video-Analysewerkzeug "eyes" (claude-eyes) in einem frischen Container ein.
#
# Aufruf:  bash studio/tools/eyes-setup.sh
# Danach:  /home/user/.venvs/eyes/bin/eyes-run <eyes-Argumente>   (NIE "eyes" direkt aufrufen, siehe unten)
# Wie man damit ein fertiges Video prueft, steht in studio/AUTOMATIK.md, Abschnitt 9.
#
# Die Befehle unten sind genau die, die am 15.11.2026 in einem frischen Container
# gelaufen sind (rund 100 Sekunden, davon 57 s fuer whisper.cpp und 23 s fuer das
# Sprachmodell). An ihnen nichts aendern, ohne das Ergebnis neu zu pruefen: jede
# Zeile haelt eine Falle fest, die bei der Pruefung des Werkzeugs gefunden wurde.
#
# Jeder Schritt prueft zuerst, ob er schon erledigt ist: mehrfaches Ausfuehren schadet nicht.
# Warum feste Versionen und ein fester Commit: der Quelltext wurde genau in diesem Stand geprueft,
# und rapidocr 3.10.0 bringt die Texterkennungs-Modelle im Paket mit (kein Nachladen von fremden Hosts).
#
# Kein "set -e": das Skript soll einen Lauf nie zum Stehen bringen. Scheitert ein Schritt,
# fehlt am Ende eben die Pruefung mit eyes; ob es geklappt hat, zeigt "eyes-run setup --json".
set -u
V=${EYES_VENV:-/home/user/.venvs/eyes}
W=${WHISPER_SRC:-/home/user/.local/src/whisper.cpp}
# Der Cache von eyes liegt beim Benutzer root (so war es in der geprueften Umgebung).
M=/root/.cache/eyes/models/ggml-large-v3-turbo-q5_0.bin
# Pruefsumme des Sprachmodells: eyes selbst prueft beim Herunterladen nichts.
SHA=394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2
# Der gepruefte Stand von claude-eyes. Die Anleitung im fremden Repo will stattdessen den
# jeweils neuesten Stand ohne Festlegung installieren; das waere ein Update, das niemand geprueft hat.
EYES_COMMIT=a5409613b2bfba96147efbebb6c92b400fe305c8
DEPS="rapidocr==3.10.0 onnxruntime==1.32.0 numpy==2.5.4 pillow==13.0.0 yt-dlp==2026.10.26 opencv-python-headless==5.0.0.93"
# Aus einem sauberen Ordner arbeiten: yt-dlp liest eine yt-dlp.conf aus dem aktuellen Ordner,
# und eyes liest dort eine .env. Fehlt /home/user, tut das Skript nichts.
cd /home/user || exit 0
# Eigene Python-Umgebung: die Pakete des Studios (numpy, pillow) bleiben davon unberuehrt.
[ -x $V/bin/python ] || python3 -m venv $V
# --only-binary: nur fertige Pakete, es wird kein fremder Bau-Code ausgefuehrt.
[ -x $V/bin/rapidocr ] || $V/bin/python -m pip install -q --only-binary=:all: $DEPS
[ -x $V/bin/eyes ] || $V/bin/python -m pip install -q "claude-eyes @ git+https://github.com/moritzkremb/claude-eyes@$EYES_COMMIT"
# whisper.cpp wird von "eyes setup --fix" unter Linux NICHT installiert, deshalb selbst bauen (ca. 1 Minute auf 4 Kernen).
# Der Bau nutzt die Befehlssaetze dieses Rechners: die Datei muss in dem Container entstehen, der sie benutzt.
if [ ! -x $V/bin/whisper-cli ]; then
  [ -d $W/.git ] || git clone -q --depth 1 --branch v1.9.5 https://github.com/ggml-org/whisper.cpp $W
  cmake -S $W -B $W/build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF >/dev/null
  cmake --build $W/build -j4 --target whisper-cli >/dev/null && install -m 0755 $W/build/bin/whisper-cli $V/bin/whisper-cli
fi
# Sprachmodell (574 MB). Muss VOR dem ersten "eyes index" da sein, sonst wird ein Ergebnis ohne Transkript gecacht.
[ -f $M ] || PATH=$V/bin:$PATH ORT_DISABLE_TELEMETRY=1 $V/bin/eyes setup --download-model large-v3-turbo-q5_0 >/dev/null
# Pruefsumme stimmt nicht -> Datei weg, damit kein fremdes Modell benutzt wird. Sitzung startet trotzdem.
echo "$SHA  $M" | sha256sum -c --quiet - || { rm -f "$M"; echo "eyes: Modell fehlt oder Pruefsumme falsch" >&2; }
# Starter mit fester Umgebung: whisper-cli im PATH, keine onnxruntime-Telemetrie, nie der bezahlte ElevenLabs-Weg.
# Warum ein Starter statt "eyes": (1) eyes findet whisper-cli nur ueber den PATH und laesst das Transkript sonst
# still weg, (2) onnxruntime funkt ohne ORT_DISABLE_TELEMETRY=1 bei jedem Lauf an Microsoft, (3) mit
# "--transcriber elevenlabs" wuerde der Ton an eine bezahlte Schnittstelle hochgeladen. In dieser Umgebung haengt
# der Proxy den echten Schluessel an, ein Platzhalter in ELEVENLABS_API_KEY wuerde also schon reichen, um Geld auszugeben.
cat > $V/bin/eyes-run <<'EOF'
#!/bin/sh
D=$(dirname "$0")
prev=""
for a in "$@"; do
  if [ "$a" = "--transcriber=elevenlabs" ] || { [ "$prev" = "--transcriber" ] && [ "$a" = "elevenlabs" ]; }; then
    echo "eyes-run: --transcriber elevenlabs ist gesperrt (bezahlte API)" >&2; exit 64
  fi
  prev="$a"
done
unset ELEVENLABS_API_KEY
export ORT_DISABLE_TELEMETRY=1
export PATH="$D:$PATH"
exec "$D/eyes" "$@"
EOF
chmod 0755 $V/bin/eyes-run
# Zum Schluss der Stand in Worten. "|| true": auch ein unvollstaendiger Aufbau beendet das Skript ohne Fehler.
$V/bin/eyes-run setup || true
