/* stub DOM: enough for LiquidText to build its spans, filter and flowing gradient */
const made=[];
function el(tag){return {tagName:tag,style:{},children:[],className:'',id:'',textContent:'',
  appendChild(c){this.children.push(c);},remove(){this.removed=true;},setAttribute(){}};}
global.document={ getElementById:()=>null,
  createElement:t=>{const e=el(t);made.push(e);return e;},
  createElementNS:(ns,t)=>el(t),
  head:el('head'), body:el('body') };
global.requestAnimationFrame=()=>0; global.cancelAnimationFrame=()=>{};
eval(require('fs').readFileSync('anim3.js','utf8'));

/* helpers */
console.assert(paletteAt(['#000000','#ffffff'],0)==='#000000', 'palette reads a whole step exactly');
console.assert(paletteAt(['#000000','#ffffff'],0.5)==='#808080', 'palette mixes between neighbours');
console.assert(paletteAt(['#000000','#ffffff'],2)==='#000000', 'palette wraps round');
console.assert(hslHex(0,1,.58).length===7 && /^#[0-9a-f]{6}$/.test(hslHex(0,1,.58)), 'hue converts to hex');
const g=flowGrad(['#ff0000','#00ff00','#0000ff']);
const stops=g.slice('linear-gradient(90deg,'.length,-1).split(',');
console.assert(stops.length===7, 'cycle laid down twice plus the closing stop');
console.assert(stops[0].split(' ')[0]===stops[6].split(' ')[0], 'gradient loops on itself');

/* the text itself */
const host=el('div');
const PAL=['#f84f4f','#f8a34f','#f8f84f','#4ff84f','#4f4ff8'];
const stop=LiquidText(host,['ОДИН','ДВА','ТРИ'],{morphTime:4.5,cooldownTime:0.45,colors:PAL,flow:7,drift:21});
const spans=host.children.filter(c=>c.tagName==='span');
console.assert(spans.length===2, 'two text copies');
console.assert(spans.every(s=>s.style.color==='transparent'&&s.style.backgroundClip==='text'), 'colour comes from the gradient, not a solid fill');
console.assert(spans.every(s=>s.style.backgroundSize==='200% auto'), '200% ramp so the travel can loop');
console.assert(spans.every(s=>/^lt-flow 7s linear infinite$/.test(s.style.animation)), 'left-to-right travel runs at the given speed');
const first=spans[0].style.backgroundImage;
console.assert(first && first.startsWith('linear-gradient(90deg,'), 'a gradient is painted at once, not on the second tick');
const shown=new Set(first.slice(0,-1).split(',').slice(1).map(s=>s.trim().split(' ')[0]));
console.assert(shown.size===3, 'three neighbouring colours across the letters, not the whole palette: got '+shown.size);
/* the whole point: the three must be far enough apart to read as different colours */
const rgb=c=>[1,3,5].map(i=>parseInt(c.substr(i,2),16));
const far=(a,b)=>Math.max(...rgb(a).map((v,i)=>Math.abs(v-rgb(b)[i])));
const list=[...shown];
console.assert(Math.min(far(list[0],list[1]),far(list[1],list[2]),far(list[0],list[2]))>60,
  'stops are visibly different colours, not three shades of one: '+list.join(' '));
console.assert([...shown].every(c=>/^#[0-9a-f]{6}$/.test(c)), 'stops are real colours');
console.assert(spans[0].style.backgroundImage===spans[1].style.backgroundImage, 'both copies share one gradient');
console.log('LiquidText flowing window: all checks passed');
console.log('gradient now:', first);
stop();
