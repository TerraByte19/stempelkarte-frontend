# Erzeugt die Sprecherstimme (Liam, lebhaft) samt Zeichen-Zeiten aus text.txt.
import json,subprocess,base64,os
here=os.path.dirname(os.path.abspath(__file__))
text=open(os.path.join(here,'..','text.txt')).read()
body=json.dumps({'text':text,'model_id':'eleven_multilingual_v2','language_code':'de','voice_settings':{'stability':0.35,'similarity_boost':0.75,'style':0.6,'speed':1.0}})
r=subprocess.run(['curl','-sS','-m','180','-X','POST','https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ/with-timestamps?output_format=mp3_44100_128','-H','Content-Type: application/json','--data-binary',body,'-w','\n%{http_code}'],capture_output=True,text=True)
out,code=r.stdout.rsplit('\n',1)
if code!='200': print('http',code,out[:400]); raise SystemExit(1)
d=json.loads(out)
open(os.path.join(here,'liam.mp3'),'wb').write(base64.b64decode(d['audio_base64']))
json.dump(d['alignment'],open(os.path.join(here,'alignment.json'),'w'),ensure_ascii=False)
print(len(text),'Zeichen, Laenge',d['alignment']['character_end_times_seconds'][-1],'s')
