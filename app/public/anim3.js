/* ANIM3: faithful vanilla ports of the three canonical components.
   1. Starfield1  - starfield-1.tsx  (per-star drift, mouse offset >>4, hyperspace on hold)
   2. LiquidText  - liquid-text.tsx  (two spans, blur/opacity curves, SVG threshold filter)
   3. TubesCursor - tubes-cursor.tsx (threejs-components tubes1, 100ms init delay, click randomize)
*/

function Starfield1(host, o) {
  o = o || {};
  var starColor  = o.starColor  || 'rgba(255,255,255,1)';
  var bgColor    = o.bgColor    || 'rgba(0,0,0,1)';
  var mouseAdjust= !!o.mouseAdjust;
  var easing     = o.easing     != null ? o.easing     : 1;
  var clickToWarp= !!o.clickToWarp;
  var warpFactor = o.warpFactor != null ? o.warpFactor : 10;
  var opacity    = o.opacity    != null ? o.opacity    : 0.1;
  var speed      = o.speed      != null ? o.speed      : 1;
  var quantity   = o.quantity   != null ? o.quantity   : 512;
  /* a phone does not need 60 fps of starfield: capping the rate is the cheapest big saving */
  var minFrameMs = o.minFrameMs != null ? o.minFrameMs : 0;

  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;z-index:' + (o.zIndex != null ? o.zIndex : 0);
  host.appendChild(cv);
  var ctx = cv.getContext('2d');

  var w=0,h=0,cx=0,cy=0,z=0,colorRatio=0,arr=[];
  /* How far the field spreads from the centre. It used to be derived from quantity, which
     silently coupled the two: raising the star count pushed every star further out and threw
     the extras off-screen, so MORE stars looked like FEWER. Now it is its own knob and the
     old formula is only the default, so any other caller behaves exactly as before. */
  var ratio = o.spread != null ? o.spread : quantity / 2;
  var cursor = {x:0,y:0}, mouse = {x:0,y:0};
  var hyper = false;

  function measure(){
    w = host.clientWidth; h = host.clientHeight;
    cx = Math.round(w/2); cy = Math.round(h/2);
    z = (w+h)/2; colorRatio = 1/z;
    if (cursor.x===0||cursor.y===0){ cursor.x=cx; cursor.y=cy; }
  }
  function setup(){
    measure();
    cv.width = w; cv.height = h;
  }
  var onWinResize = function(){ needResize = true; };
  addEventListener('resize', onWinResize, {passive:true});
  addEventListener('orientationchange', onWinResize, {passive:true});
  function bigBang(){
    if (arr.length !== quantity){
      arr = new Array(quantity);
      for (var i=0;i<quantity;i++){
        arr[i] = [Math.random()*w*2 - cx*2, Math.random()*h*2 - cy*2,
                  Math.round(Math.random()*z), 0,0,0,0,true];
      }
    }
  }
  /* Polled from the animation loop, this called measure() - which reads host.clientWidth and
     host.clientHeight - on EVERY FRAME: a forced layout read sixty times a second, forever, to
     learn something that only changes when the window resizes. There was no resize listener at
     all; the loop polled layout instead. With the parallax and the melt writing styles in the
     same frame that is a read-write-read thrash, and it does not show up as a lower average -
     it shows up as IRREGULAR FRAME TIMES. Movement is scaled by elapsed time, so the field is
     always in the right PLACE, but the frames arrive unevenly and each jumps a different
     distance. That is the "quick for a split second then slower, again and again". */
  var needResize = false;
  function resizeIfNeeded(){
    if (!needResize) return;
    needResize = false;
    var pw=w, ph=h;
    measure();
    if (cv.width!==w || cv.height!==h){
      var rw = w/(pw||w), rh = h/(ph||h);
      cv.width=w; cv.height=h;
      for (var i=0;i<arr.length;i++){
        var s=arr[i];
        s[0]*=rw; s[1]*=rh;
        s[3]=cx+(s[0]/s[2])*ratio; s[4]=cy+(s[1]/s[2])*ratio;
      }
    }
  }
  function update(dtScale){
    /* mouseAdjust off = the field flies straight at the viewer, no drift */
    mouse.x = mouseAdjust ? (cursor.x - cx)/easing : 0;
    mouse.y = mouseAdjust ? (cursor.y - cy)/easing : 0;
    /* Motion used to be per-FRAME, so the field drifted twice as fast on a 120Hz screen as on a
       60Hz one, and any frame cap visibly slowed it down. Scaling by elapsed time pins the look
       to the clock instead of the refresh rate, which is what lets minFrameMs be raised without
       changing anything the eye can see. */
    var compSpeed = (hyper ? speed*warpFactor : speed) * dtScale;
    for (var i=0;i<arr.length;i++){
      var s=arr[i];
      s[7]=true; s[5]=s[3]; s[6]=s[4];
      s[0]+= mouse.x>>4;
      if (s[0] >  cx<<1){ s[0]-= w<<1; s[7]=false; }
      if (s[0] < -cx<<1){ s[0]+= w<<1; s[7]=false; }
      s[1]+= mouse.y>>4;
      if (s[1] >  cy<<1){ s[1]-= h<<1; s[7]=false; }
      if (s[1] < -cy<<1){ s[1]+= h<<1; s[7]=false; }
      s[2]-= compSpeed;
      if (s[2] > z){ s[2]-=z; s[7]=false; }
      if (s[2] < 0){ s[2]+=z; s[7]=false; }
      s[3]=cx+(s[0]/s[2])*ratio;
      s[4]=cy+(s[1]/s[2])*ratio;
    }
  }
  /* Batched drawing: the original opened a path and stroked once PER STAR, which is hundreds
     of draw calls a frame. Stars are bucketed by line width and each bucket is stroked once,
     so a full field costs three calls instead of several hundred. */
  var BUCKETS=3, bx=[], by=[], bpx=[], bpy=[], bn=[];
  for (var b=0;b<BUCKETS;b++){ bx[b]=[]; by[b]=[]; bpx[b]=[]; bpy[b]=[]; bn[b]=0; }
  function draw(){
    ctx.fillStyle = hyper ? 'rgba(0,0,0,'+opacity+')' : bgColor;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = starColor;
    for (var b=0;b<BUCKETS;b++) bn[b]=0;
    for (var i=0;i<arr.length;i++){
      var s=arr[i];
      if (!(s[5]>0 && s[5]<w && s[6]>0 && s[6]<h && s[7])) continue;
      var lw=(1-colorRatio*s[2])*2;
      var k=lw<0.9?0:(lw<1.6?1:2), n=bn[k]++;
      bpx[k][n]=s[5]; bpy[k][n]=s[6]; bx[k][n]=s[3]; by[k][n]=s[4];
    }
    for (var k2=0;k2<BUCKETS;k2++){
      if (!bn[k2]) continue;
      ctx.lineWidth = k2===0?0.6:(k2===1?1.2:2);
      ctx.beginPath();
      for (var j=0;j<bn[k2];j++){ ctx.moveTo(bpx[k2][j],bpy[k2][j]); ctx.lineTo(bx[k2][j],by[k2][j]); }
      ctx.stroke();
    }
  }
  var raf=0, running=true, lastFrame=0, prevT=0;
  function animate(now){
    if (!running) return;
    raf=requestAnimationFrame(animate);
    if (document.hidden) { prevT=0; return; }  /* nobody is looking: skip the work, keep the loop */
    if (minFrameMs){
      if (now && now-lastFrame < minFrameMs) return;
      lastFrame = now || 0;
    }
    /* elapsed since the last frame we actually DREW, expressed in 60fps frames. Clamped so a
       stall or a return from a background tab does not teleport the field. */
    var dtScale = prevT ? Math.min((now-prevT)/16.67, 4) : 1;
    prevT = now || 0;
    resizeIfNeeded(); update(dtScale); draw();
  }
  function onMove(e){
    var r=host.getBoundingClientRect();
    cursor.x=e.clientX-r.left; cursor.y=e.clientY-r.top;
  }
  function onDown(){ hyper=true; } function onUp(){ hyper=false; }
  if (mouseAdjust) host.addEventListener('mousemove', onMove, {passive:true});
  if (clickToWarp){ host.addEventListener('mousedown', onDown); addEventListener('mouseup', onUp); }
  setup(); bigBang(); animate();
  stop.setQuantity=function(n){
    if (n>=arr.length){ return; }
    arr.length=n; quantity=n; if (o.spread == null) ratio=quantity/2;
  };
  function stop(){
    running=false; cancelAnimationFrame(raf);
    removeEventListener('resize', onWinResize);
    removeEventListener('orientationchange', onWinResize);
    if (mouseAdjust) host.removeEventListener('mousemove', onMove);
    if (clickToWarp){ host.removeEventListener('mousedown', onDown); removeEventListener('mouseup', onUp); }
    cv.remove();
  }
  return stop;
}



