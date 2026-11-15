#!/bin/bash
# tts.sh <name> <voice_id> <model> <stability> <style> <outdir> [speed] - erzeugt eine Hoerprobe ueber ElevenLabs
T=$(cat "$(dirname "$0")/text.txt")
body=$(python3 -c "import json,sys;print(json.dumps({'text':sys.argv[1],'model_id':sys.argv[2],'language_code':'de','voice_settings':{'stability':float(sys.argv[3]),'similarity_boost':0.75,'style':float(sys.argv[4]),'speed':float(sys.argv[5])}}))" "$T" "$3" "$4" "$5" "${7:-1.0}")
code=$(curl -sS -m 120 -X POST "https://api.elevenlabs.io/v1/text-to-speech/$2?output_format=mp3_44100_128" -H "Content-Type: application/json" --data-binary "$body" -o "$6/Hoerprobe-$1.mp3" -w "%{http_code}")
if [ "$code" = 200 ]; then echo "$1 ok $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$6/Hoerprobe-$1.mp3")s"; else echo "$1 FEHLER $code $(head -c 200 "$6/Hoerprobe-$1.mp3")"; rm -f "$6/Hoerprobe-$1.mp3"; fi
