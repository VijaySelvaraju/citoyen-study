"""Build a dependency-free, GitHub Pages compatible bilingual reader."""
import re, json, html, pathlib, shutil, hashlib, struct, zlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
OUT.mkdir(exist_ok=True)
OFFICIAL = 'https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html'
PDF = 'https://www.immigration.interieur.gouv.fr/sites/dgef/files/medias/documents/2026-07/LIVRET%20DU%20CITOYEN%202026_0.pdf'
def inline(s):
    s = html.escape(s)
    links=[]
    def link(m):
        label,url=m.group(1),m.group(2)
        if not url.startswith(('https://','http://')): return label
        links.append(f'<a href="{url}" target="_blank" rel="noopener noreferrer">{label} ↗</a>')
        return f'@@LINK{len(links)-1}@@'
    s=re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',link,s)
    s=re.sub(r'https?://[^\s<>]+',lambda m: link(type('Match',(),{'group':lambda _,n: m.group(0).rstrip('.,;')})()),s)
    s=re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',s)
    s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<em>\1</em>',s)
    s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
    s=re.sub(r'\[(E\d+)\]',r'<span class="note-ref">[\1]</span>',s)
    for i,l in enumerate(links): s=s.replace(f'@@LINK{i}@@',l)
    return s

def markdown(s):
    lines=s.splitlines(); out=[]; i=0
    while i<len(lines):
        l=lines[i].strip()
        if not l: i+=1; continue
        if l.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?',c) for c in row): rows.append(row)
                i+=1
            out.append('<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table><thead><tr>'+''.join('<th>'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in r)+'</tr>' for r in rows[1:])+'</tbody></table></div>'); continue
        if re.match(r'^#{1,6} ',l):
            label=re.sub(r'^#+ ','',l); out.append('<h3>'+inline(label)+'</h3>'); i+=1; continue
        if re.match(r'^[-*] ',l):
            items=[]
            while i<len(lines) and re.match(r'^[-*] ',lines[i].strip()):
                items.append('<li>'+inline(lines[i].strip()[2:])+'</li>');i+=1
            out.append('<ul>'+''.join(items)+'</ul>');continue
        if l=='---':out.append('<hr>');i+=1;continue
        para=[]
        while i<len(lines) and lines[i].strip() and not re.match(r'^(#{1,6} |[-*] |\|)',lines[i].strip()):
            line=lines[i];para.append(inline(line.rstrip())+('<br>' if line.endswith('  ') else ' '));i+=1
        out.append('<p>'+''.join(para).strip()+'</p>')
    return '\n'.join(out)

chapters=[
 ('intro',1,4,'Pour commencer','Before you begin','Un premier pas vers la citoyenneté.','A first step towards citizenship.','○'),
 ('values',5,14,'Principes et valeurs','Principles & values','Les idées qui nous rassemblent.','The ideas that bring us together.','✳'),
 ('institutions',15,23,'Institutions et politique','Institutions & politics','Comprendre la démocratie française.','Understand French democracy.','▥'),
 ('rights',24,36,'Droits et devoirs','Rights & duties','Les libertés et les responsabilités de chacun.','The freedoms and responsibilities we share.','⚖'),
 ('history',37,60,'Histoire, géographie et culture','History, geography & culture','Découvrir la France, hier et aujourd’hui.','Discover France, then and now.','◷'),
 ('society',61,76,'Vivre en France','Life in French society','Les repères de la vie quotidienne.','Find your way through everyday life.','⌂'),
 ('appendices',77,83,'Annexes et textes fondateurs','Appendices & founding texts','Revenir aux textes de référence.','Go back to the founding texts.','≡')]
