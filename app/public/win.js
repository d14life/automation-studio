/* Mac-style window manager for a plain static page. One file, no build step, no dependencies:
   it injects its own stylesheet, keeps every window in a fixed layer that does not block the
   page underneath, and publishes window.WinMgr.

   Non-modal on purpose: there is no backdrop and the layer itself is pointer-events:none, so
   the page keeps scrolling and clicking while a window is open. */
(function(){
'use strict';
if(window.WinMgr) return;              /* the script may be included twice by mistake */

var MINW=260, MINH=160, EDGE=4, HIDE_DELAY=200;
var DOCK_ON='закрепить справа', DOCK_OFF='открепить';
var wins={}, zTop=1, openCount=0, layer=null, tray=null, focusedKey=null;

/* ---------- glyphs ----------
   The three lights show their symbol only while the cluster is hovered, exactly like macOS.
   The symbols are inline SVG data URIs so the file stays self-contained: no sprite, no font. */
function glyph(inner){
  return 'url("data:image/svg+xml,'+encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9">'+inner+'</svg>')+'")';
}
var STROKE='stroke="rgba(0,0,0,.62)" stroke-width="1.3" stroke-linecap="round" fill="none"';
var G_CLOSE=glyph('<path d="M2.5 2.5 6.5 6.5M6.5 2.5 2.5 6.5" '+STROKE+'/>');
var G_MIN  =glyph('<path d="M1.9 4.5H7.1" '+STROKE+'/>');
var G_MAX  =glyph('<path d="M1.7 1.7h4.1L1.7 5.8z" fill="rgba(0,0,0,.62)"/>'+
                  '<path d="M7.3 7.3H3.2L7.3 3.2z" fill="rgba(0,0,0,.62)"/>');

/* ---------- stylesheet ---------- */
var CSS=[
/* the layer never eats a click: only the windows inside it do */
'#winLayer{position:fixed;inset:0;pointer-events:none;z-index:900;--accent:var(--ice2,#7FD8FF)}',
'#winTray{position:fixed;left:14px;bottom:14px;z-index:901;display:flex;flex-direction:column-reverse;',
  'gap:8px;align-items:flex-start;pointer-events:none;--accent:var(--ice2,#7FD8FF)}',

'.win{position:fixed;display:flex;flex-direction:column;overflow:hidden;background:rgba(30,30,36,.9);',
  'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:14px;',
  'box-shadow:0 24px 70px rgba(0,0,0,.55);min-width:260px;min-height:160px;max-width:96vw;max-height:92vh;',
  'pointer-events:auto;color:#EDF2EC}',
'.win.active{box-shadow:0 24px 70px rgba(0,0,0,.55),0 0 0 1.5px var(--accent)}',
/* a snapped or docked window is meant to fill its half of the screen, so the safety caps go */
'.win.snapped,.win.docked{max-width:none;max-height:none}',
/* docked panel is flush against the right, top and bottom edges, no corner is left floating */
'.win.docked{border-radius:0}',

'.wintitle{position:relative;flex:none;display:flex;align-items:center;gap:10px;height:36px;',
  'padding:0 8px 0 12px;border-bottom:1px solid rgba(255,255,255,.08);',
  'touch-action:none;user-select:none;-webkit-user-select:none;cursor:default}',
'.wintitle b{flex:1;min-width:0;font-size:12.5px;font-weight:590;color:rgba(237,242,236,.62);',
  'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',

'.lights{display:flex;gap:8px;align-items:center}',
'.lights i{position:relative;width:12px;height:12px;border-radius:50%;display:block;cursor:pointer;',
  'box-shadow:inset 0 0 0 .5px rgba(0,0,0,.14),inset 0 .5px .5px rgba(255,255,255,.28);transition:filter .12s}',
'.lights .r{background:radial-gradient(circle at 50% 32%,#ff8a84,#ff5f57 62%)}',
'.lights .y{background:radial-gradient(circle at 50% 32%,#ffd267,#febc2e 62%)}',
'.lights .g{background:radial-gradient(circle at 50% 32%,#5fe07a,#28c840 62%)}',
'.lights i:active{filter:brightness(.9)}',
'.lights i::after{content:"";position:absolute;inset:0;opacity:0;transition:opacity .12s;',
  'background-repeat:no-repeat;background-position:50% 50%;background-size:9px 9px}',
'.lights:hover i::after{opacity:1}',
'.lights .r::after{background-image:'+G_CLOSE+'}',
'.lights .y::after{background-image:'+G_MIN+'}',
'.lights .g::after{background-image:'+G_MAX+'}',
'.lights i:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',

'.winbtn{flex:none;border:0;background:none;padding:5px 9px;border-radius:7px;font:inherit;',
  'font-size:11.5px;line-height:1;color:rgba(237,242,236,.55);cursor:pointer;',
  'transition:background .12s,color .12s}',
'.winbtn:hover{background:rgba(255,255,255,.09);color:rgba(237,242,236,.92)}',
'.winbtn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',

/* layout menu: opens on hover of the green light, sits right under it */
'.winlay{position:absolute;top:calc(100% + 4px);left:26px;display:none;gap:6px;padding:7px;',
  'background:rgba(38,38,45,.97);border:1px solid rgba(255,255,255,.1);border-radius:10px;',
  'box-shadow:0 12px 30px rgba(0,0,0,.5);z-index:5}',
'.winlay.show{display:flex}',
'.winlay button{border:0;background:none;padding:4px;border-radius:6px;cursor:pointer;line-height:0}',
'.winlay button:hover{background:rgba(255,255,255,.1)}',
'.winlay button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}',
'.winlay .sch{position:relative;display:block;width:18px;height:14px;border-radius:3px;',
  'border:1.5px solid rgba(237,242,236,.55)}',
'.winlay .sch::after{content:"";position:absolute;background:rgba(237,242,236,.4);transition:background .12s}',
'.winlay .sch.l::after{left:0;top:0;bottom:0;width:50%}',
'.winlay .sch.r::after{right:0;top:0;bottom:0;width:50%}',
'.winlay .sch.t::after{left:0;right:0;top:0;height:50%}',
'.winlay .sch.b::after{left:0;right:0;bottom:0;height:50%}',
'.winlay .sch.f::after{left:0;right:0;top:0;bottom:0}',
'.winlay button:hover .sch::after,.winlay button:focus-visible .sch::after{background:var(--accent)}',

'.wincontent{flex:1;min-height:0;display:flex;flex-direction:column;overflow:auto}',
'.wincontent>*{flex:1;min-height:0}',

/* resize handles: invisible strips that hang over the edges, corners on top of the sides */
'.win .rz{position:absolute;touch-action:none}',
'.win .rz.n{left:0;right:0;top:-4px;height:9px;cursor:ns-resize}',
'.win .rz.s{left:0;right:0;bottom:-4px;height:9px;cursor:ns-resize}',
'.win .rz.w{top:0;bottom:0;left:-4px;width:9px;cursor:ew-resize}',
'.win .rz.e{top:0;bottom:0;right:-4px;width:9px;cursor:ew-resize}',
'.win .rz.nw,.win .rz.ne,.win .rz.sw,.win .rz.se{width:16px;height:16px;z-index:3}',
'.win .rz.nw{top:-5px;left:-5px;cursor:nwse-resize}',
'.win .rz.ne{top:-5px;right:-5px;cursor:nesw-resize}',
'.win .rz.sw{bottom:-5px;left:-5px;cursor:nesw-resize}',
'.win .rz.se{bottom:-5px;right:-5px;cursor:nwse-resize}',
/* a docked panel may only be widened, so every handle but the left one goes away */
'.win.docked .rz{display:none}',
'.win.docked .rz.w{display:block}',

/* tray chips */
'.chip{position:relative;pointer-events:auto;display:flex;align-items:center;',
  'background:rgba(30,30,36,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);',
  'border:1px solid rgba(255,255,255,.1);border-radius:99px;padding:0 6px 0 4px;',
  'box-shadow:0 10px 28px rgba(0,0,0,.45)}',
'.chip button{border:0;background:none;font:inherit;color:rgba(237,242,236,.85);cursor:pointer}',
'.chip .chiplabel{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
  'padding:8px 8px 8px 10px;font-size:12.5px;font-weight:590;border-radius:99px}',
'.chip:hover{border-color:var(--accent)}',
/* the cross grows out of the pill instead of appearing on top of the title */
'.chip .chipx{width:0;padding:0;overflow:hidden;opacity:0;font-size:15px;line-height:1;',
  'color:rgba(237,242,236,.6);transition:width .16s ease,opacity .16s ease}',
'.chip:hover .chipx,.chip:focus-within .chipx{width:16px;opacity:1}',
'.chip .chipx:hover{color:#fff}',
'.chip button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
'.chip.badge::after{content:"";position:absolute;top:-3px;right:-3px;width:8px;height:8px;',
  'border-radius:50%;background:#ff5f57}',

/* while a drag is running nothing on the page should select or show a text caret */
'html.win-dragging,html.win-dragging *{user-select:none!important;-webkit-user-select:none!important}',
/* kept on the host for good: it is only a transition declaration, and removing it would make
   the un-docking jump instead of slide */
'.win-hostpad{transition:padding-right .28s ease}'
].join('');

var style=document.createElement('style');
style.textContent=CSS;
(document.head||document.documentElement).appendChild(style);

/* ---------- helpers ---------- */
function on(target,type,fn,opt,bag){
  target.addEventListener(type,fn,opt);
  if(bag) bag.push(function(){target.removeEventListener(type,fn,opt);});
}
function el(tag,cls){var n=document.createElement(tag); if(cls) n.className=cls; return n;}
function place(node,r){
  node.style.left=Math.round(r.x)+'px'; node.style.top=Math.round(r.y)+'px';
  node.style.width=Math.round(r.w)+'px'; node.style.height=Math.round(r.h)+'px';
}
/* everything that comes back from storage or from a resized viewport goes through this */
function clamp(r){
  var vw=window.innerWidth, vh=window.innerHeight;
  r.w=Math.max(MINW,Math.min(r.w,vw-16));
  r.h=Math.max(MINH,Math.min(r.h,vh-16));
  r.x=Math.max(EDGE,Math.min(r.x,vw-r.w-EDGE));
  r.y=Math.max(EDGE,Math.min(r.y,vh-r.h-EDGE));
  return r;
}
function loadRect(key){
  try{
    var raw=window.localStorage.getItem('winmgr:'+key);
    if(!raw) return null;
    var r=JSON.parse(raw);
    if(!r||typeof r.x!=='number'||typeof r.y!=='number'||typeof r.w!=='number'||typeof r.h!=='number') return null;
    return r;
  }catch(e){ return null; }        /* private mode, quota, corrupt value: fall back to centring */
}
function saveRect(st){
  try{ window.localStorage.setItem('winmgr:'+st.key,JSON.stringify(st.rect)); }catch(e){}
}
function measure(st){
  var b=st.node.getBoundingClientRect();
  st.rect={x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)};
}
function ensureLayer(){
  if(layer) return;
  var root=document.body||document.documentElement;
  layer=el('div'); layer.id='winLayer'; root.appendChild(layer);
  tray=el('div'); tray.id='winTray'; root.appendChild(tray);
}

