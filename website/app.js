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
function openPalette(){focusBefore=document.activeElement;overlay.hidden=false;input.value="";items.forEach(x=>x.hidden=false);highlight(0);document.body.style.overflow="hidden";input.focus();}
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
mobBtn.addEventListener("click",()=>{const opened=mobBtn.getAttribute("aria-expanded")!=="true";mobBtn.setAttribute("aria-expanded",String(opened));mob.hidden=!opened;});
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
     {duration:750,easing:"cubic-bezier(.22,1,.36,1)"});
  }
 }),{threshold:.08,rootMargin:"0px 0px -35px 0px"});
 $$(".reveal").forEach(x=>obs.observe(x));
}else $$(".reveal").forEach(x=>x.classList.add("is-visible"));
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
const particles=[],falling=[];
const tones={
 violet:["255,151,165","194,154,239","123,205,255"],
 acid:["47,190,128","22,162,143","46,221,190"],
 coral:["255,145,119","255,190,127","250,154,190"],
 ice:["75,205,242","91,155,250","133,239,249"],
 blood:["255,117,129","228,61,79","150,19,44"]
};
let w=0,h=0,orbScale=1,spriteDirty=true,active=false,lastTime=0;
const sprite=document.createElement("canvas");
sprite.width=720;sprite.height=720;
const spr=sprite.getContext("2d",{alpha:true});
const debris=document.createElement("canvas");
debris.className="vyon-falling-dots";
debris.setAttribute("aria-hidden","true");
document.body.appendChild(debris);
const debrisCtx=debris.getContext("2d",{alpha:true});
let vw=0,vh=0,ratio=1,obstacleCells=new Map(),floor=0;
const gridSize=96;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};
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
  if(next.length>250){particles.splice(0,particles.length,...next);spriteDirty=true;renderOrb();}
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
    const box={l:r.left+scrollX-2,r:r.right+scrollX+2,t:r.top+scrollY-2,b:r.bottom+scrollY+2};
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
function paintDebris(){
 if(!debrisCtx)return;
 debrisCtx.clearRect(0,0,vw,vh);
 for(const p of falling){
  const x=p.px-scrollX,y=p.py-scrollY;
  if(y<-8||y>vh+8||x<-8||x>vw+8)continue;
  debrisCtx.fillStyle=dotColor(p);
  debrisCtx.beginPath();debrisCtx.arc(x,y,p.radius,0,Math.PI*2);debrisCtx.fill();
 }
}
function advanceDebris(dt){
 // Two substeps for stable contact with narrow lines of text.
 const steps=2,step=dt/steps;
 for(let n=0;n<steps;n++){
  for(const p of falling){
   if(p.resting)continue;
   const prevX=p.px,prevY=p.py;
   p.vy=Math.min(1950,p.vy+1800*step);
   p.px+=p.vx*step;p.py+=p.vy*step;
   if(p.px<p.radius){p.px=p.radius;p.vx=Math.abs(p.vx)*.55+9;}
   if(p.px>document.documentElement.clientWidth-p.radius){p.px=document.documentElement.clientWidth-p.radius;p.vx=-Math.abs(p.vx)*.55-9;}
   // Words provide genuine DOM-derived hitboxes, rather than an arbitrary ground plane.
   for(const b of getNearby(p.px,p.py)){
    if(p.px+p.radius<b.l||p.px-p.radius>b.r||p.py+p.radius<b.t||p.py-p.radius>b.b)continue;
    if(prevY+p.radius<=b.t+4&&p.vy>=0){
     p.py=b.t-p.radius;
     p.vy=-Math.abs(p.vy)*.19;
     // Slide off words, then continue descending toward the footer.
     p.vx+=((p.j>.5)?1:-1)*52;
     p.vx=Math.max(-240,Math.min(240,p.vx));
     break;
    }
    if(prevX+p.radius<=b.l&&p.vx>0){p.px=b.l-p.radius;p.vx=-Math.abs(p.vx)*.6;break;}
    if(prevX-p.radius>=b.r&&p.vx<0){p.px=b.r+p.radius;p.vx=Math.abs(p.vx)*.6;break;}
   }
   if(p.py>=floor-p.radius){
    p.py=floor-p.radius;p.vy=-Math.abs(p.vy)*.22;p.vx*=.74;
    if(Math.abs(p.vy)<36){p.vy=0;p.vx=0;p.resting=true;}
   }
   p.vx*=Math.pow(.997,step*60);
  }
 }
}
function tick(now){
 if(!active)return;
 const dt=lastTime?Math.min(.034,(now-lastTime)/1000):.016;
 lastTime=now;
 if(!document.hidden)advanceDebris(dt);
 paintDebris();
 if(falling.some(p=>!p.resting)&&!document.hidden)requestAnimationFrame(tick);
 else {active=false;lastTime=0;}
}
function animateFalls(){
 if(active)return;
 active=true;lastTime=0;
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
  const angle=Math.atan2(y-localY,x-localX);
  const kick=Math.max(0,1-dist/cluster);
  falling.push({
   x:p.x,y:p.y,j:p.j,radius:1.1+p.j*.9,
   px:worldX+x,py:worldY+y,
   vx:Math.cos(angle)*kick*125+(p.j-.5)*35,
   vy:-kick*(55+70*p.j),resting:false
  });
 }
 if(!count)return false;
 spriteDirty=true;renderOrb();
 if(reduce){
  for(const p of falling){p.py=floor-p.radius;p.vy=0;p.vx=0;p.resting=true;}
  paintDebris();
 }else animateFalls();
 return true;
}
region.addEventListener("click",event=>{
 const r=region.getBoundingClientRect();
 dropCluster(event.clientX-r.left,event.clientY-r.top);
});
region.addEventListener("keydown",event=>{
 if(event.key!=="Enter"&&event.key!==" ")return;
 event.preventDefault();
 const remaining=particles.filter(p=>!p.fallen);
 if(!remaining.length)return;
 const chosen=remaining[Math.floor(remaining.length*.5)];
 const scale=orbScale*358/360;
 dropCluster(w*.5+chosen.x*scale,h*.49+chosen.y*scale);
});
window.addEventListener("resize",()=>{
 resizeOrb();resizeDebris();if(falling.length)rebuildObstacles();
},{passive:true});
window.addEventListener("scroll",paintDebris,{passive:true});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&falling.some(p=>!p.resting))animateFalls();});
resizeOrb();resizeDebris();loadIconParticles();
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