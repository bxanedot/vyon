/* vyon site. Original particle art, genuine screenshot slots, official stable-release status. */
(() => {
"use strict";
const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
const root=document.documentElement;
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
$("#copyright-year").textContent=new Date().getFullYear();
// Atmospheric pointer lighting, disabled for reduced motion.
const ambient=$("#ambient-pointer");
if(ambient&&!reduce&&window.matchMedia("(hover:hover) and (pointer:fine)").matches){
 let pending=false,mouseX=-1000,mouseY=-1000;
 document.addEventListener("pointermove",event=>{
  mouseX=event.clientX;mouseY=event.clientY;
  if(!pending){pending=true;requestAnimationFrame(()=>{ambient.style.transform="translate3d("+(mouseX-300)+"px,"+(mouseY-300)+"px,0)";pending=false;});}
 },{passive:true});
}
// The vyon waveform is traced from the user's original icon artwork.
// 30% = 18 degrees/second, 80% = 48 degrees/second at peak.
const spinButton=$("#vyon-spin-control"),spinImage=$("#vyon-spin-image");
let spinAngle=0,spinVelocity=18,spinBoost=0,spinPrevious=0;
const setIcon=()=>{
 const color=root.dataset.accent||"violet";
 const file=color==="acid"?"acid":color==="coral"?"coral":color==="ice"?"ice":"violet";
 if(spinImage)spinImage.src="/icons/originals/vyon-"+file+".svg";
};
if(spinImage){
 spinImage.draggable=false;
 setIcon();
 if(spinButton)spinButton.addEventListener("click",()=>{
  spinBoost=1;spinVelocity=48;
  spinButton.classList.remove("spin-boost");
  void spinButton.offsetWidth;
  spinButton.classList.add("spin-boost");
 });
 if(!reduce){
  const animateSpin=t=>{
   if(spinPrevious){
    const dt=Math.min(.06,(t-spinPrevious)/1000);
    spinBoost=Math.max(0,spinBoost-dt/3.2);
    const target=18+30*(spinBoost*spinBoost*(3-2*spinBoost));
    spinVelocity+=(target-spinVelocity)*Math.min(1,dt*8);
    spinAngle=(spinAngle+spinVelocity*dt)%360;
    spinImage.style.transform="rotate("+spinAngle+"deg)";
   }
   spinPrevious=t;
   if(!document.hidden)requestAnimationFrame(animateSpin);
   else spinPrevious=0;
  };
  requestAnimationFrame(animateSpin);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)requestAnimationFrame(animateSpin);});
 }
}
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
 setIcon();
 $$("[data-color]").forEach(b=>{const on=b.dataset.color===color;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=({violet:"#0b0918",acid:"#0b150a",coral:"#190d13",ice:"#08151b"})[color];
 try{localStorage.setItem("vyon-accent",color);}catch{}
 requestAnimationFrame(renderOrb);
}
$$("[data-color]").forEach(b=>b.addEventListener("click",()=>theme(b.dataset.color)));
try{theme(localStorage.getItem("vyon-accent")||"violet");}catch{theme("violet");}
// Orb canvas
const region=$("#orb-region"),canvas=$("#orb-canvas"),ctx=canvas.getContext("2d",{alpha:true});
let w=0,h=0,px=0,py=0,inside=false,orbVisible=true,orbTime=0,orbShape="orbit";
const points=[],total=reduce?750:1200;
for(let i=0;i<total;i++){
 const z=1-2*(i+.5)/total,phi=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-z*z);
 const x=Math.cos(phi)*r,y=Math.sin(phi)*r;points.push({x,y,z,sx:x,sy:y,sz:z,i,j:((i*137)%47)/47});
}
function resizeOrb(){
 const r=region.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 w=Math.max(r.width,1);h=Math.max(r.height,1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 ctx.setTransform(dpr,0,0,dpr,0,0);renderOrb();
}
function renderOrb(){
 if(!ctx||!w||!h)return;
 ctx.clearRect(0,0,w,h);
 const color=getComputedStyle(root).getPropertyValue("--accent-rgb").trim()||"169,157,255";
 const cx=w*.50,cy=h*.47,R=Math.min(w*.51,h*.425,365);
 const grad=ctx.createRadialGradient(cx,cy,R*.08,cx,cy,R*1.30);
 grad.addColorStop(0,"rgba("+color+",.12)");grad.addColorStop(.5,"rgba("+color+",.05)");grad.addColorStop(1,"rgba("+color+",0)");
 ctx.fillStyle=grad;ctx.beginPath();ctx.arc(cx,cy,R*1.3,0,Math.PI*2);ctx.fill();
 const a=reduce?.4:orbTime*.00011,ca=Math.cos(a),sa=Math.sin(a),tilt=-.27+(inside?py*.08:0),ct=Math.cos(tilt),st=Math.sin(tilt);
 const ordered=points.map(p=>{
  let tx=p.x,ty=p.y,tz=p.z;
  if(orbShape==="halo"){
   const theta=Math.atan2(p.y,p.x),minor=p.i*2.399963229728653,major=.78+.20*Math.cos(minor);
   tx=Math.cos(theta)*major;ty=Math.sin(theta)*major*.72;tz=Math.sin(minor)*.27;
  }else if(orbShape==="wave"){
   tx=p.x*.99;ty=p.y*.50+Math.sin(p.x*8+orbTime*.0015+p.z*2)*.20;
   tz=p.z*.29+Math.cos(p.y*7+orbTime*.0011)*.09;
  }else if(orbShape==="sound"){
   // Dot-based radial waveform: visually pulsing, no microphone or audio access.
   const angle=Math.atan2(p.y,p.x),radius=Math.hypot(p.x,p.y);
   const beat=.5+.5*Math.sin(orbTime*.0035);
   const spectrum=.12*Math.sin(angle*18+orbTime*.002)+.075*Math.sin(angle*31-orbTime*.0014);
   const distance=radius*(.65+beat*.06)+spectrum*(.55+.45*radius);
   tx=Math.cos(angle)*distance;
   ty=Math.sin(angle)*distance;
   tz=p.z*.25+Math.sin(angle*9+orbTime*.0025)*.045;
  }
  const ease=reduce?1:.095;
  p.sx+=(tx-p.sx)*ease;p.sy+=(ty-p.sy)*ease;p.sz+=(tz-p.sz)*ease;
  const xx=p.sx*ca-p.sz*sa,zz=p.sx*sa+p.sz*ca,yy=p.sy*ct-zz*st,z=p.sy*st+zz*ct,scale=1+z*.21;
  return{x:cx+xx*R*scale,y:cy+yy*R*scale,z,j:p.j};
 }).sort((a,b)=>a.z-b.z);
 const mx=cx+px*R*.3,my=cy+py*R*.3;
 for(const p of ordered){
  let x=p.x,y=p.y;
  if(inside){const dx=x-mx,dy=y-my,d=Math.hypot(dx,dy);if(d<115&&d>.01){const force=Math.pow(1-d/115,2)*34;x+=dx/d*force;y+=dy/d*force;}}
  const opacity=(.22+(p.z+1)*.27)*(.7+p.j*.36),size=(.65+(p.z+1)*.49)*(p.j>.96?1.8:1);
  ctx.fillStyle="rgba("+color+","+opacity.toFixed(3)+")";ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
 }
}
// Morph the particles into four distinct visual formations.
$$("[data-orb-shape]").forEach(btn=>btn.addEventListener("click",()=>{
 orbShape=btn.dataset.orbShape;root.dataset.orbForm=orbShape;
 $$("[data-orb-shape]").forEach(el=>{const active=el===btn;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));});
 if(reduce)renderOrb();
}));
function movePointer(e){
 const r=region.getBoundingClientRect();
 px=((e.clientX-r.left)/r.width-.5)*2;py=((e.clientY-r.top)/r.height-.5)*2;inside=true;
 if(reduce)renderOrb();
}
region.addEventListener("pointermove",movePointer);
region.addEventListener("pointerdown",movePointer);
region.addEventListener("pointerleave",()=>{px=py=0;inside=false;if(reduce)renderOrb();});
if("IntersectionObserver" in window)new IntersectionObserver(e=>orbVisible=e[0].isIntersecting).observe(region);
let lastFrame=0;
function orbLoop(t){requestAnimationFrame(orbLoop);if(!orbVisible||document.hidden||t-lastFrame<32)return;lastFrame=t;orbTime=t;renderOrb();}
window.addEventListener("resize",resizeOrb,{passive:true});
resizeOrb();if(!reduce)requestAnimationFrame(orbLoop);
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