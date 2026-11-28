# Mehrere Aufnahmen desselben Textes (gleiche Stimme), jeweils mit Zeiten gespeichert,
# damit die gewaehlte Aufnahme ohne neue Kosten direkt ins Video kann.
import json,subprocess,base64,os,sys
here=os.path.dirname(os.path.abspath(__file__))
text=open(os.path.join(here,'..','text.txt')).read()
for name,seed,speed in [('A',1101,1.0),('B',2202,1.0),('C',3303,1.05)]:
    body=json.dumps({'text':text,'model_id':'eleven_multilingual_v2','language_code':'de','seed':seed,'voice_settings':{'stability':0.35,'similarity_boost':0.75,'style':0.6,'speed':speed}})
    r=subprocess.run(['curl','-sS','-m','180','-X','POST','https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ/with-timestamps?output_format=mp3_44100_128','-H','Content-Type: application/json','--data-binary',body,'-w','\n%{http_code}'],capture_output=True,text=True)
    out,code=r.stdout.rsplit('\n',1)
    if code!='200': print(name,'http',code,out[:300]); continue
    d=json.loads(out)
    open(os.path.join(here,'takes',f'Liam-Aufnahme-{name}.mp3'),'wb').write(base64.b64decode(d['audio_base64']))
    json.dump({'seed':seed,'speed':speed,'alignment':d['alignment']},open(os.path.join(here,'takes',f'{name}.json'),'w'),ensure_ascii=False)
    print(name,'seed',seed,'speed',speed,'Laenge',d['alignment']['character_end_times_seconds'][-1],'s')
