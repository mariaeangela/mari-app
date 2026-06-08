import subprocess, json, urllib.parse, time
def curl(u):
    r=subprocess.run(['curl','-s','-A','DiagonalApp/1.0',u],capture_output=True,text=True,timeout=30,encoding='utf-8'); return r.stdout or ''
def intro(t,lang):
    u=f'https://{lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&redirects=1&format=json&titles={urllib.parse.quote(t)}'
    try:
        d=json.loads(curl(u)); p=list(d['query']['pages'].values())[0]
        if 'missing' in p: return 'MISSING',''
        ex=(p.get('extract') or '').strip()
        return ex.split(chr(10))[0].strip(), 'https://'+lang+'.wikipedia.org/wiki/'+urllib.parse.quote(p['title'].replace(' ','_'))
    except Exception as e: return 'ERR'+str(e)[:20],''
items=[
 ('FIM Aftersun','Aftersun'),
 ('FIM ColdWar','Guerra Fria (filme de 2018)'),
 ('FIM InMood','Amor à Flor da Pele'),
 ('FIM Before','Antes do Amanhecer'),
 ('FIM LaLaLand','La La Land'),
 ('FIM Retrato','Retrato de uma Jovem em Chamas'),
 ('FIM DriveMyCar','Drive My Car (filme)'),
 ('FIM PiorPessoa','A Pior Pessoa do Mundo'),
 ('CON Skinner','Condicionamento operante'),
 ('CON Milgram','Experimento de Milgram'),
 ('CON Topofilia','Topofilia'),
 ('CON Desconto','Desconto hiperbólico'),
 ('CON Flow','Flow (psicologia)'),
]
out=[]
for key,t in items:
    para,url=intro(t,'pt'); time.sleep(2.2)
    out.append(f'### {key}\nTITLE: {t}\nURL: {url}\n{para}\n')
open('.wf_out.txt','w',encoding='utf-8').write('\n'.join(out)); print('done')
