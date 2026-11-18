import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const content=JSON.parse(readFileSync(new URL('../dist/content.json',import.meta.url)));
const core=readFileSync(new URL('../site/core.js',import.meta.url),'utf8').replaceAll('export ','');
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8').split('\n').slice(1).join('\n');
const script=new vm.Script('(async()=>{'+core+'\nconst esc=escapeHTML;\n'+app+'\nreturn {render,switchLanguage,openSearch,about,reader,currentProgress,getState:()=>state};})()');
function fixture(){
 const nodes=new Map(),listeners={document:{},window:{}};
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',hidden:false,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){(this.events??={})[type]=fn;},setAttribute(k,v){(this.attrs??={})[k]=v;},getAttribute(k){return this.attrs?.[k]??null;},insertAdjacentHTML(pos,html){this.innerHTML=html+this.innerHTML;},showModal(){this.open=true;},close(){this.open=false;},focus(){},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}}});return nodes.get(selector);}
 const storage=new Map();const location={hash:'#home',protocol:'file:',reload(){}};
 const document={querySelector:node,querySelectorAll:()=>[node('#search-dialog'),node('#about-dialog')],documentElement:{lang:'',style:{setProperty(){}},scrollHeight:4000},body:node('body'),addEventListener(type,fn){listeners.document[type]=fn;},title:'',activeElement:null};
 const window={CITOYEN_DATA:content,scrollTo(){},addEventListener(type,fn){listeners.window[type]=fn;}};
 const errors=[];
 const ctx=vm.createContext({document,window,location,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{onLine:true},console:{error:e=>errors.push(e)},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:fn=>fn(),scrollY:0,innerHeight:800,Blob,URL});
 return {ctx,nodes,node,storage,location,listeners,errors};
}
test('All 249 reader views and chapter routes generate without runtime errors',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 assert.ok(f.node('#app').innerHTML.includes('Comprendre la France'));
 for(const language of ['fr','en','both']){
  api.switchLanguage(language);
  for(const p of content.pages){f.location.hash='#page/'+p.id;api.render();assert.ok(f.node('#app').innerHTML.includes('reading-body'));assert.ok(f.node('#app').innerHTML.includes(p[language==='en'?'en':'fr'].html));}
  for(const c of content.chapters){f.location.hash='#chapter/'+c.id;api.render();assert.ok(f.node('#app').innerHTML.includes('page-list'));}
 }
 assert.deepEqual(f.errors,[]);
});
test('Read and bookmark actions persist and language switching retains the page',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);f.location.hash='#page/p006';api.render();
 function click(action){return f.listeners.document.click({target:{closest(selector){return selector==='[data-action]'?{dataset:{action}}:null;}}});}
 await click('bookmark');await click('read');api.switchLanguage('en');
 assert.equal(f.location.hash,'#page/p006');assert.equal(api.getState().language,'en');assert.ok(api.getState().read.includes('p006'));assert.ok(api.getState().bookmarks.includes('p006'));
 const stored=JSON.parse([...f.storage.values()][0]);assert.ok(stored.read.includes('p006'));
 await click('bookmark');await click('read');assert.equal(api.getState().bookmarks.length,0);assert.equal(api.getState().read.length,0);
});

test('Skip to content focuses the lesson without changing its route or saved page',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 for(const id of ['p021','p053']){
  f.location.hash='#page/'+id;api.render();
  let prevented=false,focused=false,scrolled=false;
  f.node('#main').focus=()=>{focused=true;};
  f.ctx.window.scrollTo=(x,y)=>{scrolled=x===0&&y===0;};
  await f.listeners.document.click({preventDefault(){prevented=true;},target:{closest:selector=>selector==='.skip'?{}:null}});
  assert.ok(prevented&&focused&&scrolled);
  assert.equal(f.location.hash,'#page/'+id);
  assert.equal(api.getState().last,id);
 }
});