/* ---------- pointer grabs ----------
   The move and up listeners live on the document only while the button is down, and the
   canceller is parked on the window's cleanup list so closing mid-drag cannot leak them. */
function grab(st,move,up){
  function onMove(e){ move(e); }
  function onUp(e){ release(); if(up) up(e); }
  function release(){
    document.removeEventListener('pointermove',onMove,true);
    document.removeEventListener('pointerup',onUp,true);
    document.removeEventListener('pointercancel',onUp,true);
    document.documentElement.classList.remove('win-dragging');
    var i=st.off.indexOf(release); if(i>=0) st.off.splice(i,1);
  }
  document.addEventListener('pointermove',onMove,true);
  document.addEventListener('pointerup',onUp,true);
  document.addEventListener('pointercancel',onUp,true);
  document.documentElement.classList.add('win-dragging');
  st.off.push(release);
}

/* ---------- geometry states ---------- */
function unsnap(st){
  if(!st.snap) return;
  st.snap=null; st.node.classList.remove('snapped');
  place(st.node,clamp(st.rect));
}
function applyLayout(st,which){
  if(st.docked) undock(st);
  if(!st.snap) measure(st);            /* remember the floating box before the first snap */
  var vw=window.innerWidth, vh=window.innerHeight, half=Math.round(vw/2), halfv=Math.round(vh/2), r;
  if(which==='left')        r={x:0,y:0,w:half,h:vh};
  else if(which==='right')  r={x:half,y:0,w:vw-half,h:vh};
  else if(which==='top')    r={x:0,y:0,w:vw,h:halfv};
  else if(which==='bottom') r={x:0,y:halfv,w:vw,h:vh-halfv};
  else                      r={x:0,y:0,w:vw,h:vh};
  st.snap=which; st.node.classList.add('snapped');
  place(st.node,r);
  focus(st.key);
}
function hostPad(st,px){
  if(!st.host) return;
  st.host.classList.add('win-hostpad');
  st.host.style.paddingRight=px===null?(st.hostPad||''):px+'px';
}
function fitDock(st){
  var w=Math.max(MINW,Math.min(st.dockW,window.innerWidth-40));
  st.dockW=w;
  place(st.node,{x:window.innerWidth-w,y:0,w:w,h:window.innerHeight});
  hostPad(st,w);
}
function dock(st){
  if(st.docked) return;
  if(!st.snap) measure(st);
  unsnap(st);
  if(st.hostPad===undefined) st.hostPad=st.host?st.host.style.paddingRight:'';
  st.docked=true; st.node.classList.add('docked');
  st.dockW=st.dockW||st.rect.w;
  fitDock(st);
  st.btn.textContent=DOCK_OFF;
  focus(st.key);
}
function undock(st){
  if(!st.docked) return;
  st.docked=false; st.node.classList.remove('docked');
  hostPad(st,null);                    /* the page gets its width back, transition included */
  place(st.node,clamp(st.rect));
  st.btn.textContent=DOCK_ON;
}