/* one cycle laid down twice across a 200% background: sliding it by its own width lands on
   an identical frame, so a left-to-right travel loops without a seam */
function flowGrad(cs){
  var n=cs.length*2, out=[];
  for(var i=0;i<=n;i++) out.push(cs[i%cs.length]+' '+(i*100/n).toFixed(3)+'%');
  return 'linear-gradient(90deg,'+out.join(',')+')';
}
/* read a palette at a fractional position, mixing the two neighbours, so a window can slide
   along it continuously instead of jumping colour to colour */
function paletteAt(pal, p){
  var n=pal.length, f=((p%n)+n)%n, i=Math.floor(f), t=f-i;
  var a=pal[i], b=pal[(i+1)%n], out='#';
  for (var c=1;c<7;c+=2){
    var v=Math.round(parseInt(a.substr(c,2),16)*(1-t)+parseInt(b.substr(c,2),16)*t);
    out+=v.toString(16).padStart(2,'0');
  }
  return out;
}
/* scale a hex colour toward black. The palette is written bright for text on black; the tubes
   need the same hues at a fraction of that brightness. */
function dim(hex, k){
  var out='#';
  for (var c=1;c<7;c+=2)
    out+=Math.max(0,Math.min(255,Math.round(parseInt(hex.substr(c,2),16)*k))).toString(16).padStart(2,'0');
  return out;
}

