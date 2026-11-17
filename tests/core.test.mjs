import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {validState,parseRoute,searchPages,escapeHTML} from '../site/core.js';
const data=JSON.parse(readFileSync(new URL('../dist/content.json',import.meta.url)));
test('Every page 1–83 has French and English content in the original order',()=>{
 assert.deepEqual(data.pages.map(p=>p.number),Array.from({length:83},(_,i)=>i+1));
 for(const lang of ['fr','en']){
  const source=readFileSync(new URL(`../content/${lang}.md`,import.meta.url),'utf8').split(/^# (?:Notes éditoriales|Editorial notes)/m)[0];
  const starts=[...source.matchAll(/^## Page (\d+) — (.+)$/gm)];
  data.pages.forEach((p,i)=>{
   const expected=source.slice(starts[i].index+starts[i][0].length,starts[i+1]?.index??source.length).trim();
   assert.equal(p[lang].markdown,expected,`${lang} page ${i+1}`);
   assert.ok(p[lang].html.length>0);
  });
 }
});
test('Editorial notes remain separate and attach to all relevant pages',()=>{
 assert.equal(data.notes.length,14);assert.deepEqual(data.notes.find(n=>n.id==='E2').pages,[22,23]);
 assert.ok(data.notes.find(n=>n.id==='E11').pages.includes(76));
 for(const n of data.notes){assert.ok(n.fr);assert.ok(n.en);assert.ok(n.pages.every(p=>p>=1&&p<=83));}
 assert.ok(!data.pages[82].fr.markdown.includes('Notes éditoriales'));
});
test('Search ignores accents and case and finds either language',()=>{
 assert.ok(searchPages(data.pages,'LAICITE').some(p=>p.number===10));
 assert.ok(searchPages(data.pages,'secular').some(p=>p.number===10));
 assert.equal(searchPages(data.pages,'zzzz-nonexistent-qqqq').length,0);
 assert.deepEqual(searchPages(data.pages,'  '),[]);
});
test('Stored state survives malformed or stale input without invalid page IDs',()=>{
 assert.equal(validState(null).language,'fr');
 const s=validState({language:'xx',read:['p006','p006','p084','p000','bad'],bookmarks:'bad',font:999,last:'p999',positions:{p006:.4,p007:Infinity,p008:-1}});
 assert.deepEqual(s.read,['p006']);assert.deepEqual(s.bookmarks,[]);assert.equal(s.last,null);assert.equal(s.font,18);assert.deepEqual(s.positions,{p006:.4});
});
test('Deep links are stable across locales and hosting subpaths',()=>{
 assert.deepEqual(parseRoute('#page/p078'),{kind:'page',id:'p078'});assert.deepEqual(parseRoute('#chapter/history'),{kind:'chapter',id:'history'});assert.deepEqual(parseRoute('#bad'),{kind:'home'});
 assert.equal(new URL('./content.json','https://example.github.io/citoyen/').pathname,'/citoyen/content.json');
});
test('Untrusted display text is escaped',()=>assert.equal(escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;'));
test('Manifest and precache work at a GitHub Pages repository path',()=>{
 const m=JSON.parse(readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url)));
 assert.equal(m.start_url,'./');assert.equal(m.scope,'./');
 for(const icon of m.icons)assert.ok(existsSync(new URL('../dist/'+icon.src,import.meta.url)));
 const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
 for(const f of ['content.json','app.js','core.js','styles.css','index.html'])assert.ok(sw.includes('./'+f));
 assert.ok(!sw.includes('__VERSION__'));
 const publicContent=JSON.stringify(data);assert.ok(!publicContent.includes('libfile_'));assert.ok(!publicContent.includes('chatgpt.com/library'));
});