/* ---------- tray chips ---------- */
function makeChip(st){
  var chip=el('div','chip');
  var label=el('button','chiplabel'); label.type='button'; label.textContent=st.title;
  label.title=st.title;
  var x=el('button','chipx'); x.type='button'; x.textContent='×';
  x.setAttribute('aria-label','закрыть '+st.title);
  chip.appendChild(label); chip.appendChild(x);
  label.addEventListener('click',function(){ unmin(st); focus(st.key); });
  x.addEventListener('click',function(e){ e.stopPropagation(); close(st.key); });
  if(st.badge) chip.classList.add('badge');
  tray.appendChild(chip);
  st.chip=chip;
}
function dropChip(st){
  if(st.chip&&st.chip.parentNode) st.chip.parentNode.removeChild(st.chip);
  st.chip=null;
}
function unmin(st){
  if(!st.min) return;
  st.min=false; st.badge=false;
  st.node.style.display='';
  dropChip(st);
}

/* ---------- public operations ---------- */
function focus(key){
  var st=wins[key]; if(!st) return;
  zTop++; st.node.style.zIndex=zTop;
  for(var k in wins) if(wins.hasOwnProperty(k)) wins[k].node.classList.toggle('active',k===key);
  focusedKey=key;
}
function minimize(key){
  var st=wins[key]; if(!st||st.min) return;
  st.min=true; st.node.style.display='none';
  makeChip(st);
  if(focusedKey===key) focusedKey=null;
}
function maximize(key){
  var st=wins[key]; if(!st) return;
  if(st.min) unmin(st);
  if(st.snap==='max') unsnap(st); else applyLayout(st,'max');
}
function setBadge(key,flag){
  var st=wins[key]; if(!st) return;
  st.badge=!!flag;
  if(st.chip) st.chip.classList.toggle('badge',st.badge);
}
function isOpen(key){ return !!wins[key]; }

