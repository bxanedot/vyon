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
if("IntersectionObserver" in window&&!reduce){
 const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("is-visible");obs.unobserve(e.target);}}),{threshold:.08,rootMargin:"0px 0px -35px 0px"});
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
 ["experience","details","downloads","connect"].forEach(id=>{const section=document.getElementById(id);if(section)sectionObserver.observe(section);});
}
// Accent palette
function theme(color){
 if(!["violet","acid","coral","ice"].includes(color))return;
 root.dataset.accent=color;
 // The particle colors are derived from the active theme at render time.
 $$("[data-color]").forEach(b=>{const on=b.dataset.color===color;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=({violet:"#080808",acid:"#080808",coral:"#080808",ice:"#080808"})[color];
 try{localStorage.setItem("vyon-accent",color);}catch{}
 requestAnimationFrame(renderOrb);
}
$$("[data-color]").forEach(b=>b.addEventListener("click",()=>theme(b.dataset.color)));
try{theme(localStorage.getItem("vyon-accent")||"violet");}catch{theme("violet");}
// A single particle sculpture generated from the actual vyon icon silhouette.
// The original SVG is used only as an alpha mask: no image is laid over the dots.
const region=$("#orb-region"),canvas=$("#orb-canvas"),ctx=canvas.getContext("2d",{alpha:true});
const particles=[];
const tones={
 violet:["255,151,165","194,154,239","123,205,255"],
 acid:["47,190,128","22,162,143","46,221,190"],
 coral:["255,145,119","255,190,127","250,154,190"],
 ice:["75,205,242","91,155,250","133,239,249"]
};
let w=0,h=0,orbVisible=true,orbAngle=-.13,orbLast=0;
let orbVelocity=18,orbBoost=0;
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);};
function fillFallback(){
 // A vyon-like six-lobed ring while the SVG mask is loading or unavailable.
 particles.length=0;
 for(let i=0;i<425;i++){
  const theta=i/425*Math.PI*2;
  for(let band=0;band<4;band++){
   const radius=.64+.075*Math.cos(theta*7-.35)+.028*Math.sin(theta*5+.6)+(band-1.5)*.024;
   particles.push({x:Math.cos(theta)*radius,y:Math.sin(theta)*radius,j:hash(i,band)});
  }
 }
}
fillFallback();
function loadIconParticles(){
 const im=new Image();
 im.onload=()=>{
  const size=336,sample=document.createElement("canvas");
  sample.width=size;sample.height=size;
  const sctx=sample.getContext("2d",{willReadFrequently:true});
  if(!sctx)return;
  sctx.clearRect(0,0,size,size);
  sctx.drawImage(im,0,0,size,size);
  const pixels=sctx.getImageData(0,0,size,size).data;
  const next=[];
  for(let y=2;y<size-2;y+=3){
   for(let x=2;x<size-2;x+=3){
    const jitterX=(hash(x,y)-.5)*2.1,jitterY=(hash(y,x)-.5)*2.1;
    const xi=Math.min(size-1,Math.max(0,Math.round(x+jitterX)));
    const yi=Math.min(size-1,Math.max(0,Math.round(y+jitterY)));
    const alpha=pixels[(yi*size+xi)*4+3];
    if(alpha<90)continue;
    // Map the original full icon square into centered Cartesian coordinates.
    next.push({x:((xi+.5)/size-.5)*2,y:((yi+.5)/size-.5)*2,j:hash(x+13,y+37)});
   }
  }
  if(next.length>250){particles.splice(0,particles.length,...next);renderOrb();}
 };
 im.onerror=()=>renderOrb();
 im.src="/icons/originals/vyon-violet.svg";
}
function resizeOrb(){
 if(!ctx)return;
 const bounds=region.getBoundingClientRect();
 const ratio=Math.min(window.devicePixelRatio||1,2);
 w=Math.max(1,bounds.width);h=Math.max(1,bounds.height);
 canvas.width=Math.max(1,Math.round(w*ratio));
 canvas.height=Math.max(1,Math.round(h*ratio));
 ctx.setTransform(ratio,0,0,ratio,0,0);
 renderOrb();
}
function renderOrb(){
 if(!ctx||!w||!h)return;
 ctx.clearRect(0,0,w,h);
 const palette=tones[root.dataset.accent]||tones.violet;
 const centerX=w*.5,centerY=h*.49;
 const radius=Math.min(w*.43,h*.42,320);
 const angle=orbAngle*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle);
 for(const p of particles){
  const x=p.x*ca-p.y*sa;
  const y=p.x*sa+p.y*ca;
  const index=Math.min(2,Math.max(0,Math.floor((p.x+p.y+2)/4*3)));
  const opacity=(.50+.43*p.j).toFixed(3);
  ctx.fillStyle="rgba("+palette[index]+","+opacity+")";
  ctx.beginPath();
  ctx.arc(centerX+x*radius,centerY+y*radius,.9+p.j*.65,0,Math.PI*2);
  ctx.fill();
 }
}
function accelerateIcon(){
 orbBoost=1;
 orbVelocity=48; // 80% speed, relative to an intentionally calm 60 deg/s maximum
 if(reduce){orbAngle=(orbAngle+15)%360;renderOrb();}
}
region.addEventListener("click",accelerateIcon);
region.addEventListener("keydown",e=>{
 if(e.key==="Enter"||e.key===" "){e.preventDefault();accelerateIcon();}
});
if("IntersectionObserver" in window){
 new IntersectionObserver(entries=>{orbVisible=entries[0].isIntersecting;orbLast=0;},{threshold:.01}).observe(region);
}
function animateOrb(now){
 requestAnimationFrame(animateOrb);
 if(reduce||document.hidden||!orbVisible){orbLast=0;return;}
 if(orbLast){
  const dt=Math.min(.06,(now-orbLast)/1000);
  orbBoost=Math.max(0,orbBoost-dt/3.2);
  const ease=orbBoost*orbBoost*(3-2*orbBoost);
  const target=18+30*ease;
  orbVelocity+=(target-orbVelocity)*Math.min(1,dt*8);
  orbAngle=(orbAngle+orbVelocity*dt)%360;
  renderOrb();
 }
 orbLast=now;
}
window.addEventListener("resize",resizeOrb,{passive:true});
resizeOrb();
loadIconParticles();
if(!reduce)requestAnimationFrame(animateOrb);
// Feature-card visualizer
const eqBars=$$("#eq-bars i"),eqLabel=$("#eq-mode-label");let mode=0,eqFrame=0;
function eqPulse(){eqFrame++;eqBars.forEach((bar,i)=>{let value=mode?.2+.6*Math.abs(Math.cos(i*.49+eqFrame*.37)):.14+.56*Math.abs(Math.sin(i*.39+eqFrame*.22));bar.style.height=Math.round(value*100)+"%";});}
$("#eq-toggle").addEventListener("click",()=>{mode=1-mode;eqLabel.textContent=mode?"PULSE":"DRIFT";eqPulse();});
if(!reduce){eqPulse();setInterval(()=>{if(!document.hidden)eqPulse();},410);}
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
// Show official stable GitHub releases only; never invent APK downloads.
const repo="bxanedot/vyon",releasePage="https://github.com/"+repo+"/releases";
const title=$("#release-title"),desc=$("#release-description"),caption=$("#release-caption"),meta=$("#release-meta"),links=$("#download-links");
let releases=[],releaseError=null,loaded=false;
function link(text,href,secondary=false){
 const a=document.createElement("a");a.className=secondary?"btn btn-ghost":"btn btn-primary";
 a.href=href;a.target="_blank";a.rel="noopener noreferrer";
 const arrow=document.createElement("span");arrow.className="btn-arrow";arrow.textContent="↗";
 a.append(document.createTextNode(text+" "),arrow);return a;
}
function renderReleases(){
 caption.textContent="ANDROID / STABLE APK";
 links.replaceChildren();
 const found=releases.find(r=>Array.isArray(r.assets)&&r.assets.some(a=>/\.apk$/i.test(a.name||"")&&/^https:\/\//.test(a.browser_download_url||"")));
 const apk=found&&found.assets.find(a=>/\.apk$/i.test(a.name||"")&&/^https:\/\//.test(a.browser_download_url||""));
 if(apk){
  title.textContent=found.name||found.tag_name||"vyon for Android";
  desc.textContent="Official stable Android APK from vyon GitHub releases.";
  meta.textContent="PUBLISHED / "+(found.published_at?new Date(found.published_at).toLocaleDateString().toUpperCase():"DATE UNKNOWN");
  links.append(link("Download Android APK",apk.browser_download_url));
  links.append(link("Release notes",found.html_url||releasePage,true));
 }else{
  title.textContent=!loaded?"Checking APK releases…":releaseError?"APK releases unavailable.":"No stable APK published yet.";
  desc.textContent=!loaded?"Checking GitHub for a published Android APK.":releaseError?"GitHub may be private or temporarily unavailable. View releases on GitHub if you have access.":"No public stable Android APK is listed yet. Check official GitHub releases for updates.";
  meta.textContent=!loaded?"APK STATUS / CHECKING":releaseError?"APK STATUS / UNVERIFIED":"APK STATUS / NOT PUBLISHED";
  links.append(link("View GitHub releases",releasePage));
 }
}
renderReleases();
(async()=>{
 try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);let response;
  try{response=await fetch("https://api.github.com/repos/"+repo+"/releases?per_page=75",{headers:{Accept:"application/vnd.github+json"},signal:controller.signal});}
  finally{clearTimeout(timer);}
  if(!response.ok)throw Error("GitHub HTTP "+response.status);
  const body=await response.json();if(!Array.isArray(body))throw Error("Unexpected response");
  releases=body.filter(r=>!r.draft&&!r.prerelease&&!/nightly|canary|dev.build/i.test(String(r.name||"")+" "+String(r.tag_name||"")));
 }catch(err){releaseError=err;console.info("vyon releases:",err.message);}
 finally{loaded=true;renderReleases();}
})();
})();