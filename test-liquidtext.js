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
const stop=LiquidText(host,['ОДИН','ДВА','ТРИ'],{morphTime:4.5,cooldownTime:0.45,colors:PAL,flow:7,drift:21,spread:PAL.length*0.08});
const spans=host.children.filter(c=>c.tagName==='span');
console.assert(spans.length===2, 'two text copies');
console.assert(spans.every(s=>s.style.color==='transparent'&&s.style.backgroundClip==='text'), 'colour comes from the gradient, not a solid fill');
console.assert(spans.every(s=>s.style.backgroundSize==='200% auto'), '200% ramp so the travel can loop');
console.assert(spans.every(s=>/^lt-flow 7s linear infinite$/.test(s.style.animation)), 'left-to-right travel runs at the given speed');
const first=spans[0].style.backgroundImage;
console.assert(first && first.startsWith('linear-gradient(90deg,'), 'a gradient is painted at once, not on the second tick');
const shown=new Set(first.slice(0,-1).split(',').slice(1).map(s=>s.trim().split(' ')[0]));
console.assert(shown.size===3, 'three neighbouring colours across the letters, not the whole palette: got '+shown.size);
/* spread controls how far apart the three stops sit. Too close and the line reads as one
   solid colour, too far and it turns into a rainbow, so both ends are pinned here. */
const rgb=c=>[1,3,5].map(i=>parseInt(c.substr(i,2),16));
const far=(a,b)=>Math.max(...rgb(a).map((v,i)=>Math.abs(v-rgb(b)[i])));
const stopsOf=s=>{const g=s.style.backgroundImage;
  return [...new Set(g.slice(0,-1).split(',').slice(1).map(x=>x.trim().split(' ')[0]))];};
const list=stopsOf(spans[0]);
console.assert(Math.min(far(list[0],list[1]),far(list[1],list[2]))>12,
  'stops differ at all, the line is not one flat colour: '+list.join(' '));
const wideHost=el('div');
const wideStop=LiquidText(wideHost,['А','Б'],{colors:PAL,flow:7,drift:21,spread:PAL.length*0.15});
const wide=stopsOf(wideHost.children.filter(c=>c.tagName==='span')[0]);
console.assert(far(wide[0],wide[1])>far(list[0],list[1]),
  'a wider spread really does separate the colours further: '+wide.join(' '));
wideStop();
console.assert(spans[0].style.backgroundImage===spans[1].style.backgroundImage, 'both copies share one gradient');
console.log('LiquidText flowing window: all checks passed');
console.log('gradient now:', first);
stop();

/* tube palette: three colours inside a narrow arc, and a drift that visibly moves them */
const rgb2=c=>[1,3,5].map(i=>parseInt(c.substr(i,2),16));
const dist=(a,b)=>Math.max(...rgb2(a).map((v,i)=>Math.abs(v-rgb2(b)[i])));
const trio=h=>[hslHex(h,.8,.34),hslHex(h+35,.8,.34),hslHex(h+70,.8,.34)];
const now=trio(0), later=trio(360*7/21);   /* 7 seconds of a 21 second wheel */
console.assert(dist(now[0],now[2])>25, 'the three tubes are not identical');
console.assert(dist(now[0],now[2])<170, 'the three tubes stay inside one arc, not spread round the wheel');
console.assert(dist(now[0],later[0])>40, 'seven seconds of drift changes the colour visibly: '+now[0]+' -> '+later[0]);
console.log('tube palette: all checks passed |', now.join(' '), '->', later.join(' '));
