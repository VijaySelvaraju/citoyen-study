import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../site/styles.css',import.meta.url),'utf8');
function color(hex){const c=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function contrast(a,b){const x=color(a.slice(1)),y=color(b.slice(1));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('Both palettes meet AA text contrast and the reader uses actual white/black',()=>{
 for(const [selector,bg] of [[':root','#ffffff'],['.dark','#000000']]){
  const block=css.slice(css.indexOf(selector+'{')).split('}')[0];
  assert.ok(block.includes('--paper:'+bg));assert.ok(block.includes('--surface:'+bg));
  for(const prop of ['ink','muted','accent']){
   const match=block.match(new RegExp('--'+prop+':(#[0-9a-f]{6})'));
   assert.ok(match);assert.ok(contrast(match[1],bg)>=4.5,selector+' '+prop);
  }
 }
});
test('Responsive policy covers narrow phones and unfolded widths without disabling zoom',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('viewport-fit=cover'));assert.ok(!html.includes('user-scalable=no'));
 assert.ok(css.includes('@media(max-width:359px)'));assert.ok(css.includes('@media(max-width:719px)'));assert.ok(css.includes('@media(min-width:720px) and (max-width:1099px)'));
 assert.ok(css.includes('env(safe-area-inset-bottom)'));assert.ok(css.includes('min-height:44px'));
});
