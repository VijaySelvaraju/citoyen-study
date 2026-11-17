"""Produce a portable reader that opens directly from disk (PWA install needs hosting)."""
from pathlib import Path
import re,json,base64
root=Path(__file__).resolve().parent.parent
dist=root/'dist'
s=(dist/'index.html').read_text()
s=s.replace('<link rel="manifest" href="./manifest.webmanifest">','')
s=s.replace('<link rel="stylesheet" href="./styles.css">','<style>'+(dist/'styles.css').read_text()+'</style>')
s=re.sub(r'<link rel="(?:icon|apple-touch-icon)"[^>]+>','',s)
s=s.replace('<script src="./app.js" type="module"></script>','')
core=(dist/'core.js').read_text().replace('export ','')+'\nconst esc=escapeHTML;'
app=(dist/'app.js').read_text().split('\n',1)[1]
# Embed readable source downloads and the logo; the portable copy needs no local siblings.
for lang in ('fr','en'):
 url='data:text/markdown;charset=utf-8;base64,'+base64.b64encode((dist/f'source-{lang}.md').read_bytes()).decode()
 app=app.replace(f'./source-{lang}.md',url)
 s=s.replace(f'./source-{lang}.md',url)
app=app.replace('./icon.svg','data:image/svg+xml;base64,'+base64.b64encode((dist/'icon.svg').read_bytes()).decode())
payload=json.loads((dist/'content.json').read_text())
for f in payload.get('visuals',[]):
 f['src']='data:image/jpeg;base64,'+base64.b64encode((dist/f['src']).read_bytes()).decode()
content=json.dumps(payload,ensure_ascii=False).replace('</','<\\/')
s=s.replace('</body>',f'<script>window.CITOYEN_DATA={content};</script><script type="module">{core}\n{app}</script></body>')
(root/'Citoyen.html').write_text(s)
print('Created standalone Citoyen.html')