test('Page selector stays above the lesson and clear of previous and next navigation',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 for(const language of ['fr','en','both']){
  f.location.hash='#page/p021';api.switchLanguage(language);
  const html=f.node('#app').innerHTML;
  assert.equal((html.match(/id="jump-page"/g)||[]).length,1);
  assert.ok(html.indexOf('id="jump-page"')<html.indexOf('reader-title'));
  const navigation=html.slice(html.indexOf('<nav class="page-navigation"'),html.indexOf('</nav>',html.indexOf('<nav class="page-navigation"')));
  assert.ok(navigation.includes('#page/p020')&&navigation.includes('#page/p022'));
  assert.ok(!navigation.includes('<select'));
 }
 await f.listeners.document.change({target:{id:'jump-page',value:'p053'}});
 assert.equal(f.location.hash,'#page/p053');
});
test('Search renders bilingual results and safely handles HTML-like queries',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);api.openSearch();
 f.node('#search-input').events.input({target:{value:'laicite'}});assert.ok(f.node('#results').innerHTML.includes('#page/p010'));
 f.node('#search-input').events.input({target:{value:'<img onerror=bad>'}});assert.ok(!f.node('#results').innerHTML.includes('<img'));
 api.about();assert.ok(f.node('#about-body').innerHTML.includes('83'));assert.deepEqual(f.errors,[]);
});
test('Service worker precaches all files and serves cached requests without the network',async()=>{
 const handlers={},cache=new Map();let networkCalls=0;
 const storage={open:async()=>({addAll:async requests=>requests.forEach(request=>{assert.equal(request.cache,'reload');cache.set(request.url,{cached:true,url:request.url});})}),keys:async()=>['other-app','citoyen-old','citoyen-test'],delete:async key=>{assert.ok(key.startsWith('citoyen-'));return true;},match:async req=>cache.get(typeof req==='object'?req.url:req)};
 const self={location:{origin:'https://example.com'},registration:{scope:'https://example.com/citoyen/'},clients:{claim:async()=>{}},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting(){}};
 vm.runInNewContext(readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),{self,caches:storage,URL,Request,fetch:async()=>{networkCalls++;throw Error('offline')}});
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;
 assert.ok(cache.has('https://example.com/citoyen/content.json'));
 let response;handlers.fetch({request:{url:'https://example.com/citoyen/content.json',method:'GET'},respondWith:r=>response=r});assert.equal((await response).cached,true);assert.equal(networkCalls,0);
 handlers.activate({waitUntil:p=>pending=p});await pending;
});
test('Light, Dark and AMOLED controls exist on every route and persist explicit selection',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 for(const hash of ['#home','#chapter/values','#page/p006','#bookmarks','#notes']){
  f.location.hash=hash;api.render();
  const html=f.node('#app').innerHTML;
  assert.ok(html.includes('data-theme="light"'));assert.ok(html.includes('data-theme="dark"'));assert.ok(html.includes('data-theme="amoled"'));
  assert.ok(html.indexOf('data-theme="dark"')<html.indexOf('</header>'));
 }
 f.location.hash='#page/p006';api.render();
 for(const value of ['dark','amoled','light']){
  await f.listeners.document.click({target:{closest:selector=>selector==='[data-theme]'?{dataset:{theme:value}}:null}});
  assert.equal(api.getState().theme,value);assert.equal(api.getState().dark,value!=='light');
  assert.equal(JSON.parse([...f.storage.values()][0]).theme,value);
  assert.equal(f.location.hash,'#page/p006');
 }
});

test('Map enlargement opens, zooms and closes without changing the lesson or translation',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);f.location.hash='#page/p021';api.switchLanguage('en');
 const html=f.node('#app').innerHTML;assert.ok(html.includes('Administrative map of France'));assert.ok(html.includes('visuals/carte-france.jpg'));assert.ok(html.includes(content.pages[20].en.html));
 await f.listeners.document.click({target:{closest:s=>s==='[data-figure]'?{dataset:{figure:'carte-france'},focus(){}}:null}});
 assert.equal(f.node('#figure-dialog').open,true);assert.ok(f.node('#figure-image').src.endsWith('carte-france.jpg'));
 f.node('#figure-zoom').events.click();assert.equal(f.node('#figure-image').style.width,'1800px');
 f.node('#figure-zoom').events.click();assert.equal(f.node('#figure-image').style.width,'100%');
 f.node('#close-figure').events.click();assert.equal(f.node('#figure-dialog').open,false);assert.equal(f.location.hash,'#page/p021');assert.equal(api.getState().language,'en');
});
test('Homepage purpose is translated and leaves the reading action first',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 for(const [l,heading] of [['fr','POURQUOI CE GUIDE ?'],['en','WHY THIS GUIDE?']]){api.switchLanguage(l);const html=f.node('#app').innerHTML;assert.ok(html.includes(heading));assert.ok(html.indexOf('hero-buttons')<html.indexOf('why-guide'));}
});

test('Compact phone appearance selector persists all three themes',async()=>{const f=fixture(),api=await script.runInContext(f.ctx);for(const value of ['dark','amoled','light']){await f.listeners.document.change({target:{id:'theme-select',value}});assert.equal(api.getState().theme,value);assert.ok(f.node('#app').innerHTML.includes('value="'+value+'" selected'));}});