/* hue -> hex. The tube library takes hex strings, so the wheel is converted here rather
   than handed over as hsl(), which its colour parser is not guaranteed to accept. */
function hslHex(h,s,l){
  h=((h%360)+360)%360; s=s==null?0.92:s; l=l==null?0.64:l;
  var a=s*Math.min(l,1-l);
  function f(n){
    var k=(n+h/30)%12, c=l-a*Math.max(-1,Math.min(k-3,9-k,1));
    return Math.round(255*c).toString(16).padStart(2,'0');
  }
  return '#'+f(0)+f(8)+f(4);
}

function LiquidText(host, texts, o) {
  o = o || {};
  var morphTime    = o.morphTime    != null ? o.morphTime    : 1.5;
  var cooldownTime = o.cooldownTime != null ? o.cooldownTime : 0.5;
  /* colour: a short window of the palette is spread across the letters and travels left to
     right, while the window itself slides along the palette. So the line is always
     multi-coloured and flowing, but it is three neighbouring colours at a time, never the
     whole wheel at once. */
  var colors       = o.colors && o.colors.length ? o.colors : null;
  var flowSeconds  = o.flow  != null ? o.flow  : 6;
  var driftSeconds = o.drift != null ? o.drift : flowSeconds * 2.5;
  /* the three stops sit a THIRD of the palette apart. Neighbouring entries were too close in
     hue and the line read as one solid colour; a third of the wheel apart is unmistakably
     three colours, while still being three and not the whole spectrum. */
  var spread       = o.spread!= null ? o.spread: (colors ? colors.length*0.09 : 1);
  /* letters: each character becomes its own inline-block, so a caller can push them around
     without touching the melt. Rebuilt only when the word actually changes, never per frame. */
  var letters      = !!o.letters;
  /* a caller can say when the text is worth animating at all, e.g. only while it is on screen */
  var activeWhen   = typeof o.activeWhen==='function' ? o.activeWhen : null;
  /* simple mode for phones: the melt is an SVG threshold filter plus a per-frame blur, and that
     pair is what makes a phone stutter. Here the words simply cross-fade: same message, no cost. */
  var simple       = !!o.simple;
  /* The threshold is an SVG filter referenced by url(#threshold). On a phone that reference is
     the fragile part - the melt's MOTION is the per-layer blur and opacity curves below, which
     are plain CSS and work everywhere. `threshold:false` keeps the motion and drops the filter,
     so the words still melt into each other, just without the hard gooey edge. */
  var threshold    = o.threshold !== false;
  /* The gradient that travels through the letters is painted as the span's BACKGROUND and cut to
     the glyphs with background-clip:text, the text itself being transparent. The melt blurs that
     same span every frame - and iOS stops honouring the clip on a blurred layer, which paints
     the whole background rectangle instead of the letters. That is the grey box he photographed
     behind each line. `flat:true` walks the same palette as a plain text colour: no clip, no
     box, and the melt is untouched. */
  var flat         = !!o.flat;
  /* how far the melt may blur, in px. Default 100 keeps the desktop look exactly as approved;
     a caller on a small screen passes something near half its own font size. */
  var maxBlur      = o.maxBlur != null ? o.maxBlur : 100;
  /* How often the melt is allowed to REDRAW, in ms. 0 means every animation frame, which is
     what it always did - and on a phone that turned out to set the rhythm of the whole page.
     Measured in half-second buckets on an iPhone 16 Pro simulator: a steady ~37fps while the
     words are melting, jumping to 51-56 for one bucket every ~5s. 5s is morphTime 4.5 plus
     cooldownTime 0.45: during the cooldown nothing changes, so the browser reuses the cached
     filtered raster and the page speeds up ~40%. The starfield's motion tracks the frame rate,
     so that burst is exactly the "quick for a split second, then slower, again and again".

     Redrawing the melt less often flattens it. The morph is a 4.5s blur crossfade - it does not
     need 60 steps a second - and the progression below is measured against the clock, so the
     morph still takes exactly as long and lands in the same place. */
  var stepMs       = o.stepMs   != null ? o.stepMs   : 0;
  /* The melt's blur curve below was written as 8/fraction - 8, and that 8 is in ABSOLUTE px:
     it was tuned against the 77px desktop slogan. The same 8px laid on a phone's 34px type is
     2.3x heavier relative to the letters, which is why the phone melted into blue blobs while
     the Mac read as liquid - the cap was never the problem, the unit was. Derived from the
     host's own type size it is self-correcting at any scale, and 77 * 0.104 is 8.0, so the
     desktop curve is unchanged to the pixel. */
  var blurUnit     = o.blurUnit != null ? o.blurUnit
                     : parseFloat(getComputedStyle(host).fontSize || '77') * 0.104;
  if (!texts || texts.length < 2) throw new Error('LiquidText: need 2+ texts');

  if (!simple && threshold && !document.getElementById('lt-threshold-svg')){
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id='lt-threshold-svg';
    svg.setAttribute('style','position:absolute;width:0;height:0');
    /* color-interpolation-filters="sRGB" is not cosmetic, it is most of the cost of this filter.
       SVG filters default to linearRGB, so the browser converts every pixel of the filter region
       out of sRGB and back again, twice, on every frame. This matrix only touches ALPHA - its
       three colour rows are the identity - so the conversion changes nothing that can be seen
       and the sRGB result is mathematically the same picture.
       Measured on an iPhone 16 Pro simulator: the melt cost 22.9fps of 60 with the default. */
    svg.innerHTML='<defs><filter id="threshold" color-interpolation-filters="sRGB">'+
      '<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></defs>';
    document.body.appendChild(svg);
  }
  host.style.position = host.style.position || 'relative';
  if (!simple) host.style.filter = threshold ? 'url(#threshold) blur(0.6px)' : 'blur(0.5px)';
  if (colors && !document.getElementById('lt-flow-style')){
    var st=document.createElement('style'); st.id='lt-flow-style';
    st.textContent='@keyframes lt-flow{from{background-position:0% center}to{background-position:-200% center}}';
    document.head.appendChild(st);
  }
  function mkSpan(){
    var s=document.createElement('span');
    s.style.cssText='position:absolute;left:0;right:0;top:0;margin:auto;display:inline-block;width:100%;text-align:center';
    if (colors && !flat){
      /* the cycle is laid twice across a 200% background, so sliding it by its own width
         lands on an identical frame and the travel never jumps */
      s.style.backgroundSize='200% auto';
      s.style.webkitBackgroundClip='text';
      s.style.backgroundClip='text';
      s.style.color='transparent';
      s.style.animation='lt-flow '+flowSeconds+'s linear infinite';
    }
    host.appendChild(s); return s;
  }
  var t1=mkSpan(), t2=mkSpan();
  var textIndex=0, morph=0, cooldown=0, time=Date.now();
  /* Paint the first pair immediately. The words used to be written only inside the animation
     loop, so on a phone (or any browser that delays the first frame) the slogan was an empty
     box until a frame ran. */
  setWord(t1,texts[0]); setWord(t2,texts[1%texts.length]);
  t1.style.opacity='1'; t2.style.opacity='0';

  /* the window walks the palette at ~10 fps: smooth to the eye, and far cheaper than
     rebuilding the gradient string on every frame */
  var pos=0, gradAt=time-100;   /* seeded, so the first paint is one tick of drift, not the epoch */
  function paintGrad(now){
    if (!colors || now-gradAt < 100) return;
    pos += (now-gradAt)/1000/driftSeconds*colors.length;
    gradAt=now;
    if (flat){
      var c=paletteAt(colors,pos);
      t1.style.color=c; t2.style.color=c;
      return;
    }
    var g=flowGrad([paletteAt(colors,pos), paletteAt(colors,pos+spread), paletteAt(colors,pos+spread*2)]);
    t1.style.backgroundImage=g; t2.style.backgroundImage=g;
  }
  paintGrad(time);

  function setWord(sp,str){
    if (sp.__word===str) return;
    sp.__word=str;
    if (!letters){ sp.textContent=str; return; }
    sp.textContent='';
    for (var i=0;i<str.length;i++){
      var ch=document.createElement('i');
      ch.style.cssText='font-style:normal;display:inline-block;will-change:transform;'+
                       'transition:transform 220ms cubic-bezier(.22,.61,.36,1)';
      ch.textContent = str.charAt(i)===' ' ? '\u00A0' : str.charAt(i);
      sp.appendChild(ch);
    }
    sp.__measured=false;
  }
  /* the visible characters, for whoever wants to shove them out of the way */
  host.letterSpans=function(){
    var out=[];
    [t1,t2].forEach(function(sp){
      if (parseFloat(sp.style.opacity||'1')<0.05) return;
      for (var i=0;i<sp.children.length;i++) out.push(sp.children[i]);
    });
    return out;
  };

  function setStyles(fraction){
    if (simple){
      /* Sequential, not a crossfade. A crossfade holds BOTH words at half opacity in the middle,
         and at 34px on a phone two different phrases at 50% read as a collision, not a
         transition - photographed on a real iPhone twice. Here the old phrase leaves completely
         before the new one starts, so there is never more than one thing to read. */
      if (fraction < 0.5){
        t1.style.opacity=(1-fraction*2).toFixed(3);
        t2.style.opacity='0';
      } else {
        t1.style.opacity='0';
        t2.style.opacity=((fraction-0.5)*2).toFixed(3);
      }
    } else {
      /* The blur cap used to be a flat 100px, written for a 77px desktop slogan. On a phone the
         same words are 34px, so at the start of a morph the library was putting 70-100px of blur
         on 34px letters and the line dissolved into blobs - photographed on a real iPhone. The
         cap is now proportional to the type size, so the melt looks the same at any scale. */
      t2.style.filter='blur('+Math.min(blurUnit/fraction-blurUnit,maxBlur)+'px)';
      t2.style.opacity=(Math.pow(fraction,0.4)*100)+'%';
      var inv=1-fraction;
      t1.style.filter='blur('+Math.min(blurUnit/inv-blurUnit,maxBlur)+'px)';
      t1.style.opacity=(Math.pow(inv,0.4)*100)+'%';
    }
    setWord(t1,texts[textIndex%texts.length]);
    setWord(t2,texts[(textIndex+1)%texts.length]);
  }
  function doMorph(){
    morph-=cooldown; cooldown=0;
    var fraction=morph/morphTime;
    if (fraction>1){ cooldown=cooldownTime; fraction=1; }
    setStyles(fraction);
    if (fraction===1) textIndex++;
  }
  function doCooldown(){
    morph=0;
    t2.style.filter='none'; t2.style.opacity='100%';
    t1.style.filter='none'; t1.style.opacity='0%';
  }
  var raf=0, running=true;
  var meltLast=0;
  function animate(){
    if(!running) return;
    raf=requestAnimationFrame(animate);
    if (document.hidden || (activeWhen && !activeWhen())){ time=Date.now(); return; }
    if (stepMs){
      var t=Date.now();
      if (t-meltLast < stepMs) return;   /* time still accumulates below, only the redraw waits */
      meltLast=t;
    }
    var now=Date.now(), dt=(now-time)/1000; time=now;
    cooldown-=dt; morph+=dt>0?dt:0;
    if (cooldown<=0) doMorph(); else doCooldown();
    paintGrad(now);
  }
  animate();
  return function stop(){
    running=false; cancelAnimationFrame(raf);
    /* the keyframes rule is shared by id and stays for the next instance */
    t1.remove(); t2.remove(); host.style.filter='';
  };
}

function TubesCursorInit(canvas, opts, onReady) {
  /* 100ms delay: lets the canvas get real dimensions first (their NaN-radius fix) */
  var timer=setTimeout(function(){
    /* Self-hosted copy of threejs-components@0.0.19 tubes1 (checksum-verified against the
       CDN build). Same origin means no third DNS lookup, no extra TLS handshake, and the
       scene cannot be broken by a CDN outage. Falls back to the CDN if our copy is missing. */
    import('/tubes1.min.js')
      .catch(function(){ return import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js') })
      .then(function(m){
        var app=m.default(canvas, opts || {tubes:{colors:["#5e72e4","#8965e0","#f5365c"],
          lights:{intensity:200,colors:["#21d4fd","#b721ff","#f4d03f","#11cdef"]}}});
        if (onReady) onReady(app);
      })
      .catch(function(err){ console.error('Failed to load TubesCursor module:', err); });
  },100);
  return function cancel(){ clearTimeout(timer); };
}
function tubesRandomColors(count){
  return new Array(count).fill(0).map(function(){
    return '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');});
}
