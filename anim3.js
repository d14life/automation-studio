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

  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;z-index:' + (o.zIndex != null ? o.zIndex : 0);
  host.appendChild(cv);
  var ctx = cv.getContext('2d');

  var w=0,h=0,cx=0,cy=0,z=0,colorRatio=0,arr=[];
  var ratio = quantity / 2;
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
  function bigBang(){
    if (arr.length !== quantity){
      arr = new Array(quantity);
      for (var i=0;i<quantity;i++){
        arr[i] = [Math.random()*w*2 - cx*2, Math.random()*h*2 - cy*2,
                  Math.round(Math.random()*z), 0,0,0,0,true];
      }
    }
  }
  function resizeIfNeeded(){
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
  function update(){
    mouse.x = (cursor.x - cx)/easing;
    mouse.y = (cursor.y - cy)/easing;
    var compSpeed = hyper ? speed*warpFactor : speed;
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
  function draw(){
    ctx.fillStyle = hyper ? 'rgba(0,0,0,'+opacity+')' : bgColor;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = starColor;
    for (var i=0;i<arr.length;i++){
      var s=arr[i];
      if (s[5]>0 && s[5]<w && s[6]>0 && s[6]<h && s[7]){
        ctx.lineWidth = (1-colorRatio*s[2])*2;
        ctx.beginPath(); ctx.moveTo(s[5],s[6]); ctx.lineTo(s[3],s[4]); ctx.stroke(); ctx.closePath();
      }
    }
  }
  var raf=0, running=true;
  function animate(){
    if (!running) return;
    resizeIfNeeded(); update(); draw();
    raf=requestAnimationFrame(animate);
  }
  function onMove(e){
    var r=host.getBoundingClientRect();
    cursor.x=e.clientX-r.left; cursor.y=e.clientY-r.top;
  }
  function onDown(){ hyper=true; } function onUp(){ hyper=false; }
  if (mouseAdjust) host.addEventListener('mousemove', onMove, {passive:true});
  if (clickToWarp){ host.addEventListener('mousedown', onDown); addEventListener('mouseup', onUp); }
  setup(); bigBang(); animate();
  return function stop(){
    running=false; cancelAnimationFrame(raf);
    if (mouseAdjust) host.removeEventListener('mousemove', onMove);
    if (clickToWarp){ host.removeEventListener('mousedown', onDown); removeEventListener('mouseup', onUp); }
    cv.remove();
  };
}

function LiquidText(host, texts, o) {
  o = o || {};
  var morphTime    = o.morphTime    != null ? o.morphTime    : 1.5;
  var cooldownTime = o.cooldownTime != null ? o.cooldownTime : 0.5;
  /* optional flowing colour: the whole text is one colour at a time, and that
     colour travels left to right (orange into red, etc). */
  var gradient     = o.gradient || null;
  var flowSeconds  = o.flow != null ? o.flow : 6;
  if (!texts || texts.length < 2) throw new Error('LiquidText: need 2+ texts');

  if (!document.getElementById('lt-threshold-svg')){
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id='lt-threshold-svg';
    svg.setAttribute('style','position:absolute;width:0;height:0');
    svg.innerHTML='<defs><filter id="threshold"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></defs>';
    document.body.appendChild(svg);
  }
  host.style.position = host.style.position || 'relative';
  host.style.filter = 'url(#threshold) blur(0.6px)';
  if (gradient && !document.getElementById('lt-flow-style')){
    var st=document.createElement('style'); st.id='lt-flow-style';
    st.textContent='@keyframes lt-flow{from{background-position:0% center}to{background-position:-200% center}}';
    document.head.appendChild(st);
  }
  function mkSpan(){
    var s=document.createElement('span');
    s.style.cssText='position:absolute;left:0;right:0;top:0;margin:auto;display:inline-block;width:100%;text-align:center';
    if (gradient){
      /* 200% ramp: the visible half spans the whole line, so the text itself is
         multi-coloured (red on the left into orange on the right) and the colours
         travel across it. Symmetric stops keep the loop seamless. */
      s.style.backgroundImage=gradient;
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

  function setStyles(fraction){
    t2.style.filter='blur('+Math.min(8/fraction-8,100)+'px)';
    t2.style.opacity=(Math.pow(fraction,0.4)*100)+'%';
    var inv=1-fraction;
    t1.style.filter='blur('+Math.min(8/inv-8,100)+'px)';
    t1.style.opacity=(Math.pow(inv,0.4)*100)+'%';
    t1.textContent=texts[textIndex%texts.length];
    t2.textContent=texts[(textIndex+1)%texts.length];
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
  function animate(){
    if(!running) return;
    raf=requestAnimationFrame(animate);
    var now=Date.now(), dt=(now-time)/1000; time=now;
    cooldown-=dt; morph+=dt>0?dt:0;
    if (cooldown<=0) doMorph(); else doCooldown();
  }
  animate();
  return function stop(){
    running=false; cancelAnimationFrame(raf);
    t1.remove(); t2.remove(); host.style.filter='';
  };
}

function TubesCursorInit(canvas, opts, onReady) {
  /* 100ms delay: lets the canvas get real dimensions first (their NaN-radius fix) */
  var timer=setTimeout(function(){
    import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
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
