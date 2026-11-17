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
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',hidden:false,style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){(this.events??={})[type]=fn;},setAttribute(){},insertAdjacentHTML(pos,html){this.innerHTML=html+this.innerHTML;},showModal(){this.open=true;},close(){this.open=false;},focus(){},getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}}});return nodes.get(selector);}
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
test('Search renders bilingual results and safely handles HTML-like queries',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);api.openSearch();
 f.node('#search-input').events.input({target:{value:'laicite'}});assert.ok(f.node('#results').innerHTML.includes('#page/p010'));
 f.node('#search-input').events.input({target:{value:'<img onerror=bad>'}});assert.ok(!f.node('#results').innerHTML.includes('<img'));
 api.about();assert.ok(f.node('#about-body').innerHTML.includes('83'));assert.deepEqual(f.errors,[]);
});
test('Service worker precaches all files and serves cached requests without the network',async()=>{
 const handlers={},cache=new Map();let networkCalls=0;
 const storage={open:async()=>({addAll:async urls=>urls.forEach(u=>cache.set(new URL(u,'https://example.com/citoyen/').href,{cached:true,url:u}))}),keys:async()=>['other-app','citoyen-old','citoyen-test'],delete:async key=>{assert.ok(key.startsWith('citoyen-'));return true;},match:async req=>cache.get(typeof req==='object'?req.url:req)};
 const self={location:{origin:'https://example.com'},registration:{scope:'https://example.com/citoyen/'},clients:{claim:async()=>{}},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting(){}};
 vm.runInNewContext(readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8'),{self,caches:storage,URL,fetch:async()=>{networkCalls++;throw Error('offline')}});
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;
 assert.ok(cache.has('https://example.com/citoyen/content.json'));
 let response;handlers.fetch({request:{url:'https://example.com/citoyen/content.json',method:'GET'},respondWith:r=>response=r});assert.equal((await response).cached,true);assert.equal(networkCalls,0);
 handlers.activate({waitUntil:p=>pending=p});await pending;
});
test('White and AMOLED controls exist on every route and persist explicit selection',async()=>{
 const f=fixture(),api=await script.runInContext(f.ctx);
 for(const hash of ['#home','#chapter/values','#page/p006','#bookmarks','#notes']){
  f.location.hash=hash;api.render();
  const html=f.node('#app').innerHTML;
  assert.ok(html.includes('data-theme="light"'));assert.ok(html.includes('data-theme="dark"'));
  assert.ok(html.indexOf('data-theme="dark"')<html.indexOf('</header>'));
 }
 f.location.hash='#page/p006';api.render();
 for(const value of ['dark','light']){
  await f.listeners.document.click({target:{closest:selector=>selector==='[data-theme]'?{dataset:{theme:value}}:null}});
  assert.equal(api.getState().dark,value==='dark');
  assert.equal(JSON.parse([...f.storage.values()][0]).dark,value==='dark');
  assert.equal(f.location.hash,'#page/p006');
 }
});
