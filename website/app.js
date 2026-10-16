/* vyon site. Original particle art, genuine screenshot slots, official stable-release status. */
(() => {
"use strict";
const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
const root=document.documentElement;
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

// Header, mobile, and quick-navigation links jump straight to the bottom sections.
$$('a[href="#community"],a[href="#support"]').forEach(link=>{
 link.addEventListener("click",event=>{
  const hash=link.getAttribute("href");
  const target=document.querySelector(hash);
  if(!target)return;
  event.preventDefault();
  const prior=root.style.scrollBehavior;
  root.style.scrollBehavior="auto";
  target.scrollIntoView({behavior:"auto",block:"start"});
  root.style.scrollBehavior=prior;
  if(location.hash!==hash)history.pushState(null,"",hash);
 });
});

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
$(".faq-item").forEach(detail=>detail.addEventListener("toggle",()=>{
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
 ["experience","equalizer","details","faq","community","support"].forEach(id=>{const section=document.getElementById(id);if(section)sectionObserver.observe(section);});
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
// Actual Vyon icon silhouette, drawn as static dots. Only clicked clusters fall.
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
const physicsStep=1/120;
const sprite=document.createElement("canvas");
sprite.width=720;sprite.height=720;
const spr=sprite.getContext("2d",{alpha:true});
const debris=document.createElement("canvas");
debris.className="vyon-falling-dots";
debris.setAttribute("aria-hidden","true");
document.body.appendChild(debris);
const debrisCtx=debris.getContext("2d",{alpha:true});
let vw=0,vh=0,ratio=1,obstacleCells=new Map(),floor=0;
const gridSize=96,particleCell=8;
const textImpacts=new WeakMap();
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
 falling.push({
  x:p.x,y:p.y,j:p.j,radius,
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
function seedFallback(){
 particles.length=0;
 for(let i=0;i<500;i++){
  const theta=i/500*Math.PI*2;
  for(let band=0;band<3;band++){
   const radius=.66+.06*Math.cos(theta*6)+(band-1)*.035;
   particles.push({x:Math.cos(theta)*radius,y:Math.sin(theta)*radius,j:hash(i,band),fallen:false});
  }
 }
 spriteDirty=true;
}
seedFallback();
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
 ratio=Math.min(window.devicePixelRatio||1,2);
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
 obstacleCells=new Map();
 floor=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-5;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const range=document.createRange();
 let node,words=0;
 while((node=walker.nextNode())){
  const parent=node.parentElement;
  if(!parent||!parent.closest("main,header,footer")||
   parent.closest("script,style,svg,[hidden],.hero-orb,.vyon-falling-dots,.command-overlay"))continue;
  if(!node.nodeValue||!node.nodeValue.trim())continue;
  if(getComputedStyle(parent).visibility==="hidden"||getComputedStyle(parent).display==="none")continue;
  const re=/\S+/g;let match;
  while((match=re.exec(node.nodeValue))&&words<4000){
   range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
   for(const r of range.getClientRects()){
    if(r.width<2||r.height<2)continue;
    const box={l:r.left+scrollX-2,r:r.right+scrollX+2,t:r.top+scrollY-2,b:r.bottom+scrollY+2,el:parent};
    if(box.b<0||box.t>floor)continue;
    const minX=Math.floor(box.l/gridSize),maxX=Math.floor(box.r/gridSize);
    const minY=Math.floor(box.t/gridSize),maxY=Math.floor(box.b/gridSize);
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
     const key=x+","+y;let group=obstacleCells.get(key);
     if(!group){group=[];obstacleCells.set(key,group);}
     group.push(box);
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
}
function bounceText(box,force=1){
 if(reduce||!box.el||typeof box.el.animate!=="function")return;
 const el=box.el.closest("h1,h2,h3,h4,p,small,strong,em,span,summary,a,label,li,button")||box.el;
 const now=performance.now();
 if(now-(textImpacts.get(el)||0)<560)return;
 textImpacts.set(el,now);
 const height=Math.min(5,1.4+force*.008);
 el.animate([
  {transform:"translate3d(0,0,0)",offset:0},
  {transform:"translate3d(0,"+(-height).toFixed(1)+"px,0)",offset:.24},
  {transform:"translate3d(0,"+(height*.18).toFixed(1)+"px,0)",offset:.68},
  {transform:"translate3d(0,0,0)",offset:1}
 ],{duration:580,easing:"cubic-bezier(.22,.7,.2,1)"});
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
   if((p.passTextUntil||0)<performance.now()){
    for(const box of getNearby(p.px,p.py)){
     if(p.px+p.radius<box.l||p.px-p.radius>box.r||p.py+p.radius<box.t||p.py-p.radius>box.b)continue;
     bounceText(box,Math.abs(p.vy));
     p.textHits=(p.textHits||0)+1;
     if(p.textHits>5){
      p.passTextUntil=performance.now()+1100;
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
 paintDebris(Math.min(1,physicsCarry/physicsStep));
 if(falling.some(p=>!p.resting)&&!document.hidden)requestAnimationFrame(tick);
 else {active=false;lastTime=0;physicsCarry=0;paintDebris();}
}
function animateFalls(){
 if(active)return;
 active=true;lastTime=0;physicsCarry=0;
 requestAnimationFrame(tick);
}
function dropCluster(localX,localY){
 if(!w||!h)return false;
 const cx=w*.5,cy=h*.49,scale=orbScale*358/360;
 let closest=Infinity;
 for(const p of particles){
  if(p.fallen)continue;
  closest=Math.min(closest,Math.hypot(cx+p.x*scale-localX,cy+p.y*scale-localY));
 }
 if(closest>20)return false;
 const rect=region.getBoundingClientRect(),worldX=rect.left+scrollX,worldY=rect.top+scrollY;
 const cluster=63;
 rebuildObstacles();
 let count=0;
 for(const p of particles){
  if(p.fallen)continue;
  const x=cx+p.x*scale,y=cy+p.y*scale;
  const dist=Math.hypot(x-localX,y-localY);
  if(dist>cluster)continue;
  p.fallen=true;count++;
  releaseDot(p,worldX,worldY,x,y,localX,localY);
 }
 if(!count)return false;
 clearedSpots.push({relX:(localX-cx)/scale,relY:(localY-cy)/scale,heartAt:null});
 spriteDirty=true;renderOrb();
 if(reduce){
  for(const p of falling){p.py=floor-p.radius;p.vy=0;p.vx=0;p.resting=true;}
  paintDebris();
 }else animateFalls();
 return true;
}
function activateLogo(localX,localY){
 // Click cycle: dots fall -> a heart appears in the gap -> the heart falls too.
 const spot=clearedSpots.find(s=>{
  const at=locateSpot(s);
  return Math.hypot(at.x-localX,at.y-localY)<43;
 });
 if(spot){
  if(spot.heartAt===null)makeHeart(spot);
  else dropHeart(spot,localX,localY);
  return true;
 }
 return dropCluster(localX,localY);
}
// Press and drag over the silhouette to dislodge only the dots the pointer touches.
let pointerTrail=null,ignoreNextClick=false;
function dragDotBrush(localX,localY){
 const cx=w*.5,cy=h*.49,scale=orbScale*358/360;
 const r=16;
 const rect=region.getBoundingClientRect();
 const worldX=rect.left+scrollX,worldY=rect.top+scrollY;
 let first=false;
 for(const p of particles){
  if(p.fallen)continue;
  const x=cx+p.x*scale,y=cy+p.y*scale;
  if(Math.hypot(x-localX,y-localY)>r)continue;
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
   if(Math.hypot(x-localX,y-localY)>r)continue;
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
  spriteDirty=true;renderOrb();
  if(reduce){const count=falling.length;for(let i=0;i<count;i++){if(!falling[i].resting){falling[i].py=floor-falling[i].radius;falling[i].vx=falling[i].vy=0;falling[i].resting=true;}}paintDebris();}
  else animateFalls();
 }
}
region.addEventListener("pointerdown",e=>{
 if(e.button!==0&&e.pointerType==="mouse")return;
 const b=region.getBoundingClientRect();
 pointerTrail={id:e.pointerId,x:e.clientX-b.left,y:e.clientY-b.top,dragged:false};
 if(region.setPointerCapture)region.setPointerCapture(e.pointerId);
},{passive:true});
region.addEventListener("pointermove",e=>{
 if(!pointerTrail||e.pointerId!==pointerTrail.id)return;
 const b=region.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
 const dx=x-pointerTrail.x,dy=y-pointerTrail.y,dist=Math.hypot(dx,dy);
 if(dist>4){
  if(!pointerTrail.dragged){pointerTrail.dragged=true;rebuildObstacles();}
  const steps=Math.max(1,Math.ceil(dist/9));
  for(let n=1;n<=steps;n++)dragDotBrush(pointerTrail.x+dx*n/steps,pointerTrail.y+dy*n/steps);
  e.preventDefault();
 }
 pointerTrail.x=x;pointerTrail.y=y;
},{passive:false});
function endDotDrag(e){
 if(!pointerTrail||e.pointerId!==pointerTrail.id)return;
 if(pointerTrail.dragged)ignoreNextClick=true;
 pointerTrail=null;
 if(region.hasPointerCapture?.(e.pointerId))region.releasePointerCapture(e.pointerId);
}
region.addEventListener("pointerup",endDotDrag);
region.addEventListener("pointercancel",endDotDrag);
region.addEventListener("click",event=>{
 if(ignoreNextClick){ignoreNextClick=false;event.vyonParticleHandled=true;return;}
 const r=region.getBoundingClientRect();
 if(activateLogo(event.clientX-r.left,event.clientY-r.top))event.vyonParticleHandled=true;
});
// Click truly empty page space to form a short-lived dot cloud that collapses
// immediately into independent particles. Keep native controls and text untouched.
function burstFromEmptySpace(clientX,clientY){
 const count=38,worldX=clientX+scrollX,worldY=clientY+scrollY;
 const time=performance.now(),start=falling.length;
 rebuildObstacles();
 for(let i=0;i<count;i++){
  const j=hash(time*.00001+i*14.13,i*17.7);
  const angle=(i+j*.6)*Math.PI*2/count;
  const radius=Math.sqrt((i+.4)/count)*(18+10*j);
  const x=Math.cos(angle)*radius,y=Math.sin(angle)*radius;
  const p={x:x/30,y:y/30,j};
  releaseDot(p,worldX,worldY,x,y,0,0,1.1+j*.8,true);
  const dot=falling[falling.length-1];
  // No intact/static dot artwork: every spawned point is already in motion.
  dot.vx+=Math.cos(angle)*(25+65*j);
  dot.vy=Math.max(25,dot.vy+130+85*j);
 }
 if(reduce){
  for(let i=start;i<falling.length;i++){
   const p=falling[i];p.py=floor-p.radius;p.vx=0;p.vy=0;p.resting=true;
  }
 }
 paintDebris();
 if(!reduce)animateFalls();
}
document.addEventListener("click",event=>{
 if(event.vyonParticleHandled||event.defaultPrevented||event.button!==0||event.detail===0)return;
 const target=event.target;
 if(!(target instanceof Element))return;
 // Page backgrounds and blank layout regions are interactive; buttons,
 // links, prose, form controls, media and dialogs keep their normal behavior.
 if(target.closest('a,button,input,select,textarea,label,summary,[contenteditable],[role="link"],[role="menuitem"],[role="dialog"],[aria-modal="true"],.command-overlay,.shot-lightbox'))return;
 if(target.closest('[role="button"]')&&!target.closest("#orb-region"))return;
 if(!target.closest("#orb-region")&&target.closest('h1,h2,h3,h4,h5,h6,p,li,strong,small,em,span,blockquote,kbd,svg,img,canvas'))return;
 if(window.getSelection()?.toString().trim())return;
 if(event.clientX<0||event.clientY<0||event.clientX>innerWidth||event.clientY>innerHeight)return;
 burstFromEmptySpace(event.clientX,event.clientY);
});
region.addEventListener("keydown",event=>{
 if(event.key!=="Enter"&&event.key!==" ")return;
 event.preventDefault();
 const shown=clearedSpots.find(s=>s.heartAt!==null);
 if(shown){const at=locateSpot(shown);dropHeart(shown,at.x,at.y);return;}
 const waiting=clearedSpots.find(s=>s.heartAt===null);
 if(waiting){makeHeart(waiting);return;}
 const remaining=particles.filter(p=>!p.fallen);
 if(!remaining.length)return;
 const chosen=remaining[Math.floor(remaining.length*.5)];
 const scale=orbScale*358/360;
 activateLogo(w*.5+chosen.x*scale,h*.49+chosen.y*scale);
});
window.addEventListener("resize",()=>{
 resizeOrb();resizeDebris();if(falling.length)rebuildObstacles();
},{passive:true});
window.addEventListener("scroll",()=>paintDebris(),{passive:true});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&falling.some(p=>!p.resting))animateFalls();});
resizeOrb();resizeDebris();loadIconParticles();
// Dotted button surfaces preserve the first click's normal link/button action.
// A second activation drops only their decorative particles into the shared physics.
document.querySelectorAll(".btn,.platform-download,.social-card,.header-github,.theme-chip,.screenshot-tab,.eq-toggle,.command-trigger,.mobile-menu-btn").forEach(control=>{
 control.classList.add("vyon-dot-button");
 let activations=0;
 control.addEventListener("click",event=>{
  activations++;
  if(activations!==2)return;
  if(control.matches("a[href]"))event.preventDefault();
  const b=control.getBoundingClientRect();
  if(b.width<10||b.height<8)return;
  rebuildObstacles();
  for(let y=7;y<b.height-4;y+=9)for(let x=7;x<b.width-4;x+=9){
   const seed=hash(x+b.left,y+b.top);
   if(seed<.24)continue;
   const p={x:(x/b.width)*2-1,y:(y/b.height)*2-1,j:seed};
   releaseDot(p,b.left+scrollX,b.top+scrollY,x,y,b.width*.5,b.height*.5,
    1.1+seed*.6,true);
  }
  control.classList.add("vyon-dots-collapsed");
  if(reduce){
   for(const p of falling)if(!p.resting){p.py=floor-p.radius;p.vx=p.vy=0;p.resting=true;}
   paintDebris();
  }else animateFalls();
 },{capture:true});
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
chooseShot("home");
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
(async()=>{
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
})();

})();