function close(key){
  var st=wins[key]; if(!st) return;
  undock(st);                                   /* never leave padding on the host */
  var i, offs=st.off.slice();                   /* copy: cancellers remove themselves */
  for(i=0;i<offs.length;i++) offs[i]();
  st.off.length=0;
  dropChip(st);
  /* the borrowed element goes back exactly where it was, so the host page can reuse it */
  if(st.body&&st.origParent){
    var ref=(st.origNext&&st.origNext.parentNode===st.origParent)?st.origNext:null;
    st.origParent.insertBefore(st.body,ref);
  }
  if(st.node.parentNode) st.node.parentNode.removeChild(st.node);
  delete wins[key];
  if(focusedKey===key) focusedKey=null;
  if(typeof st.onClose==='function') st.onClose(key);
}

var LAYOUTS=[['left','l','левая половина'],['right','r','правая половина'],
             ['top','t','верхняя половина'],['bottom','b','нижняя половина'],
             ['max','f','во весь экран']];

function open(o){
  o=o||{};
  var key=o.key||'win';
  var st=wins[key];
  if(st){                                   /* one window per key, always */
    if(st.min) unmin(st);
    focus(key);
    return st.node;
  }
  ensureLayer();

  var node=el('div','win');
  node.setAttribute('role','dialog');
  node.setAttribute('aria-label',o.title||key);
  node.style.zIndex=zTop;

  var bar=el('div','wintitle');
  var lights=el('span','lights');
  lights.innerHTML=
    '<i class="r" role="button" tabindex="0" data-act="close" title="закрыть" aria-label="закрыть окно"></i>'+
    '<i class="y" role="button" tabindex="0" data-act="min" title="свернуть" aria-label="свернуть окно"></i>'+
    '<i class="g" role="button" tabindex="0" data-act="max" title="развернуть" aria-label="развернуть окно"></i>';
  var titleEl=el('b'); titleEl.textContent=o.title||key;   /* text, never markup from the caller */
  var btn=el('button','winbtn'); btn.type='button'; btn.textContent=DOCK_ON;

  var menu=el('div','winlay');
  var mi, lb, sp;
  for(mi=0;mi<LAYOUTS.length;mi++){
    lb=el('button'); lb.type='button';
    lb.setAttribute('data-lay',LAYOUTS[mi][0]);
    lb.title=LAYOUTS[mi][2]; lb.setAttribute('aria-label',LAYOUTS[mi][2]);
    sp=el('span','sch '+LAYOUTS[mi][1]);
    lb.appendChild(sp); menu.appendChild(lb);
  }

  bar.appendChild(lights); bar.appendChild(titleEl); bar.appendChild(btn); bar.appendChild(menu);
  var content=el('div','wincontent');
  node.appendChild(bar); node.appendChild(content);

  var dirs=['n','s','w','e','nw','ne','sw','se'], di, h;
  for(di=0;di<dirs.length;di++){
    h=el('i','rz '+dirs[di]); h.setAttribute('data-dir',dirs[di]); node.appendChild(h);
  }

  st={key:key,node:node,btn:btn,menu:menu,title:o.title||key,body:o.body||null,
      host:o.host||document.body,hostPad:undefined,
      origParent:null,origNext:null,off:[],chip:null,
      min:false,docked:false,snap:null,badge:false,dockW:0,
      onClose:o.onClose};
  wins[key]=st;

  if(st.body){
    st.origParent=st.body.parentNode;
    st.origNext=st.body.nextSibling;
    content.appendChild(st.body);
  }

  /* geometry: stored box if there is one, otherwise centred with a cascade step */
  var stored=loadRect(key);
  if(stored){ st.rect=clamp(stored); }
  else{
    var w=Math.min(o.w||420,window.innerWidth-16), hgt=Math.min(o.h||520,window.innerHeight-16);
    var step=(openCount%8)*24;
    st.rect=clamp({x:(window.innerWidth-w)/2+step,y:(window.innerHeight-hgt)/2+step,w:w,h:hgt});
  }
  place(node,st.rect);
  layer.appendChild(node);
  openCount++;

  /* --- focus --- */
  on(node,'pointerdown',function(){ focus(key); },true,st.off);

  /* --- traffic lights: click and keyboard, since an <i role=button> gets neither for free --- */
  on(lights,'click',function(e){
    var act=e.target&&e.target.getAttribute&&e.target.getAttribute('data-act');
    if(!act) return;
    if(act==='close') close(key);
    else if(act==='min') minimize(key);
    else maximize(key);
  },false,st.off);
  on(lights,'keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' '&&e.key!=='Spacebar') return;
    if(!e.target.getAttribute||!e.target.getAttribute('data-act')) return;
    e.preventDefault(); e.target.click();
  },false,st.off);

  /* --- layout menu on hover of the green light --- */
  var hideTimer=0;
  function showMenu(){ if(hideTimer){clearTimeout(hideTimer);hideTimer=0;} menu.classList.add('show'); }
  function hideSoon(){
    if(hideTimer) clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){ hideTimer=0; menu.classList.remove('show'); },HIDE_DELAY);
  }
  var green=lights.querySelector('.g');
  on(green,'mouseenter',showMenu,false,st.off);
  on(green,'mouseleave',hideSoon,false,st.off);
  on(menu,'mouseenter',showMenu,false,st.off);   /* entering the panel cancels the hide */
  on(menu,'mouseleave',hideSoon,false,st.off);
  on(menu,'click',function(e){
    var b=e.target, lay;
    while(b&&b!==menu&&!(lay=b.getAttribute&&b.getAttribute('data-lay'))) b=b.parentNode;
    if(!lay) return;
    menu.classList.remove('show');
    applyLayout(st,lay);
  },false,st.off);
  st.off.push(function(){ if(hideTimer) clearTimeout(hideTimer); });

  /* --- dock button --- */
  on(btn,'click',function(){ if(st.docked) undock(st); else dock(st); },false,st.off);

  /* --- drag by the title bar --- */
  on(bar,'pointerdown',function(e){
    if(e.button!==0&&e.pointerType==='mouse') return;
    var t=e.target;
    while(t&&t!==bar){                      /* the lights, the dock button and the menu are not a handle */
      if(t.className&&String(t.className).indexOf('lights')>=0) return;
      if(t.tagName==='BUTTON'||t===menu) return;
      t=t.parentNode;
    }
    focus(key);
    var sx=e.clientX, sy=e.clientY;
    if(st.docked||st.snap){                 /* dragging a docked or tiled window floats it again */
      var wasW=st.rect.w;
      if(st.docked) undock(st); else unsnap(st);
      st.rect.x=Math.round(sx-wasW/2); st.rect.y=Math.round(sy-18);
      clamp(st.rect); place(node,st.rect);
    }
    var base={x:st.rect.x,y:st.rect.y,w:st.rect.w,h:st.rect.h};
    grab(st,function(ev){
      st.rect.x=base.x+(ev.clientX-sx);
      st.rect.y=base.y+(ev.clientY-sy);
      clamp(st.rect);
      place(node,st.rect);
    },function(){ measure(st); saveRect(st); });
    e.preventDefault();
  },false,st.off);

  /* --- resize from the eight edges --- */
  on(node,'pointerdown',function(e){
    var dir=e.target&&e.target.getAttribute&&e.target.getAttribute('data-dir');
    if(!dir) return;
    if(e.button!==0&&e.pointerType==='mouse') return;
    focus(key);
    e.preventDefault();
    var sx=e.clientX, sy=e.clientY;
    if(st.docked){                          /* docked: only the width may move, and the page follows */
      grab(st,function(ev){
        st.dockW=Math.max(MINW,Math.min(window.innerWidth-40,window.innerWidth-ev.clientX));
        fitDock(st);
      },function(){ st.rect.w=st.dockW; saveRect(st); });
      return;
    }
    if(st.snap) unsnap(st);
    measure(st);
    var base={x:st.rect.x,y:st.rect.y,w:st.rect.w,h:st.rect.h};
    grab(st,function(ev){
      var dx=ev.clientX-sx, dy=ev.clientY-sy, r={x:base.x,y:base.y,w:base.w,h:base.h};
      if(dir.indexOf('e')>=0) r.w=base.w+dx;
      if(dir.indexOf('s')>=0) r.h=base.h+dy;
      if(dir.indexOf('w')>=0){ r.w=base.w-dx; r.x=base.x+dx; }
      if(dir.indexOf('n')>=0){ r.h=base.h-dy; r.y=base.y+dy; }
      /* pulling a left or top edge past the minimum must pin the far edge, not walk it */
      if(r.w<MINW){ if(dir.indexOf('w')>=0) r.x=base.x+base.w-MINW; r.w=MINW; }
      if(r.h<MINH){ if(dir.indexOf('n')>=0) r.y=base.y+base.h-MINH; r.h=MINH; }
      st.rect=clamp(r);
      place(node,st.rect);
    },function(){ measure(st); saveRect(st); });
  },true,st.off);

  focus(key);
  if(o.dock) dock(st);
  return node;
}

/* ---------- one listener each for the whole manager, never per window ---------- */
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape'&&e.key!=='Esc') return;
  var st=focusedKey&&wins[focusedKey];
  if(st&&!st.min) close(st.key);
});
window.addEventListener('resize',function(){
  for(var k in wins){
    if(!wins.hasOwnProperty(k)) continue;
    var st=wins[k];
    if(st.docked) fitDock(st);
    else if(st.snap) applyLayout(st,st.snap);
    else place(st.node,clamp(st.rect));
  }
},{passive:true});

window.WinMgr={
  open:open,
  close:close,
  minimize:minimize,
  maximize:maximize,
  focus:focus,
  setBadge:setBadge,
  isOpen:isOpen
};
})();
