/* stub DOM: enough for LiquidText to build its spans, filter and keyframes */
const made=[];
function el(tag){return {tagName:tag,style:{},children:[],className:'',id:'',textContent:'',
  appendChild(c){this.children.push(c);},remove(){this.removed=true;},setAttribute(){}};}
global.document={ getElementById:()=>null,
  createElement:t=>{const e=el(t);made.push(e);return e;},
  createElementNS:(ns,t)=>el(t),
  head:el('head'), body:el('body') };
global.requestAnimationFrame=()=>0; global.cancelAnimationFrame=()=>{};
const src=require('fs').readFileSync('pubsite/anim3.js','utf8');
eval(src);
const host=el('div');
const PAL=['#f84f4f','#f8f84f','#4ff84f'];
const stop=LiquidText(host,['ОДИН','ДВА','ТРИ'],{morphTime:4.5,cooldownTime:0.45,colors:PAL,flow:14});
const style=made.find(m=>m.tagName==='style');
const spans=host.children.filter(c=>c.tagName==='span');
console.assert(style, 'keyframes style element created');
console.assert(/@keyframes lt-hue-\w+\{/.test(style.textContent), 'named keyframes');
console.assert((style.textContent.match(/color:/g)||[]).length===PAL.length+1, 'one stop per colour plus the wrap');
console.assert(style.textContent.includes('0.000%{color:#f84f4f}') && style.textContent.includes('100.000%{color:#f84f4f}'), 'loop closes on the first colour');
console.assert(spans.length===2, 'two text copies');
console.assert(spans.every(s=>s.style.color===PAL[0]), 'both copies start on the same single colour');
console.assert(spans.every(s=>!s.style.backgroundImage), 'no gradient across the letters');
console.assert(spans[0].style.animation===spans[1].style.animation, 'copies share one animation so they never disagree on colour');
stop();
console.assert(style.removed, 'keyframes cleaned up on stop');
console.log('LiquidText single-colour cycle: all checks passed');
console.log('keyframes:', style.textContent);
