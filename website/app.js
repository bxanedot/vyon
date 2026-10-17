/* vyon site. Original particle art, genuine screenshot slots, official stable-release status. */
(() => {
"use strict";
const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
const root=document.documentElement;
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Toggle Liquid Glass without reloading; the head preloads the stored preference.
const glassToggle=$("#glass-toggle");
function applyGlass(enabled,save=false){
 root.dataset.glass=enabled?"on":"off";
 glassToggle?.setAttribute("aria-pressed",String(enabled));
 glassToggle?.setAttribute("aria-label",enabled?"Turn Liquid Glass off":"Turn Liquid Glass on");
 glassToggle?.setAttribute("title",enabled?"Disable Liquid Glass":"Enable Liquid Glass");
 if(save)try{localStorage.setItem("vyon-liquid-glass",enabled?"on":"off")}catch{}
}
applyGlass(root.dataset.glass!=="off");
glassToggle?.addEventListener("click",()=>applyGlass(root.dataset.glass==="off",true));
// Navigation
const overlay=$("#command-overlay"),input=$("#command-input"),items=$$("[data-command-item]"),mob=$("#mobile-menu"),mobBtn=$("#mobile-menu-btn");
let focusBefore=null,selected=0;
const visible=()=>items.filter(x=>!x.hidden);
function highlight(n){const a=visible();if(!a.length)return;selected=(n+a.length)%a.length;a.forEach((x,i)=>x.classList.toggle("is-selected",i===selected));}
function closePalette(){overlay.hidden=true;document.body.style.overflow="";if(focusBefore?.focus)focusBefore.focus();}
function openPalette(){
 focusBefore=document.activeElement;
 overlay.hidden=false;input.value="";items.forEach(x=>x.hidden=false);highlight(0);
 document.body.style.overflow="hidden";
 const dialog=overlay.querySelector(".command-dialog");
 if(!reduce&&dialog?.animate)dialog.animate([
  {opacity:0,transform:"translate3d(0,9px,0) scale(.985)"},
  {opacity:1,transform:"translate3d(0,0,0) scale(1)"}
 ],{duration:320,easing:"cubic-bezier(.16,1,.3,1)"});
 input.focus();
}
$("#command-trigger").addEventListener("click",openPalette);
$("[data-close-command]").addEventListener("click",closePalette);
items.forEach(x=>x.addEventListener("click",closePalette));
input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();items.forEach(x=>x.hidden=!x.textContent.toLowerCase().includes(q));highlight(0);});
document.addEventListener("keydown",e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();overlay.hidden?openPalette():closePalette();return;}
 if(overlay.hidden)return;
 if(e.key==="Escape")closePalette();
 if(e.key==="ArrowDown"){e.preventDefault();highlight(selected+1);}
 if(e.key==="ArrowUp"){e.preventDefault();highlight(selected-1);}
 if(e.key==="Enter"){const x=visible()[selected];if(x)x.click();}
 if(e.key==="Tab"){e.preventDefault();input.focus();}
});
mobBtn.addEventListener("click",()=>{
 const opened=mobBtn.getAttribute("aria-expanded")!=="true";
 mobBtn.setAttribute("aria-expanded",String(opened));mob.hidden=!opened;
 if(opened&&!reduce&&typeof mob.animate==="function"){
  mob.animate([{opacity:0,transform:"translate3d(0,-8px,0)"},{opacity:1,transform:"translate3d(0,0,0)"}],
   {duration:300,easing:"cubic-bezier(.16,1,.3,1)"});
 }
});
$$("a",mob).forEach(x=>x.addEventListener("click",()=>{mob.hidden=true;mobBtn.setAttribute("aria-expanded","false");}));