data={'edition':'May 2026','reviewDate':'2026-11-16','officialUrl':OFFICIAL,'pdfUrl':PDF,'chapters':[dict(id=c[0],start=c[1],end=c[2],title={'fr':c[3],'en':c[4]},description={'fr':c[5],'en':c[6]},icon=c[7]) for c in chapters],'pages':[],'editorial':{},'method':{}}
parsed={}
for lang in ('fr','en'):
    raw=(ROOT/'content'/f'{lang}.md').read_text()
    raw=re.sub(r'\A---\n.*?\n---\n','',raw,flags=re.S)
    raw=re.sub(r'^.*https://chatgpt.com/library\?.*\n?','',raw,flags=re.M)
    # Keep a public, cleaned archival source without private Library metadata.
    (OUT/f'source-{lang}.md').write_text(raw)
    body,notes=re.split(r'^# (?:Notes éditoriales|Editorial notes).*?\n',raw,maxsplit=1,flags=re.M)
    parts=list(re.finditer(r'^## Page (\d+) — (.+)$',body,re.M))
    assert [int(m[1]) for m in parts]==list(range(1,84)),f'{lang}: missing or duplicate page'
    parsed[lang]={int(m[1]):{'title':m[2],'markdown':body[m.end():parts[i+1].start() if i+1<len(parts) else len(body)].strip()} for i,m in enumerate(parts)}
    data['editorial'][lang]=markdown(notes)
    data['method'][lang]=markdown(body[:parts[0].start()])
    for p in parsed[lang].values():p['html']=markdown(p['markdown'])
for n in range(1,84):
    chapter=next(c[0] for c in chapters if c[1]<=n<=c[2])
    data['pages'].append(dict(id=f'p{n:03}',number=n,chapter=chapter,fr=parsed['fr'][n],en=parsed['en'][n]))
# Editorial notes are kept separately from source text and attached by page reference.
notes={}
for lang in ('fr','en'):
    raw=(ROOT/'content'/f'{lang}.md').read_text()
    for m in re.finditer(r'^\| (E\d+) \| ([^|]+) \| (.+) \|$',raw,re.M):
        cells=[x.strip() for x in m[3].split('|')]
        note=notes.setdefault(m[1],{'id':m[1],'pages':[]})
        nums=[]
        for chunk in re.split(r',\s*',m[2].strip()):
            nums.extend(range(int(chunk.split('–')[0]),int(chunk.split('–')[1])+1) if '–' in chunk else [int(chunk)])
        note['pages']=nums;note[lang]=markdown(cells[0]);
        if lang=='en' and len(cells)>1:note['sources']=markdown(cells[1])
data['notes']=list(notes.values())
assert len(notes)==14
visuals=json.loads((ROOT/'content/visuals.json').read_text())
assert visuals['sourcePageCount']==83
for f in visuals['figures']:
    assert 1<=f['page']<=83 and (ROOT/'site'/f['src']).is_file(), f['id']
    assert all(f[k].get(l) for k in ('title','alt') for l in ('fr','en'))
data['visuals']=visuals['figures']
(OUT/'content.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
for p in (ROOT/'site').iterdir():
    if p.is_file():shutil.copy2(p,OUT/p.name)
    elif p.is_dir():shutil.copytree(p,OUT/p.name,dirs_exist_ok=True)
# Real PNG install icons, generated with Python's standard library.
def icon(size):
    rows=[]
    for y in range(size):
        row=bytearray()
        for x in range(size):
            c=(21,24,32)
            if size*.25<x<size*.75 and size*.26<y<size*.74:
                c=(255,255,255)
                if size*.31<x<size*.37:c=(86,118,149)
                if size*.63<x<size*.69:c=(190,89,67)
                if size*.49<x<size*.51:c=(21,24,32)
            row.extend(c)
        rows.append(b'\x00'+row)
    def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
for size in (192,512):(OUT/f'icon-{size}.png').write_bytes(icon(size))
(OUT/'.nojekyll').touch()
# Cache version follows the offline assets and service worker template.
files=sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob('*') if p.is_file() and p.name not in ('sw.js',))
template=(ROOT/'scripts/sw.template.js').read_text()
version=hashlib.sha256(template.encode() + b''.join((OUT/f).read_bytes() for f in files)).hexdigest()[:12]
sw=template.replace('__VERSION__',version).replace('__ASSETS__',json.dumps(['./']+['./'+f for f in files]))
(OUT/'sw.js').write_text(sw)
print(f'Built {len(data["pages"])} paired pages, {len(notes)} editorial notes, {len(chapters)} groups. Cache version {version}.')
