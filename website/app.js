/* Vyon site. Its audio demo uses local Web Audio oscillators; no streams or API keys. */
(() => {
"use strict";
const $=(s,scope=document)=>scope.querySelector(s), $$=(s,scope=document)=>[...scope.querySelectorAll(s)];
const root=document.documentElement;
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
$("#copyright-year").textContent=new Date().getFullYear();
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
const progressBar=$("#reading-progress"),siteHeader=$("#site-header"),navLinks=$(".nav-desktop a");
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
 ["experience","details","downloads"].forEach(id=>{const section=document.getElementById(id);if(section)sectionObserver.observe(section);});
}
// Accent palette
function theme(color){
 if(!["violet","acid","coral","ice"].includes(color))return;
 root.dataset.accent=color;
 $$("[data-color]").forEach(b=>{const on=b.dataset.color===color;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on));});
 try{localStorage.setItem("vyon-accent",color);}catch{}
 requestAnimationFrame(renderOrb);
}
$("[data-color]").forEach(b=>b.addEventListener("click",()=>theme(b.dataset.color)));
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
// Morph the particles into three distinct formations.
$("[data-orb-shape]").forEach(btn=>btn.addEventListener("click",()=>{
 orbShape=btn.dataset.orbShape;root.dataset.orbForm=orbShape;
 $("[data-orb-shape]").forEach(el=>{const active=el===btn;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));});
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
 $(".feature-card").forEach(card=>card.addEventListener("pointermove",e=>{
  const rect=card.getBoundingClientRect();
  card.style.setProperty("--mx",((e.clientX-rect.left)/rect.width*100).toFixed(1)+"%");
  card.style.setProperty("--my",((e.clientY-rect.top)/rect.height*100).toFixed(1)+"%");
 }));
}
// Original synthesized loops
const tracks=[
 {name:"Afterglow",roots:[48,53,45,50],melody:[72,76,79,76,74,72,69,72],wave:"sine",art:"album-1"},
 {name:"Blue Hour",roots:[50,46,43,48],melody:[74,77,81,77,76,74,70,74],wave:"triangle",art:"album-2"},
 {name:"Nightdrive",roots:[45,41,48,43],melody:[69,72,76,79,76,72,67,72],wave:"sawtooth",art:"album-3"}
];
const D=24,STEP=.25,playButton=$("#play-btn"),playIcon=$("#play-icon"),pauseIcon=$("#pause-icon"),seek=$("#seek"),volume=$("#volume");
let index=0,playing=false,shuffle=false,repeat=false,position=0,audio=null,master=null,anchor=0,nextStep=0,playerFrame=0;
const liked=new Set(),voices=new Set();
const format=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
function sliderFill(s){s.style.setProperty("--fill",s.value+"%");}
function paintPosition(){seek.value=String(Math.max(0,Math.min(100,position/D*100)));sliderFill(seek);$("#elapsed").textContent=format(position);$("#duration").textContent=format(D);}
function paintPlayer(){
 $("#song-title").textContent=tracks[index].name;
 $("#song-artist").textContent="Vyon Sessions";
 $("#album-art").className="album-art "+tracks[index].art;
 $$(".queue-row").forEach((r,i)=>r.classList.toggle("is-active",i===index));
 $("#heart-btn").setAttribute("aria-pressed",String(liked.has(index)));
 $("#heart-btn").setAttribute("aria-label",liked.has(index)?"Unlike track":"Like track");
 playIcon.hidden=playing;pauseIcon.hidden=!playing;playButton.setAttribute("aria-label",playing?"Pause demo":"Play demo");
 $("#song-live").textContent=playing?"● PLAYING SYNTH DEMO":"● AUDIO DEMO";
 paintPosition();
}
function stopVoices(){
 if(!audio)return;
 const now=audio.currentTime;
 for(const v of voices){try{v.amp.gain.cancelScheduledValues(now);v.amp.gain.setTargetAtTime(0,now,.015);v.osc.stop(now+.09);}catch{}}
 voices.clear();
}
function note(midi,when,len,loud,type,cutoff){
 if(!audio)return;
 const osc=audio.createOscillator(),filter=audio.createBiquadFilter(),amp=audio.createGain();
 osc.type=type;osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),when);
 filter.type="lowpass";filter.frequency.setValueAtTime(cutoff,when);
 amp.gain.setValueAtTime(.0001,when);
 amp.gain.linearRampToValueAtTime(loud,when+Math.min(.045,len/5));
 amp.gain.setTargetAtTime(.0001,when+Math.min(len*.68,len-.06),Math.max(.06,len*.12));
 osc.connect(filter);filter.connect(amp);amp.connect(master);
 const voice={osc,amp};voices.add(voice);
 osc.onended=()=>{voices.delete(voice);osc.disconnect();filter.disconnect();amp.disconnect();};
 osc.start(when);osc.stop(when+len+.2);
}
function synth(step,when){
 const t=tracks[index],rootNote=t.roots[Math.floor(step/24)%4];
 if(step%24===0)[0,7,12,16].forEach(n=>note(rootNote+n,when,5.8,.021,"sine",900));
 if(step%4===0)note(rootNote-12,when,.5,.11,"sine",390);
 if(step%2===0){const n=t.melody[(Math.floor(step/2)+Math.floor(step/24))%t.melody.length];note(n,when,step%8===0?.72:.37,.07,t.wave,index===2?920:2400);}
 if(step%4===2)note(84+(step%12),when,.07,.012,"triangle",3900);
}
function nextRandom(){return(index+1+Math.floor(Math.random()*(tracks.length-1)))%tracks.length;}
function switchTrack(n){
 stopVoices();index=(n+tracks.length)%tracks.length;position=0;nextStep=0;
 if(audio)anchor=audio.currentTime;
 paintPlayer();
 if(playing){cancelAnimationFrame(playerFrame);playerFrame=requestAnimationFrame(tick);}
}
function tick(){
 if(!playing||!audio)return;
 position=Math.max(0,audio.currentTime-anchor);
 if(position>=D){switchTrack(repeat?index:shuffle?nextRandom():index+1);return;}
 const ahead=Math.min(D,position+.16);
 while(nextStep*STEP<ahead){synth(nextStep,audio.currentTime+Math.max(.005,nextStep*STEP-position));nextStep++;}
 paintPosition();playerFrame=requestAnimationFrame(tick);
}
async function start(){
 if(playing)return;
 try{
  const Ctor=window.AudioContext||window.webkitAudioContext;
  if(!Ctor)throw Error("Web Audio not supported");
  if(!audio){
   audio=new Ctor();master=audio.createGain();master.gain.value=Math.pow(Number(volume.value)/100,1.6)*.66;
   const comp=audio.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;
   master.connect(comp);comp.connect(audio.destination);
  }
  if(audio.state!=="running")await audio.resume();
 }catch(error){$("#song-live").textContent="● AUDIO UNAVAILABLE";console.warn(error);return;}
 playing=true;anchor=audio.currentTime-position;nextStep=Math.floor(position/STEP);cancelAnimationFrame(playerFrame);playerFrame=requestAnimationFrame(tick);paintPlayer();
}
function stop(){
 if(!playing)return;
 playing=false;position=Math.min(D,audio.currentTime-anchor);cancelAnimationFrame(playerFrame);stopVoices();paintPlayer();
}
playButton.addEventListener("click",()=>playing?stop():start());
$("#previous-btn").addEventListener("click",()=>switchTrack(position>3?index:index-1));
$("#next-btn").addEventListener("click",()=>switchTrack(shuffle?nextRandom():index+1));
$$(".queue-row").forEach(r=>r.addEventListener("click",()=>switchTrack(Number(r.dataset.track))));
seek.addEventListener("input",()=>{
 if(playing)stopVoices();
 position=Number(seek.value)/100*D;if(audio)anchor=audio.currentTime-position;
 nextStep=Math.floor(position/STEP);paintPosition();
});
volume.addEventListener("input",()=>{
 sliderFill(volume);
 if(master&&audio)master.gain.setTargetAtTime(Math.pow(Number(volume.value)/100,1.6)*.66,audio.currentTime,.02);
});
$("#heart-btn").addEventListener("click",()=>{liked.has(index)?liked.delete(index):liked.add(index);paintPlayer();});
$("#shuffle-btn").addEventListener("click",e=>{shuffle=!shuffle;e.currentTarget.setAttribute("aria-pressed",String(shuffle));});
$("#repeat-btn").addEventListener("click",e=>{repeat=!repeat;e.currentTarget.setAttribute("aria-pressed",String(repeat));});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing)stop();});
paintPlayer();
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
 caption.textContent="STABLE / OFFICIAL RELEASE";
 links.replaceChildren();
 const found=releases[0];
 if(found){
  title.textContent=found.name||found.tag_name||"Latest release";
  desc.textContent="Latest published stable version, from the official GitHub project.";
  meta.textContent="PUBLISHED / "+(found.published_at?new Date(found.published_at).toLocaleDateString().toUpperCase():"DATE UNKNOWN");
  const apk=(Array.isArray(found.assets)?found.assets:[]).find(a=>/\.apk$/i.test(a.name||"")&&/^https:\/\//.test(a.browser_download_url||""));
  if(apk)links.append(link("Download APK",apk.browser_download_url));
  links.append(link("Release details",found.html_url||releasePage,!!apk));
 }else{
  title.textContent=!loaded?"Checking GitHub releases…":releaseError?"Releases unavailable.":"No Stable release yet.";
  desc.textContent=!loaded?"Checking published build information. Download links will appear when available.":releaseError?"GitHub could not provide a public release feed. The repository might be private or the API temporarily unavailable. Sign in on GitHub if you have access.":"No publicly listed stable build yet. Follow the project on GitHub for updates.";
  meta.textContent=!loaded?"RELEASE STATUS / CHECKING":releaseError?"RELEASE STATUS / UNVERIFIED":"RELEASE STATUS / NOT PUBLISHED";
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
 }catch(err){releaseError=err;console.info("Vyon releases:",err.message);}
 finally{loaded=true;renderReleases();}
})();
})();