// All anchors now use native CSS smooth scrolling, honoring reduced motion.
// Content stays visible by default; animation is an optional enhancement.
// JavaScript errors must never hide the main page.
if("IntersectionObserver" in window&&!reduce){
 const obs=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(!e.isIntersecting)return;
  const el=e.target;
  el.classList.add("is-visible");
  obs.unobserve(el);
  if(typeof el.animate==="function"){
   el.animate([{opacity:0,transform:"translate3d(0,18px,0)"},{opacity:1,transform:"translate3d(0,0,0)"}],
     {duration:850,easing:"cubic-bezier(.16,1,.3,1)"});
  }
 }),{threshold:.08,rootMargin:"0px 0px -35px 0px"});
 $$(".reveal").forEach(x=>obs.observe(x));
}else $$(".reveal").forEach(x=>x.classList.add("is-visible"));
// FAQ answers slide into view without animating layout or hiding content.
$$(".faq-item").forEach(detail=>detail.addEventListener("toggle",()=>{
 if(reduce||!detail.open)return;
 const answer=detail.querySelector(".faq-answer");
 if(answer?.animate)answer.animate([
  {opacity:0,transform:"translate3d(0,-7px,0)"},
  {opacity:1,transform:"translate3d(0,0,0)"}
 ],{duration:350,easing:"cubic-bezier(.16,1,.3,1)"});
}));
// Scroll progress and active navigation
const progressBar=$("#reading-progress"),siteHeader=$("#site-header"),navLinks=$$(".nav-desktop a");
let scrollScheduled=false;
function updateScroll(){
 const total=document.documentElement.scrollHeight-innerHeight;
 progressBar.style.transform="scaleX("+(total>0?Math.min(1,Math.max(0,scrollY/total)):0)+")";
 siteHeader.classList.toggle("is-scrolled",scrollY>32);
 scrollScheduled=false;
}
window.addEventListener("scroll",()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(updateScroll);}},{passive:true});
updateScroll();
if("IntersectionObserver" in window){
 const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(!e.isIntersecting)return;
  navLinks.forEach(a=>a.getAttribute("href")==="#"+e.target.id?a.setAttribute("aria-current","location"):a.removeAttribute("aria-current"));
 }),{rootMargin:"-36% 0px -58% 0px",threshold:0});
 ["experience","equalizer","details","community","support","faq"].forEach(id=>{const section=document.getElementById(id);if(section)sectionObserver.observe(section);});
}
// Accent palette
function theme(color){
 if(!["violet","acid","coral","ice","blood"].includes(color))return;
 root.dataset.accent=color;
 // The particle colors are derived from the active theme at render time.
 $$("[data-color]").forEach(b=>{const on=b.dataset.color===color;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=({violet:"#080808",acid:"#080808",coral:"#080808",ice:"#080808",blood:"#080808"})[color];
 try{localStorage.setItem("vyon-accent",color);}catch{}
 requestAnimationFrame(renderOrb);
}
$$("[data-color]").forEach(b=>b.addEventListener("click",()=>theme(b.dataset.color)));
try{theme(localStorage.getItem("vyon-accent")||"blood");}catch{theme("blood");}
// Drag-only Vyon particle silhouette: taps never scatter dots.
const region=$("#orb-region"),canvas=$("#orb-canvas"),ctx=canvas.getContext("2d",{alpha:true});
const particles=[],falling=[],clearedSpots=[];
let heartAnimating=false;
const heartPoints=[];
const tones={
 violet:["255,151,165","194,154,239","123,205,255"],
 acid:["47,190,128","22,162,143","46,221,190"],
 coral:["255,145,119","255,190,127","250,154,190"],
 ice:["75,205,242","91,155,250","133,239,249"],
 blood:["255,117,129","228,61,79","150,19,44"]
};
let w=0,h=0,orbScale=1,spriteDirty=true,active=false,lastTime=0,physicsCarry=0;
const compactMotion=window.matchMedia("(max-width:650px)").matches;
const physicsStep=1/(compactMotion?60:90);
const maxFalling=compactMotion?210:340;
let lastDebrisPrune=0;
const sprite=document.createElement("canvas");
sprite.width=720;sprite.height=720;
const spr=sprite.getContext("2d",{alpha:true});
const debris=document.createElement("canvas");
debris.className="vyon-falling-dots";
debris.setAttribute("aria-hidden","true");
document.body.appendChild(debris);
const debrisCtx=debris.getContext("2d",{alpha:true});
let vw=0,vh=0,ratio=1,obstacleCells=new Map(),floor=0,obstacleLastBuilt=0,obstacleLastHeight=0,obstacleDirty=true;
const gridSize=96,particleCell=8;
const textImpacts=new WeakMap();
const inkMeasure=document.createElement("canvas").getContext("2d");
// Each dot has a distinct collision radius, mass, elasticity and surface friction.
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};
const heartShape=(x,y)=>{const hX=x/23.5,hY=-y/24;return Math.pow(hX*hX+hY*hY-1,3)-hX*hX*Math.pow(hY,3)<0;};
for(let y=-28;y<=28;y+=4)for(let x=-28;x<=28;x+=4){
 if(heartShape(x,y))heartPoints.push({x:x+(hash(x,y)-.5)*1.4,y:y+(hash(y,x)-.5)*1.4,j:hash(x+48,y+79)});
}
function locateSpot(spot){
 const scale=orbScale*358/360;
 return {x:w*.5+spot.relX*scale,y:h*.49+spot.relY*scale};
}
function paintHearts(){
 const palette=tones[root.dataset.accent]||tones.blood,now=performance.now();
 for(const spot of clearedSpots){
  if(spot.heartAt===null)continue;
  const anchor=locateSpot(spot),elapsed=now-spot.heartAt;
  const grow=reduce?1:1-Math.pow(1-Math.min(1,elapsed/490),3);
  ctx.save();ctx.translate(anchor.x,anchor.y);
  ctx.scale(.72+.28*grow,.72+.28*grow);
  for(let i=0;i<heartPoints.length;i++){
   if(spot.removed?.has(i))continue;
   const p=heartPoints[i];
   const alpha=(.34+.66*grow)*(.8+.2*p.j);
   ctx.fillStyle="rgba("+palette[Math.floor(p.j*3)]+","+alpha.toFixed(3)+")";
   ctx.beginPath();ctx.arc(p.x,p.y,1.6+p.j*.7,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
function animateHearts(){
 renderOrb();
 if(clearedSpots.some(s=>s.heartAt!==null&&performance.now()-s.heartAt<530)){
  requestAnimationFrame(animateHearts);
 }else heartAnimating=false;
}
function makeHeart(spot){
 spot.heartAt=performance.now();
 spot.removed=new Set();
 renderOrb();
 if(!reduce&&!heartAnimating){heartAnimating=true;requestAnimationFrame(animateHearts);}
}
// Both the logo and hearts release the very same independent circle bodies.
// The heart adds an irregular crumble impulse so it breaks apart rather than
// translating downward with all dots maintaining the heart silhouette.
function releaseDot(p,worldX,worldY,x,y,hitX,hitY,radius=1.1+p.j*.9,crumble=false){
 const dx=x-hitX,dy=y-hitY,dist=Math.hypot(dx,dy);
 const angle=Math.atan2(dy,dx);
 const kick=Math.max(0,1-dist/63);
 const jitter=hash(x*.7+p.j*100,y*.9+p.j*50)-.5;
 const vx=Math.cos(angle)*kick*125+(p.j-.5)*60+Math.sin(p.j*91)*22+
  (crumble?jitter*175:0);
 const vy=-kick*(55+70*p.j)+
  (crumble?-dy*2.3+(hash(y*3+p.j*50,x*2)-.5)*120:0);
 if(falling.length>=maxFalling)falling.splice(0,Math.min(28,falling.length-maxFalling+28));
 falling.push({
  x:p.x,y:p.y,j:p.j,radius,bornAt:performance.now(),
  px:worldX+x,py:worldY+y,prevPX:worldX+x,prevPY:worldY+y,vx,vy,resting:false,
  mass:radius*radius,bounce:.15+.14*p.j,
  surfaceFriction:.68+.21*p.j,supported:false,sleepFor:0
 });
}
function dropHeart(spot,hitX,hitY){
 if(spot.heartAt===null)return;
 const rect=region.getBoundingClientRect(),anchor=locateSpot(spot);
 const elapsed=performance.now()-spot.heartAt;
 const progress=reduce?1:1-Math.pow(1-Math.min(1,elapsed/490),3);
 const scale=.72+.28*progress;
 const worldX=rect.left+scrollX,worldY=rect.top+scrollY;
 const start=falling.length;
 // Stop drawing the intact heart and turn every visible heart dot into physics.
 spot.heartAt=null;
 renderOrb();
 rebuildObstacles();
 for(let i=0;i<heartPoints.length;i++){
  if(spot.removed?.has(i))continue;
  const point=heartPoints[i];
  const x=anchor.x+point.x*scale,y=anchor.y+point.y*scale;
  const r=1.6+point.j*.7;
  releaseDot({x:point.x/28,y:point.y/28,j:point.j},worldX,worldY,x,y,
   hitX??anchor.x,hitY??anchor.y,r,true);
 }
 if(reduce){
  for(let i=start;i<falling.length;i++){
   const p=falling[i];p.py=floor-p.radius;p.vx=0;p.vy=0;p.resting=true;
  }
  paintDebris();
 }else animateFalls();
}
function dotColor(p){
 const palette=tones[root.dataset.accent]||tones.blood;
 return "rgba("+palette[Math.min(2,Math.max(0,Math.floor((p.x+p.y+2)/4*3)))]+","+(.58+.38*p.j).toFixed(3)+")";
}
// Wait for the real vyon mark before painting dots; never draw an old placeholder.
function loadIconParticles(){
 const img=new Image();
 img.onload=()=>{
  const size=336,sample=document.createElement("canvas");
  sample.width=size;sample.height=size;
  const sc=sample.getContext("2d",{willReadFrequently:true});
  if(!sc)return;
  const scale=Math.min(size/img.naturalWidth,size/img.naturalHeight);
  sc.drawImage(img,(size-img.naturalWidth*scale)/2,(size-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
  const data=sc.getImageData(0,0,size,size).data,next=[];
  for(let y=2;y<size-2;y+=3)for(let x=2;x<size-2;x+=3){
   const xi=Math.max(0,Math.min(size-1,Math.round(x+(hash(x,y)-.5)*2.1)));
   const yi=Math.max(0,Math.min(size-1,Math.round(y+(hash(y,x)-.5)*2.1)));
   if(data[(yi*size+xi)*4+3]<90)continue;
   next.push({x:((xi+.5)/size-.5)*2,y:((yi+.5)/size-.5)*2,j:hash(x+13,y+37),fallen:false});
  }
  if(next.length>250&&!falling.length){particles.splice(0,particles.length,...next);spriteDirty=true;renderOrb();}
 };
 img.src="/icons/vyon-mark.svg";
}
function resizeDebris(){
 ratio=Math.min(window.devicePixelRatio||1,compactMotion?1.5:2);
 vw=window.innerWidth;vh=window.innerHeight;
 debris.width=Math.round(vw*ratio);debris.height=Math.round(vh*ratio);
 if(debrisCtx)debrisCtx.setTransform(ratio,0,0,ratio,0,0);
 paintDebris();
}
function resizeOrb(){
 if(!ctx)return;
 const b=region.getBoundingClientRect();
 w=Math.max(1,b.width);h=Math.max(1,b.height);
 const r=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.round(w*r);canvas.height=Math.round(h*r);
 ctx.setTransform(r,0,0,r,0,0);
 orbScale=Math.min(w*.43,h*.42,320)*.75;
 renderOrb();
}
function buildSprite(){
 if(!spr)return;
 spr.clearRect(0,0,720,720);
 for(const p of particles){
  if(p.fallen)continue;
  spr.fillStyle=dotColor(p);
  spr.beginPath();spr.arc(360+p.x*358,360+p.y*358,1.7+p.j*.87,0,Math.PI*2);spr.fill();
 }
 spriteDirty=false;
}
function renderOrb(){
 if(!ctx||!w||!h)return;
 if(spriteDirty)buildSprite();
 ctx.clearRect(0,0,w,h);
 ctx.drawImage(sprite,w*.5-orbScale,h*.49-orbScale,orbScale*2,orbScale*2);
 paintHearts();
}
function rebuildObstacles(){
 const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
 const now=performance.now();
 if(!obstacleDirty&&height===obstacleLastHeight&&now-obstacleLastBuilt<8000)return;
 obstacleDirty=false;obstacleLastBuilt=now;obstacleLastHeight=height;
 obstacleCells=new Map();
 floor=height-5;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const range=document.createRange();
 let node,words=0,glyphs=0;
 // Hash close-fitting glyph boxes only when particles are released, never per frame.
 const addBox=(l,r,t,b,el)=>{
  if(r-l<.35||b-t<.35||b<0||t>floor)return;
  const box={l,r,t,b,el};
  const minX=Math.floor(l/gridSize),maxX=Math.floor(r/gridSize);
  const minY=Math.floor(t/gridSize),maxY=Math.floor(b/gridSize);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const key=x+","+y;let group=obstacleCells.get(key);
   if(!group){group=[];obstacleCells.set(key,group);}
   group.push(box);
  }
 };
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  if(!parent||!parent.closest("main,header,footer")||
   parent.closest("script,style,svg,[hidden],.hero-orb,.vyon-falling-dots,.command-overlay"))continue;
  if(!node.nodeValue||!node.nodeValue.trim())continue;
  const style=getComputedStyle(parent);
  if(style.visibility==="hidden"||style.display==="none")continue;
  const fontSize=parseFloat(style.fontSize)||16;
  if(inkMeasure)inkMeasure.font=style.font||style.fontWeight+" "+fontSize+"px "+style.fontFamily;
  const letterSpacing=parseFloat(style.letterSpacing)||0;
  const re=/\S+/g;let match;
  while((match=re.exec(node.nodeValue))&&words<4000){
   range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
   const glyphRun=Array.from(match[0]);
   for(const rect of range.getClientRects()){
    if(rect.width<2||rect.height<2)continue;
    // DOM ranges include invisible font ascent/descent; ink metrics move the
    // collision edge to the visible letters instead of the padded line box.
    const metrics=inkMeasure?.measureText(match[0]);
    const ascent=metrics?.actualBoundingBoxAscent||fontSize*.76;
    const descent=Math.max(0,metrics?.actualBoundingBoxDescent??fontSize*.18);
    const fontDescent=metrics?.fontBoundingBoxDescent??fontSize*.22;
    const baseline=rect.bottom-Math.max(0,Math.min(rect.height*.32,fontDescent));
    const top=Math.max(rect.top+.2,baseline-ascent)-.4+scrollY;
    const bottom=Math.min(rect.bottom-.2,baseline+descent)+.4+scrollY;
    if(bottom<=top)continue;
    if(inkMeasure&&fontSize>=16&&glyphRun.length<=28&&glyphs<3500){
     const letterMetrics=glyphRun.map(ch=>inkMeasure.measureText(ch));
     const advances=letterMetrics.map(m=>Math.max(.1,m.width+letterSpacing));
     const total=advances.reduce((a,b)=>a+b,0);
     const scale=rect.width/Math.max(1,total);
     let advance=0;
     for(let i=0;i<glyphRun.length;i++){
      const m=letterMetrics[i],step=advances[i]*scale;
      const left=rect.left+(advance+(m.actualBoundingBoxLeft||0))*scale;
      const right=rect.left+(advance+(m.actualBoundingBoxRight||m.width))*scale;
      const glyphTop=Math.max(top,baseline-(m.actualBoundingBoxAscent||ascent)-.4+scrollY);
      const glyphBottom=Math.min(bottom,baseline+(m.actualBoundingBoxDescent??descent)+.4+scrollY);
      addBox(Math.max(rect.left,left)-.35+scrollX,
       Math.min(rect.right,right)+.35+scrollX,glyphTop,glyphBottom,parent);
      advance+=advances[i];
     }
     glyphs+=glyphRun.length;
    }else{
     // Fallback uses ink-height bounds too, even for very small UI captions.
     addBox(rect.left+scrollX+.2,rect.right+scrollX-.2,top,bottom,parent);
    }
   }
   words++;
  }
 }
 range.detach?.();
}
function getNearby(x,y){
 const cx=Math.floor(x/gridSize),cy=Math.floor(y/gridSize);
 const out=[],seen=new Set();
 for(let row=cy-1;row<=cy+1;row++)for(let col=cx-1;col<=cx+1;col++){
  for(const box of obstacleCells.get(col+","+row)||[]){
   if(!seen.has(box)){seen.add(box);out.push(box);}
  }
 }
 return out;
}
function paintDebris(blend=1){
 if(!debrisCtx)return;
 debrisCtx.clearRect(0,0,vw,vh);
 for(const p of falling){
  const x=(p.prevPX??p.px)+(p.px-(p.prevPX??p.px))*blend-scrollX;
  const y=(p.prevPY??p.py)+(p.py-(p.prevPY??p.py))*blend-scrollY;
  if(y<-8||y>vh+8||x<-8||x>vw+8)continue;
  debrisCtx.fillStyle=dotColor(p);
  debrisCtx.beginPath();debrisCtx.arc(x,y,p.radius,0,Math.PI*2);debrisCtx.fill();
 }
 for(const p of regroup){
  const x=p.px-scrollX,y=p.py-scrollY;
  if(y<-8||y>vh+8||x<-8||x>vw+8)continue;
  debrisCtx.fillStyle=dotColor(p);
  debrisCtx.beginPath();debrisCtx.arc(x,y,p.radius,0,Math.PI*2);debrisCtx.fill();
 }
}
function bounceText(box,force=1){
 if(reduce||!box.el||typeof box.el.animate!=="function")return;
 // Animate a transformable text element, rather than an inline span whose
 // transform may be ignored by the browser.
 const el=box.el.closest("h1,h2,h3,h4,p,summary,li,blockquote,button,a")||box.el;
 const now=performance.now();
 if(now-(textImpacts.get(el)||0)<960)return;
 textImpacts.set(el,now);
 const amplitude=Math.min(8,2.4+force*.008);
 const frames=[];
 // Damped spring impulse: instant response, decreasing overshoot, soft settle.
 // WAAPI keeps the animation on the compositor without modifying layout.
 for(let i=0;i<=48;i++){
  const t=i/48;
  const dy=i===48?0:-amplitude*Math.exp(-6.4*t)*Math.sin(20*t);
  frames.push({offset:t,transform:"translate3d(0,"+dy.toFixed(3)+"px,0)"});
 }
 el.animate(frames,{duration:880,easing:"linear"});
}
function resolveDotContacts(){
 // Spatial hashing only tests nearby circular bodies, not every possible pair.
 // Sleeping particles stay solid and can be woken by sufficiently strong impacts.
 const cells=new Map();
 for(let i=0;i<falling.length;i++){
  const p=falling[i],cx=Math.floor(p.px/particleCell),cy=Math.floor(p.py/particleCell);
  const key=cx+","+cy;
  let bucket=cells.get(key);
  if(!bucket){bucket=[];cells.set(key,bucket);}
  bucket.push(i);
 }
 for(let i=0;i<falling.length;i++){
  const a=falling[i],cx=Math.floor(a.px/particleCell),cy=Math.floor(a.py/particleCell);
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){
   for(const j of cells.get(x+","+y)||[]){
    if(j<=i)continue;
    const b=falling[j],dx=b.px-a.px,dy=b.py-a.py;
    const minimum=a.radius+b.radius,d2=dx*dx+dy*dy;
    if(d2>=minimum*minimum)continue;
    const d=Math.sqrt(d2),angle=((i*37+j*73)%360)*Math.PI/180;
    const nx=d>.0001?dx/d:Math.cos(angle),ny=d>.0001?dy/d:Math.sin(angle);
    // Impact energy transfers between dots, including already-settled dots.
    const impact=Math.hypot(a.vx-b.vx,a.vy-b.vy);
    if(a.resting&&!b.resting&&impact>290){
     a.resting=false;a.sleepFor=0;a.vx-=nx*Math.min(110,impact*.12);a.vy-=25;
    }
    if(b.resting&&!a.resting&&impact>290){
     b.resting=false;b.sleepFor=0;b.vx+=nx*Math.min(110,impact*.12);b.vy-=25;
    }
    const invA=a.resting?0:1/a.mass,invB=b.resting?0:1/b.mass,sum=invA+invB;
    if(sum===0)continue;
    const penetration=minimum-d;
    const correction=(Math.max(0,penetration-.02)*.86)/sum;
    a.px-=nx*correction*invA;a.py-=ny*correction*invA;
    b.px+=nx*correction*invB;b.py+=ny*correction*invB;
    const relativeX=b.vx-a.vx,relativeY=b.vy-a.vy;
    const approach=relativeX*nx+relativeY*ny;
    if(approach<0){
     const impulse=-(1+Math.min(a.bounce,b.bounce))*approach/sum;
     a.vx-=impulse*nx*invA;a.vy-=impulse*ny*invA;
     b.vx+=impulse*nx*invB;b.vy+=impulse*ny*invB;
     // Tangential friction converts head-on impacts into uneven sideways piles.
     const tx=-ny,ty=nx;
     const slide=relativeX*tx+relativeY*ty;
     const friction=Math.max(-impulse*.3,Math.min(impulse*.3,-slide/sum));
     a.vx-=friction*tx*invA;a.vy-=friction*ty*invA;
     b.vx+=friction*tx*invB;b.vy+=friction*ty*invB;
    }
    if(b.resting&&ny>.4&&b.py>floor-85)a.supported=true;
    if(a.resting&&ny<-.4&&a.py>floor-85)b.supported=true;
   }
  }
 }
}
function advanceDebris(dt){
 const now=performance.now();
 // Visible glyph collision only, allowing long particle tours at low cost.
 // Individual dots use independent circular rigid-body contacts, plus DOM text boxes.
 const steps=1,step=dt;
 for(let n=0;n<steps;n++){
  for(const p of falling){
   p.supported=false;
   if(p.resting)continue;
   const previousX=p.px,previousY=p.py;
   p.vy=Math.min(1950,p.vy+1800*step);
   p.px+=p.vx*step;p.py+=p.vy*step;
   if(p.px<p.radius){p.px=p.radius;p.vx=Math.abs(p.vx)*.55+9;}
   if(p.px>document.documentElement.clientWidth-p.radius){p.px=document.documentElement.clientWidth-p.radius;p.vx=-Math.abs(p.vx)*.55-9;}
   // Words are springy obstacles, not permanent shelves for the particles.
   // After repeated hits a trapped dot passes through rather than hanging mid-page.
   if((p.passTextUntil||0)<now&&p.py>scrollY-120&&p.py<scrollY+innerHeight+120){
    for(const box of getNearby(p.px,p.py)){
     if(p.px+p.radius<box.l||p.px-p.radius>box.r||p.py+p.radius<box.t||p.py-p.radius>box.b)continue;
     bounceText(box,Math.abs(p.vy));
     p.textHits=(p.textHits||0)+1;
     if(p.textHits>5){
      p.passTextUntil=now+1100;
      p.textHits=0;p.vy=Math.max(80,p.vy);
      p.vx+=(p.j>.5?1:-1)*95;
      break;
     }
     if(previousY+p.radius<=box.t+4&&p.vy>=0){
      p.py=box.t-p.radius;
      p.vy=-Math.abs(p.vy)*Math.max(.24,p.bounce);
      // Seek the nearest open edge rather than balancing indefinitely on a word.
      const left=p.px-box.l,right=box.r-p.px;
      const direction=left<right?-1:1;
      p.vx+=direction*(105+18*p.textHits);
      p.vx=Math.max(-360,Math.min(360,p.vx));
      break;
     }
     if(previousX+p.radius<=box.l&&p.vx>0){p.px=box.l-p.radius;p.vx=-Math.abs(p.vx)*.7-55;break;}
     if(previousX-p.radius>=box.r&&p.vx<0){p.px=box.r+p.radius;p.vx=Math.abs(p.vx)*.7+55;break;}
     // The dot spawned inside a moving text hitbox. Expel to the nearest side.
     const leftGap=p.px-box.l,rightGap=box.r-p.px;
     if(leftGap<rightGap){p.px=box.l-p.radius-1;p.vx=-Math.max(85,Math.abs(p.vx));}
     else {p.px=box.r+p.radius+1;p.vx=Math.max(85,Math.abs(p.vx));}
     p.vy=Math.max(90,p.vy);
     break;
    }
   }
   if(p.py>=floor-p.radius){
    p.py=floor-p.radius;
    p.vy=-Math.abs(p.vy)*p.bounce;p.vx*=p.surfaceFriction;
    p.supported=true;
   }
   p.vx*=Math.pow(.995,step*60);
  }
  resolveDotContacts();
  for(const p of falling){
   if(p.resting)continue;
   if(p.px<p.radius){p.px=p.radius;p.vx=Math.abs(p.vx)*.55;}
   if(p.px>document.documentElement.clientWidth-p.radius){p.px=document.documentElement.clientWidth-p.radius;p.vx=-Math.abs(p.vx)*.55;}
   if(p.py>floor-p.radius){
    p.py=floor-p.radius;
    p.vy=-Math.abs(p.vy)*p.bounce;
    p.vx*=p.surfaceFriction;
    p.supported=true;
   }
   const slow=Math.hypot(p.vx,p.vy)<38;
   p.sleepFor=(slow&&p.supported&&p.py>floor-85)?(p.sleepFor+step):0;
   // Any particle still trapped above the footer must remain active and descend.
   if(p.resting&&p.py<floor-85){p.resting=false;p.sleepFor=0;}
   if(p.sleepFor>.14){
    p.resting=true;p.vx=0;p.vy=0;
   }
  }
 }
}

let followActive=false,followStart=0,followPeakY=0,followReturnBehavior="";
const thankYou=document.createElement("span");
thankYou.className="vyon-thank-you";
thankYou.setAttribute("role","status");
thankYou.setAttribute("aria-live","polite");
thankYou.setAttribute("aria-atomic","true");
region.appendChild(thankYou);
let thanksIndex=-1;
const thankCanvas=document.createElement("canvas");
thankCanvas.className="vyon-thank-dots";
thankCanvas.setAttribute("aria-hidden","true");
const thankCtx=thankCanvas.getContext("2d");
const thankDots=[];
let thanksPainting=false,regroup=[],regroupOrigins=[],regroupStart=0,regrouping=false,regroupPending=false,regroupSeq=0;
const regroupTime=reduce?0:1330;
function scheduleRegroup(wait=600){
 if(regroupPending||regrouping)return;
 regroupPending=true;
 const seq=++regroupSeq;
 setTimeout(()=>{
  if(seq!==regroupSeq)return;
  regroupPending=false;
  startRegroup();
 },reduce?0:wait);
}
function startRegroup(){
 if(regrouping)return;
 // Convert existing falling dots into the next phrase rather than teleporting them.
 let leader=null;
 if(followActive){
  for(const p of falling)if(p.tourDot&&!p.resting&&(!leader||p.vy>leader.vy))leader=p;
 }
 const sources=[];
 for(let i=falling.length-1;i>=0;i--){
  const p=falling[i];
  if((p.phraseSource||p.tourDot)&&p!==leader){
   sources.push(p);falling.splice(i,1);
  }
 }
 const oldRect=thankCanvas.getBoundingClientRect();
 if(!sources.length){
  for(const p of thankDots)if(p.fallen)
   sources.push({px:oldRect.left+scrollX+p.tx,py:oldRect.top+scrollY+p.ty,j:p.j});
 }
 showThanks();
 thankYou.classList.add("is-regrouping");
 const b=thankCanvas.getBoundingClientRect(),targetX=b.left+scrollX,targetY=b.top+scrollY;
 const targets=thankDots.slice();
 // Dots tapped away earlier might already have settled or expired. Retain
 // their last visible coordinates for the next phrase, with a hard cap.
 if(sources.length<24&&regroupOrigins.length)
  sources.push(...regroupOrigins.slice(-Math.min(190,maxFalling-sources.length)));
 regroupOrigins.length=0;
 const count=Math.min(sources.length,targets.length,maxFalling);
 for(const p of targets)p.fallen=true;
 // Shuffle the destination ordering so each new message forms in a unique way.
 const arranged=targets.map((p,i)=>({p,r:hash(i*13+thanksIndex, i*7+3)})).sort((a,b)=>a.r-b.r);
 regroup=[];
 for(let i=0;i<count;i++){
  const source=sources[i],target=arranged[i].p;
  regroup.push({sx:source.px,sy:source.py,px:source.px,py:source.py,
   tx:targetX+target.tx,ty:targetY+target.ty,target,
   x:target.x,y:target.y,j:source.j??target.j,radius:target.radius,
   delay:reduce?0:(i%9)*17+hash(i*3,thanksIndex)*70});
 }
 for(let i=count;i<arranged.length;i++){
  arranged[i].p.fallen=false;arranged[i].p.gatherExtra=true;
 }
 regroupStart=performance.now();
 regrouping=!reduce&&regroup.length>0;
 if(!regrouping){
  for(const p of targets){p.fallen=false;p.gatherExtra=false;}
  regroup=[];thankYou.classList.remove("is-regrouping");queueThankPaint();
 }else{queueThankPaint();animateFalls();}
}
function advanceRegroup(now){
 if(!regrouping)return;
 const elapsed=now-regroupStart;
 for(let i=regroup.length-1;i>=0;i--){
  const p=regroup[i];
  const t=Math.max(0,Math.min(1,(elapsed-p.delay)/regroupTime));
  const ease=t>=1?1:1-Math.pow(1-t,3)+Math.sin(12*t)*.06*Math.pow(1-t,2);
  p.px=p.sx+(p.tx-p.sx)*ease;
  p.py=p.sy+(p.ty-p.sy)*ease;
  if(t>=1){p.target.fallen=false;regroup.splice(i,1);}
 }
 if(!regroup.length||elapsed>regroupTime+350){
  regroup=[];regrouping=false;
  thankYou.classList.remove("is-regrouping");
  for(const p of thankDots){p.fallen=false;p.gatherExtra=false;}
 }
 queueThankPaint();
}
function paintThankDots(){
 if(!thankCtx)return;
 const w=Number.parseFloat(thankCanvas.style.width)||1;
 const h=Number.parseFloat(thankCanvas.style.height)||1;
 thankCtx.clearRect(0,0,w,h);
 for(const p of thankDots){
  if(p.fallen)continue;
  thankCtx.globalAlpha=p.gatherExtra&&regrouping
   ?Math.max(0,Math.min(1,(performance.now()-regroupStart-regroupTime*.66)/(regroupTime*.3)))
   :1;
  thankCtx.fillStyle=dotColor(p);
  thankCtx.beginPath();
  thankCtx.arc(p.tx,p.ty,Math.max(1.05,Math.min(2.15,p.radius)),0,Math.PI*2);
  thankCtx.fill();
 }
 thankCtx.globalAlpha=1;
}
function queueThankPaint(){
 if(thanksPainting)return;
 thanksPainting=true;
 requestAnimationFrame(()=>{thanksPainting=false;paintThankDots()});
}
function buildThankDots(message){
 const w=Math.max(190,Math.min(560,region.clientWidth*.79));
 const h=Math.min(126,Math.max(82,w*.24));
 const dpr=Math.min(devicePixelRatio||1,compactMotion?1.5:2);
 thankCanvas.style.width=w+"px";thankCanvas.style.height=h+"px";
 thankCanvas.width=Math.round(w*dpr);thankCanvas.height=Math.round(h*dpr);
 if(!thankCtx)return;
 thankCtx.setTransform(dpr,0,0,dpr,0,0);
 const sample=document.createElement("canvas");
 sample.width=Math.ceil(w);sample.height=Math.ceil(h);
 const sc=sample.getContext("2d",{willReadFrequently:true});
 if(!sc)return;
 const family=getComputedStyle(document.body).fontFamily||"sans-serif";
 let fontSize=Math.min(72,h*.69),textWidth=Infinity;
 while(fontSize>24){
  sc.font="750 "+fontSize+"px "+family;
  textWidth=sc.measureText(message).width;
  if(textWidth<w*.93)break;
  fontSize-=2;
 }
 sc.clearRect(0,0,sample.width,sample.height);
 sc.fillStyle="#fff";
 sc.font="750 "+fontSize+"px "+family;
 sc.textAlign="center";sc.textBaseline="middle";
 sc.fillText(message,w/2,h*.51,w*.95);
 const alpha=sc.getImageData(0,0,sample.width,sample.height).data;
 const step=Math.max(4.2,Math.sqrt(w*h/(compactMotion?1000:1650)));
 thankDots.length=0;
 for(let y=4;y<h-4;y+=step)for(let x=4;x<w-4;x+=step){
  const j=hash(x*.77,y*.91);
  const tx=x+(j-.5)*step*.22,ty=y+(hash(y,x)-.5)*step*.22;
  const px=Math.max(0,Math.min(sample.width-1,Math.floor(tx)));
  const py=Math.max(0,Math.min(sample.height-1,Math.floor(ty)));
  if(alpha[(py*sample.width+px)*4+3]<110)continue;
  thankDots.push({tx,ty,x:tx/w*2-1,y:ty/h*2-1,j,radius:1.15+j*.55,fallen:false});
 }
 paintThankDots();
}
function brushThankDots(clientX,clientY,prevX=clientX,prevY=clientY,radius=compactMotion?14:12){
 if(!thankYou.classList.contains("is-visible")||regrouping||regroupPending||!thankDots.some(p=>!p.fallen))return false;
 const bounds=thankCanvas.getBoundingClientRect();
 const fromX=prevX-bounds.left,fromY=prevY-bounds.top;
 const toX=clientX-bounds.left,toY=clientY-bounds.top;
 const worldX=bounds.left+scrollX,worldY=bounds.top+scrollY;
 let hits=0;
 for(const p of thankDots){
  if(p.fallen||!pointInBrush(p.tx,p.ty,fromX,fromY,toX,toY,radius))continue;
  p.fallen=true;
  regroupOrigins.push({px:worldX+p.tx,py:worldY+p.ty,j:p.j});
  if(regroupOrigins.length>200)regroupOrigins.splice(0,regroupOrigins.length-200);
  // Limit moving dots even if someone repeatedly scratches every word.
  if(hits++%2===0){
   releaseDot(p,worldX,worldY,p.tx,p.ty,toX,toY,p.radius,true);
   falling[falling.length-1].phraseSource=true;
  }
 }
 if(hits){
  queueThankPaint();
  if(reduce){
   for(const p of falling){if(!p.resting){p.resting=true;p.py=floor-p.radius;p.vx=p.vy=0;}}
   paintDebris();
  }else animateFalls();
  if(!thankDots.some(p=>!p.fallen))scheduleRegroup(550);
 }
 return hits>0;
}
function shatterThankDots(){
 if(!thankYou.classList.contains("is-visible")||regrouping)return false;
 const intact=thankDots.filter(p=>!p.fallen);
 if(!intact.length){scheduleRegroup(220);return true;}
 const b=thankCanvas.getBoundingClientRect();
 const wx=b.left+scrollX,wy=b.top+scrollY;
 const stride=Math.max(1,Math.ceil(intact.length/(compactMotion?110:170)));
 for(let i=0;i<intact.length;i++){
  const p=intact[i];p.fallen=true;
  if(i%stride===0){
   releaseDot(p,wx,wy,p.tx,p.ty,b.width*.5,b.height*.5,p.radius,true);
   falling[falling.length-1].phraseSource=true;
  }
 }
 queueThankPaint();
 if(reduce){
  for(const p of falling){if(!p.resting){p.resting=true;p.py=floor-p.radius;p.vx=p.vy=0;}}
  paintDebris();
 }else animateFalls();
 scheduleRegroup(630);
 return true;
}
const thanksOptions=[
 {message:"Thank you.",sub:"For being part of vyon."},
 {message:"Much love.",sub:"Thanks for listening."},
 {message:"You're amazing.",sub:"Thanks for being here."},
 {message:"Thank you ♥",sub:"Keep the music playing."},
 {message:"Stay in tune.",sub:"Thanks for making vyon yours."}
];
function hideThanks(){
 thankYou.classList.remove("is-visible","is-regrouping");
 thankDots.length=0;queueThankPaint();
}
function restoreLogo(){
 if(!particles.length||particles.some(p=>!p.fallen))return;
 for(const p of particles)p.fallen=false;
 clearedSpots.length=0;spriteDirty=true;queueOrbRender();
}
function showThanks(){
 hideThanks();
 let i=Math.floor(Math.random()*thanksOptions.length);
 if(i===thanksIndex)i=(i+1+Math.floor(Math.random()*(thanksOptions.length-1)))%thanksOptions.length;
 thanksIndex=i;
 const v=thanksOptions[i];
 thankYou.replaceChildren();
 const accessible=document.createElement("strong"),small=document.createElement("small");
 accessible.className="visually-hidden";
 accessible.textContent=v.message;small.textContent=v.sub;
 thankYou.append(accessible,thankCanvas,small);
 thankYou.dataset.variant=String(Math.floor(Math.random()*3));
 buildThankDots(v.message);
 // No time-based replacement: the dotted message persists when scrolling back.
 thankYou.classList.add("is-visible");
}
function stopDotFollow(){
 if(!followActive)return;
 followActive=false;
 root.style.scrollBehavior=followReturnBehavior;
 // The camera may stop, but the message remains for visitors scrolling back up.
}
function beginDotFollow(){
 if(reduce)return;
 followReturnBehavior=root.style.scrollBehavior;
 root.style.scrollBehavior="auto";
 followActive=true;followStart=performance.now();
 followPeakY=scrollY+innerHeight*.5;
}
function followFastestDot(now,dt){
 if(!followActive)return;
 if(document.hidden||now-followStart>18000){stopDotFollow();return;}
 let fastest=null,anyMoving=false;
 for(const p of falling){
  if(!p.tourDot||p.resting)continue;
  anyMoving=true;
  if(p.vy>0&&(!fastest||p.vy>fastest.vy))fastest=p;
 }
 if(fastest)followPeakY=Math.max(followPeakY,fastest.py);
 const limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const target=anyMoving?Math.max(scrollY,Math.min(limit,followPeakY-innerHeight*.43)):limit;
 const alpha=1-Math.exp(-Math.max(.001,dt)*5.2);
 const next=scrollY+(target-scrollY)*alpha;
 if(Math.abs(next-scrollY)>.15)window.scrollTo(0,next);
 if(!anyMoving&&Math.abs(target-next)<2)stopDotFollow();
}
// A manual scroll cancels the camera AND retires the floating overlay.
 // Leaving particles floating above the copy on the way back up would make
 // the actual section text difficult to read.
function cancelDotTour(){
 if(!followActive)return;
 stopDotFollow();
 falling.length=0;
 paintDebris();
}
window.addEventListener("wheel",cancelDotTour,{passive:true});
window.addEventListener("touchmove",cancelDotTour,{passive:true});
document.addEventListener("pointerdown",cancelDotTour,{capture:true,passive:true});
document.addEventListener("keydown",e=>{
 if(["Escape","PageDown","PageUp","ArrowUp","ArrowDown","Home","End"," "].includes(e.key))cancelDotTour();
});
function pruneFalling(now){
 if(now-lastDebrisPrune<450)return;
 lastDebrisPrune=now;
 for(let i=falling.length-1;i>=0;i--){
  const p=falling[i];
  if(now-(p.bornAt||now)>14500||(p.resting&&now-(p.bornAt||now)>3000))
   falling.splice(i,1);
 }
}

function tick(now){
 if(!active)return;
 const elapsed=lastTime?Math.max(0,Math.min(.05,(now-lastTime)/1000)):physicsStep;
 lastTime=now;
 physicsCarry=Math.min(physicsCarry+elapsed,physicsStep*6);
 let passes=0;
 while(physicsCarry>=physicsStep&&passes<6){
  // Fixed simulation steps keep collision timing stable at every refresh rate.
  // Draw between the latest two samples for smoother canvas movement.
  for(const p of falling){p.prevPX=p.px;p.prevPY=p.py;}
  advanceDebris(physicsStep);
  physicsCarry-=physicsStep;
  passes++;
 }
 pruneFalling(now);
 if(followActive)followFastestDot(now,elapsed);
 advanceRegroup(now);
 paintDebris(Math.min(1,physicsCarry/physicsStep));
 if((falling.some(p=>!p.resting)||followActive||regrouping)&&!document.hidden)requestAnimationFrame(tick);
 else {active=false;lastTime=0;physicsCarry=0;stopDotFollow();paintDebris();}
}
function animateFalls(){
 if(active)return;
 active=true;lastTime=0;physicsCarry=0;
 requestAnimationFrame(tick);
}

function collapseDottedLogo(){
 if(!w||!h||!particles.length)return false;
 stopDotFollow();
 // A deliberate replay is the only time we replace a thank-you with a logo.
 if(thankYou.classList.contains("is-visible"))hideThanks();
 if(particles.every(p=>p.fallen))restoreLogo();
 const available=particles.filter(p=>!p.fallen);
 if(!available.length)return false;
 rebuildObstacles();
 const rect=region.getBoundingClientRect();
 const worldX=rect.left+scrollX,worldY=rect.top+scrollY;
 const cx=w*.5,cy=h*.49,scale=orbScale*358/360;
 const sampleEvery=Math.max(1,Math.ceil(available.length/(compactMotion?180:280)));
 const first=falling.length;
 for(const p of falling)p.tourDot=false;
 for(let i=0;i<available.length;i++){
  const p=available[i];p.fallen=true;
  if(i%sampleEvery!==0)continue;
  const x=cx+p.x*scale,y=cy+p.y*scale;
  releaseDot(p,worldX,worldY,x,y,cx,cy,1.1+p.j*.9,true);
  const dot=falling[falling.length-1];
  dot.tourDot=true;dot.phraseSource=true;dot.vy-=20+p.j*65;dot.vx+=(p.j-.5)*90;
 }
 clearedSpots.length=0;spriteDirty=true;queueOrbRender();
 scheduleRegroup(740);
 if(reduce){
  for(let i=first;i<falling.length;i++){
   const p=falling[i];p.py=floor-p.radius;p.vx=p.vy=0;p.resting=true;
  }
  paintDebris();
 }else{
  beginDotFollow();animateFalls();
 }
 return true;
}
function tapTouchesDots(clientX,clientY){
 const rect=region.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top;
 const cx=w*.5,cy=h*.49,scale=orbScale*358/360;
 const limit=compactMotion?29:22,limitSq=limit*limit;
 for(const p of particles){
  const dx=cx+p.x*scale-x,dy=cy+p.y*scale-y;
  if(dx*dx+dy*dy<=limitSq)return true;
 }
 return false;
}
function pointInBrush(x,y,fromX,fromY,toX,toY,r){
 const dx=toX-fromX,dy=toY-fromY,length=dx*dx+dy*dy;
 const t=length>0?Math.max(0,Math.min(1,((x-fromX)*dx+(y-fromY)*dy)/length)):0;
 const px=fromX+dx*t-x,py=fromY+dy*t-y;
 return px*px+py*py<=r*r;
}

// Sweep only once per pointer event instead of 32 repeated full-logo scans.
let pointerTrail=null,orbRenderQueued=false,suppressLogoClickUntil=0;
function queueOrbRender(){
 if(orbRenderQueued)return;
 orbRenderQueued=true;
 requestAnimationFrame(()=>{orbRenderQueued=false;renderOrb()});
}
function dragDotBrush(localX,localY,fromX=localX,fromY=localY){
 const cx=w*.5,cy=h*.49,scale=orbScale*358/360;
 const r=16;
 const rect=region.getBoundingClientRect();
 const worldX=rect.left+scrollX,worldY=rect.top+scrollY;
 let first=false;
 for(const p of particles){
  if(p.fallen)continue;
  const x=cx+p.x*scale,y=cy+p.y*scale;
  if(!pointInBrush(x,y,fromX,fromY,localX,localY,r))continue;
  p.fallen=true;first=true;
  releaseDot(p,worldX,worldY,x,y,localX,localY);
 }
 for(const spot of clearedSpots){
  if(spot.heartAt===null)continue;
  const anchor=locateSpot(spot);
  if(Math.hypot(anchor.x-localX,anchor.y-localY)>51)continue;
  const progress=reduce?1:1-Math.pow(1-Math.min(1,(performance.now()-spot.heartAt)/490),3);
  const size=.72+.28*progress;
  const removed=spot.removed||(spot.removed=new Set());
  for(let i=0;i<heartPoints.length;i++){
   if(removed.has(i))continue;
   const point=heartPoints[i],x=anchor.x+point.x*size,y=anchor.y+point.y*size;
   if(!pointInBrush(x,y,fromX,fromY,localX,localY,r))continue;
   removed.add(i);first=true;
   const radius=1.6+point.j*.7;
   releaseDot({x:point.x/28,y:point.y/28,j:point.j},worldX,worldY,x,y,localX,localY,radius,true);
  }
  if(removed.size>=heartPoints.length)spot.heartAt=null;
 }
 if(first){
  // Keep one heart target per drag stroke, not one giant cluster per pointer sample.
  const distance=clearedSpots.length?Math.hypot(locateSpot(clearedSpots[clearedSpots.length-1]).x-localX,locateSpot(clearedSpots[clearedSpots.length-1]).y-localY):Infinity;
  if(distance>55)clearedSpots.push({relX:(localX-cx)/scale,relY:(localY-cy)/scale,heartAt:null});
  spriteDirty=true;queueOrbRender();
  if(reduce){const count=falling.length;for(let i=0;i<count;i++){if(!falling[i].resting){falling[i].py=floor-falling[i].radius;falling[i].vx=falling[i].vy=0;falling[i].resting=true;}}paintDebris();}
  else animateFalls();
 }
 return first;
}
region.addEventListener("pointerdown",e=>{
 if(e.button!==0&&e.pointerType==="mouse")return;
 const r=region.getBoundingClientRect();
 pointerTrail={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top,
  startX:e.clientX-r.left,startY:e.clientY-r.top,dragged:false,
  released:false,thankStroke:thankYou.classList.contains("is-visible"),
  spotsStart:clearedSpots.length};
 region.setPointerCapture?.(e.pointerId);
});
region.addEventListener("pointermove",e=>{
 if(!pointerTrail||pointerTrail.id!==e.pointerId)return;
 const r=region.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
 const dx=x-pointerTrail.x,dy=y-pointerTrail.y,dist=Math.hypot(dx,dy);
 if(!pointerTrail.dragged&&Math.hypot(x-pointerTrail.startX,y-pointerTrail.startY)<8)return;
 if(!pointerTrail.dragged){
  pointerTrail.dragged=true;
  if(!pointerTrail.thankStroke)rebuildObstacles();
 }
 if(dist>0){
  if(pointerTrail.thankStroke){
   if(brushThankDots(e.clientX,e.clientY,
     pointerTrail.x+r.left,pointerTrail.y+r.top))pointerTrail.released=true;
  }else if(dragDotBrush(x,y,pointerTrail.x,pointerTrail.y))pointerTrail.released=true;
 }
 pointerTrail.x=x;pointerTrail.y=y;
 if(e.cancelable)e.preventDefault();
},{passive:false});
function endDotDrag(e){
 if(!pointerTrail||e.pointerId!==pointerTrail.id)return;
 const stroke=pointerTrail;pointerTrail=null;
 if(stroke.dragged)suppressLogoClickUntil=performance.now()+600;
 if(region.hasPointerCapture?.(e.pointerId))region.releasePointerCapture(e.pointerId);
 if(e.type!=="pointercancel"&&stroke.dragged&&stroke.released&&!stroke.thankStroke){
  const spots=clearedSpots.slice(stroke.spotsStart).filter(s=>s.heartAt===null);
  if(spots.length)makeHeart(spots[spots.length-1]);
 }
}
region.addEventListener("pointerup",endDotDrag);
region.addEventListener("pointercancel",endDotDrag);
region.addEventListener("click",e=>{
 if(performance.now()<suppressLogoClickUntil)return;
 if(e.detail!==0&&e.button!==0)return;
 if(thankYou.classList.contains("is-visible")){
  // A tap removes only the ink dots directly beneath a fingertip, not a chunk;
  // if every letter has been broken, the next
  // tap draws a fresh randomized dotted thank-you.
  if(regrouping||regroupPending)return;
  if(!thankDots.some(p=>!p.fallen))scheduleRegroup(250);
  else brushThankDots(e.clientX,e.clientY,e.clientX,e.clientY,compactMotion?13:11);
  e.vyonParticleHandled=true;
  return;
 }
 if(tapTouchesDots(e.clientX,e.clientY)){
  collapseDottedLogo();e.vyonParticleHandled=true;
 }
});
region.addEventListener("keydown",e=>{
 if(e.key!=="Enter"&&e.key!==" ")return;
 e.preventDefault();
 if(thankYou.classList.contains("is-visible"))shatterThankDots();
 else collapseDottedLogo();
});
window.addEventListener("resize",()=>{
 obstacleDirty=true;resizeOrb();resizeDebris();if(falling.length)rebuildObstacles();
 if(thankYou.classList.contains("is-visible")){
  const phrase=thanksOptions[thanksIndex]?.message;
  if(phrase)buildThankDots(phrase);
  regroup=[];regrouping=false;
  thankYou.classList.remove("is-regrouping");
 }
},{passive:true});
window.addEventListener("scroll",()=>{if(!active)paintDebris()},{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopDotFollow();else if(falling.some(p=>!p.resting))animateFalls();});
// Initialize the dotted logo before any optional FAQ listeners.
resizeOrb();resizeDebris();loadIconParticles();
document.fonts?.ready?.then(()=>{obstacleDirty=true});
$$(".faq-item").forEach(el=>el.addEventListener("toggle",()=>{obstacleDirty=true}));
// Taps and ordinary clicks always activate controls normally.
// Only intentional dragging removes their decorative dotted layer.
$$(".btn,.platform-download,.social-card,.header-github,.theme-chip,.screenshot-tab,.eq-toggle,.command-trigger,.mobile-menu-btn").forEach(control=>{
 control.classList.add("vyon-dot-button");
 let stroke=null,suppressClick=false;
 control.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  stroke={id:e.pointerId,x:e.clientX,y:e.clientY,released:false};
 });
 control.addEventListener("pointermove",e=>{
  if(!stroke||stroke.id!==e.pointerId||stroke.released||control.classList.contains("vyon-dots-collapsed"))return;
  const dx=e.clientX-stroke.x,dy=e.clientY-stroke.y;
  if(Math.hypot(dx,dy)<14)return;
  // Vertical touch gestures should continue to scroll normally.
  if(e.pointerType==="touch"&&Math.abs(dy)>Math.abs(dx)*1.1)return;
  stroke.released=true;suppressClick=true;
  if(e.cancelable&&e.pointerType==="mouse")e.preventDefault();
  const b=control.getBoundingClientRect();
  if(b.width<10||b.height<8)return;
  rebuildObstacles();
  const start=falling.length;
  for(let y=7;y<b.height-4;y+=9)for(let x=7;x<b.width-4;x+=9){
   const seed=hash(x+b.left,y+b.top);
   if(seed<.24)continue;
   releaseDot({x:x/b.width*2-1,y:y/b.height*2-1,j:seed},
    b.left+scrollX,b.top+scrollY,x,y,e.clientX-b.left,e.clientY-b.top,1.1+seed*.6,true);
  }
  control.classList.add("vyon-dots-collapsed");
  if(reduce){
   for(let i=start;i<falling.length;i++){
    const p=falling[i];p.py=floor-p.radius;p.vx=p.vy=0;p.resting=true;
   }
   paintDebris();
  }else animateFalls();
 },{passive:false});
 control.addEventListener("pointerup",e=>{if(stroke?.id===e.pointerId)stroke=null});
 control.addEventListener("pointercancel",()=>{stroke=null;suppressClick=false});
 control.addEventListener("click",e=>{
  if(!suppressClick)return;
  suppressClick=false;e.preventDefault();e.stopImmediatePropagation();
 },true);
 control.addEventListener("dragstart",e=>e.preventDefault());
});
// The interactive EQ controls live in /equalizer.js; no fake animated-bar visualizer.
// Cursor-reactive surface light, with no dependency on animation libraries.
if(window.matchMedia("(hover: hover) and (pointer: fine)").matches){
 $$(".feature-card").forEach(card=>card.addEventListener("pointermove",e=>{
  const rect=card.getBoundingClientRect();
  card.style.setProperty("--mx",((e.clientX-rect.left)/rect.width*100).toFixed(1)+"%");
  card.style.setProperty("--my",((e.clientY-rect.top)/rect.height*100).toFixed(1)+"%");
 }));
}
// Load official vyon screenshots only. Missing images show honest placeholders.
const shots={
 "home":{file:"home.webp",title:"Home",caption:"HOME SCREEN",index:"01 / 03"},
 "now-playing":{file:"now-playing.webp",title:"Now playing",caption:"NOW PLAYING",index:"02 / 03"},
 "library":{file:"library.webp",title:"Library",caption:"YOUR LIBRARY",index:"03 / 03"}
};
const shotImg=$("#screenshot-image"),emptyShot=$("#screenshot-empty");let shotRequest=0;
function chooseShot(key){
 const shot=shots[key];if(!shot)return;
 const request=++shotRequest;
 $$("[data-screen]").forEach(btn=>{const active=btn.dataset.screen===key;btn.classList.toggle("is-selected",active);btn.setAttribute("aria-pressed",String(active));});
 $("#screenshot-caption").textContent=shot.caption;
 $("#screenshot-empty-title").textContent=shot.title;
 shotImg.hidden=true;shotImg.removeAttribute("src");emptyShot.hidden=false;
 const image=new Image();
 image.onload=()=>{
  if(request!==shotRequest)return;
  shotImg.src=image.src;
  shotImg.alt="Official vyon Android screenshot: "+shot.title;
  shotImg.hidden=false;emptyShot.hidden=true;
 };
 image.onerror=()=>{if(request===shotRequest){shotImg.hidden=true;emptyShot.hidden=false;}};
 image.src="/screenshots/"+shot.file;
}
$$("[data-screen]").forEach(btn=>btn.addEventListener("click",()=>chooseShot(btn.dataset.screen)));
const shotOrder=["home","now-playing","library"];
const shotStage=$(".screenshot-stage");
let touchStart=0;
if(shotStage){
 shotStage.addEventListener("touchstart",e=>{touchStart=e.changedTouches[0]?.clientX??0;},{passive:true});
 shotStage.addEventListener("touchend",e=>{
  const distance=(e.changedTouches[0]?.clientX??0)-touchStart;
  if(Math.abs(distance)<55)return;
  const selectedKey=$(".screenshot-tab.is-selected")?.dataset.screen||"home";
  const next=(shotOrder.indexOf(selectedKey)+(distance<0?1:shotOrder.length-1))%shotOrder.length;
  chooseShot(shotOrder[next]);
 },{passive:true});
}
// Off-screen screenshot assets shouldn't contend with the critical hero render.
const screenshotSection=document.getElementById("experience")||shotStage;
if(screenshotSection&&"IntersectionObserver" in window){
 const screenshotObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  screenshotObserver.disconnect();
  if(!shotRequest)chooseShot("home");
 },{rootMargin:"250px 0px"});
 screenshotObserver.observe(screenshotSection);
}else chooseShot("home");
// Expand a real screenshot only. Placeholders never open an invented image.
const lightbox=document.createElement("div");
lightbox.className="shot-lightbox";
lightbox.hidden=true;
lightbox.innerHTML='<button type="button" class="lightbox-close" aria-label="Close screenshot">×</button><img alt="Expanded vyon screenshot">';
lightbox.setAttribute("role","dialog");
lightbox.setAttribute("aria-modal","true");
lightbox.setAttribute("aria-label","Full-size vyon screenshot");
document.body.append(lightbox);
const fullImage=lightbox.querySelector("img");
const closeLightbox=lightbox.querySelector("button");
let lightboxReturnFocus=null;
function dismissShot(){
 lightbox.hidden=true;document.body.style.overflow="";
 if(lightboxReturnFocus?.focus)lightboxReturnFocus.focus();
}
function expandShot(){
 if(shotImg.hidden||!shotImg.src)return;
 lightboxReturnFocus=document.activeElement;
 fullImage.src=shotImg.src;fullImage.alt=shotImg.alt;
 lightbox.hidden=false;document.body.style.overflow="hidden";closeLightbox.focus();
}
shotImg.tabIndex=0;
shotImg.setAttribute("role","button");
shotImg.setAttribute("aria-label","Expand official screenshot");
shotImg.addEventListener("click",expandShot);
shotImg.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();expandShot();}});
closeLightbox.addEventListener("click",dismissShot);
lightbox.addEventListener("click",e=>{if(e.target===lightbox)dismissShot();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!lightbox.hidden)dismissShot();});
// Official stable release assets: verify format and URL before direct linking.
const repo="bxanedot/vyon";
const releaseCards=$$("[data-platform]");
const formats={
 android:name=>/\.apk$/i.test(name),
 windows:name=>/\.(exe|msi|msix|msixbundle)$/i.test(name)||(/\.(zip|7z)$/i.test(name)&&/(windows?|win32|win64)/i.test(name)),
 macos:name=>/\.(dmg|pkg)$/i.test(name)||(/\.zip$/i.test(name)&&/(macos|mac[-_. ]?os|darwin|osx)/i.test(name)),
 linux:name=>/\.(appimage|deb|rpm)$/i.test(name)||(/\.(tar\.gz|tar\.xz|tar\.zst)$/i.test(name)&&/linux/i.test(name))
};
function setReleaseCard(card,asset,error){
 const link=card.querySelector(".platform-download");
 const label=card.querySelector(".platform-download-label");
 const status=card.querySelector(".platform-status");
 const os=card.querySelector("h3").textContent;
 if(asset){
  link.href=asset.browser_download_url;
  link.setAttribute("aria-label","Download verified vyon installer for "+os);
  label.textContent="Download for "+os;
  status.textContent="Stable release: "+asset.name;
 }else{
  link.href="https://github.com/"+repo+"/releases";
  link.setAttribute("aria-label","Browse official vyon releases for "+os);
  label.textContent="View releases";
  status.textContent=error?"Unable to verify release files. Check GitHub Releases.":"No matching stable installer published yet.";
 }
}
async function loadStableReleases(){
 let stable=[];
 try{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  let response;
  try{
   response=await fetch("https://api.github.com/repos/"+repo+"/releases?per_page=75",{
    headers:{Accept:"application/vnd.github+json"},signal:controller.signal
   });
  }finally{clearTimeout(timer);}
  if(!response.ok)throw Error("GitHub HTTP "+response.status);
  const data=await response.json();
  if(!Array.isArray(data))throw Error("Unexpected release response");
  stable=data.filter(r=>!r.draft&&!r.prerelease&&
   !/nightly|canary|dev.build/i.test(String(r.name||"")+" "+String(r.tag_name||"")));
 }catch(err){
  console.info("vyon release check:",err.message);
  releaseCards.forEach(card=>setReleaseCard(card,null,true));return;
 }
 releaseCards.forEach(card=>{
  const accepts=formats[card.dataset.platform];
  const asset=stable.flatMap(r=>Array.isArray(r.assets)?r.assets:[]).find(a=>a&&accepts&&
   accepts(String(a.name||""))&&/^https:\/\//i.test(String(a.browser_download_url||"")));
  setReleaseCard(card,asset||null,false);
 });
}
// Begin checking official releases just before the downloads enter the viewport.
// Keep the no-IntersectionObserver path fully functional.
let releaseLookupStarted=false;
function startReleaseLookup(){
 if(releaseLookupStarted)return;
 releaseLookupStarted=true;
 void loadStableReleases();
}
const downloadSection=document.getElementById("downloads");
if(downloadSection&&"IntersectionObserver" in window){
 const downloadObserver=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  downloadObserver.disconnect();
  startReleaseLookup();
 },{rootMargin:"150px 0px"});
 downloadObserver.observe(downloadSection);
}else startReleaseLookup();

})();