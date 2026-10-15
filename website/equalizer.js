/* vyon interactive EQ preview — browser-only settings, no APK audio integration. */
(() => {
"use strict";
const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>[...document.querySelectorAll(selector)];
const section=$("#equalizer");
if(!section)return;

const storageKey="vyon-eq-preview-v1";
const limits={min:-10,max:10};
const names=["bass","mids","treble"];
const frequencies=["31 Hz","125 Hz","1 kHz","4 kHz","16 kHz"];
const presetBands={
 flat:[0,0,0,0,0],
 signature:[2,2,0,4,4],
 bass:[7,5,1,0,0],
 treble:[0,0,0,5,7],
 warm:[4,3,2,1,0]
};
const presetNames={flat:"Flat",signature:"vyon Signature",bass:"Bass Boost",treble:"Treble Boost",warm:"Warm",custom:"Custom"};
const circle=$("#vqe-circle"),basic=$("#vqe-basic"),advanced=$("#vqe-advanced");
const fill=$("#vqe-wave-fill"),line=$("#vqe-wave-line");
const advancedFill=$("#vqe-adv-fill"),advancedLine=$("#vqe-adv-line");
const modeButtons=$$("[data-vqe-mode]"),presetButtons=$$("[data-vqe-preset]");
const basicSliders=$$("[data-vqe-basic]"),bandSliders=$$("[data-vqe-band]");
const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp=n=>Math.min(limits.max,Math.max(limits.min,Math.round(Number(n)||0)));
const format=n=>(n>0?"+":"")+n+" dB";
let bands=presetBands.signature.slice(),display=bands.slice();
let preset="signature",mode="basic",animation=0;
let activeAxis=null;
function getRanges(values){
 return {
  bass:(values[0]+values[1])/2,
  mids:values[2],
  treble:(values[3]+values[4])/2
 };
}
function saveState(){
 try{localStorage.setItem(storageKey,JSON.stringify({bands,preset,mode}));}catch{}
}
try{
 const stored=JSON.parse(localStorage.getItem(storageKey)||"null");
 if(stored&&Array.isArray(stored.bands)&&stored.bands.length===5&&stored.bands.every(Number.isFinite)){
  bands=stored.bands.map(clamp);
  display=bands.slice();
  preset=Object.hasOwn(presetBands,stored.preset)&&bands.every((v,i)=>v===presetBands[stored.preset][i])?stored.preset:"custom";
  mode=stored.mode==="advanced"?"advanced":"basic";
 }
}catch{}
function setPreset(which){
 if(!Object.hasOwn(presetBands,which))return;
 bands=presetBands[which].slice();
 preset=which;
 saveState();
 syncControls();
 requestRender();
}
function setBasic(key,value){
 const v=clamp(value);
 if(key==="bass"){bands[0]=v;bands[1]=v;}
 else if(key==="mids"){bands[2]=v;}
 else if(key==="treble"){bands[3]=v;bands[4]=v;}
 else return;
 preset="custom";saveState();syncControls();
 requestRender();
}
function setBand(index,value){
 if(!Number.isInteger(index)||index<0||index>=5)return;
 bands[index]=clamp(value);
 preset="custom";saveState();syncControls();
 requestRender();
}
function changeMode(next){
 if(!["basic","advanced"].includes(next))return;
 mode=next;
 basic.hidden=mode!=="basic";
 advanced.hidden=mode!=="advanced";
 modeButtons.forEach(b=>{
  const active=b.dataset.vqeMode===mode;
  b.classList.toggle("is-active",active);
  b.setAttribute("aria-pressed",String(active));
 });
 $("#vqe-footer-detail").textContent=mode==="basic"?"Three ranges · −10 to +10 dB":"Five bands · −10 to +10 dB";
 saveState();
 requestRender();
}
function syncControls(){
 const values=getRanges(bands);
 basicSliders.forEach(input=>{
  const key=input.dataset.vqeBasic,val=Math.round(values[key]);
  input.value=val;
  input.setAttribute("aria-valuetext",format(val));
  $("#vqe-value-"+key).textContent=format(val);
  input.style.setProperty("--vqe-fill",((val+10)*5)+"%");
 });
 bandSliders.forEach(input=>{
  const i=Number(input.dataset.vqeBand),val=bands[i];
  input.value=val;input.setAttribute("aria-valuetext",format(val));
  $("#vqe-band-output-"+i).textContent=format(val);
 });
 presetButtons.forEach(b=>{
  const active=b.dataset.vqePreset===preset;
  b.classList.toggle("is-active",active);
  b.setAttribute("aria-pressed",String(active));
 });
 $("#vqe-preset-title").textContent=presetNames[preset];
 $("#vqe-curve-label").textContent=presetNames[preset];
 $("#vqe-live-status").textContent="Bass "+format(Math.round(values.bass))+", Mids "+format(Math.round(values.mids))+", Treble "+format(Math.round(values.treble))+". "+presetNames[preset]+" curve.";
}
presetButtons.forEach(b=>b.addEventListener("click",()=>setPreset(b.dataset.vqePreset)));
modeButtons.forEach(b=>b.addEventListener("click",()=>changeMode(b.dataset.vqeMode)));
basicSliders.forEach(input=>input.addEventListener("input",()=>setBasic(input.dataset.vqeBasic,input.value)));
bandSliders.forEach(input=>input.addEventListener("input",()=>setBand(Number(input.dataset.vqeBand),input.value)));

const axes=[
 {name:"mids",angle:-Math.PI/2},
 {name:"bass",angle:Math.PI/6},
 {name:"treble",angle:5*Math.PI/6}
];
const baseRadius=52,gainScale=4;
const radian=Math.PI/180;
function position(axis,values){
 const range=getRanges(values)[axis.name];
 const radius=baseRadius+gainScale*range;
 return [160+Math.cos(axis.angle)*radius,160+Math.sin(axis.angle)*radius];
}
const xfmt=n=>Number(n.toFixed(2));
function wavePath(values){
 const ranges=getRanges(values);
 const order=[ranges.mids,ranges.bass,ranges.treble,ranges.mids];
 let d="";
 const segments=3,samples=45,step=Math.PI*2/3;
 for(let i=0;i<segments*samples;i++){
  const seg=Math.floor(i/samples),fraction=i%samples/samples;
  const eased=fraction*fraction*(3-2*fraction);
  const gain=order[seg]+(order[seg+1]-order[seg])*eased;
  const theta=-Math.PI/2+(seg+fraction)*step;
  const radius=baseRadius+gainScale*gain;
  const x=xfmt(160+Math.cos(theta)*radius),y=xfmt(160+Math.sin(theta)*radius);
  d+=(i===0?"M":" L")+x+" "+y;
 }
 return d+" Z";
}
function advCurvePath(values){
 const x=[14,112,210,308,406];
 const y=values.map(v=>xfmt(78-v*4.7));
 let d="M"+x[0]+" "+y[0];
 for(let i=0;i<4;i++){
  const dist=(x[i+1]-x[i])/3;
  d+=" C"+xfmt(x[i]+dist)+" "+y[i]+", "+xfmt(x[i+1]-dist)+" "+y[i+1]+", "+x[i+1]+" "+y[i+1];
 }
 return d;
}
function render(){
 const d=wavePath(display);
 fill.setAttribute("d",d);line.setAttribute("d",d);
 axes.forEach(axis=>{
  const [x,y]=position(axis,display);
  const el=$("#vqe-handle-"+axis.name);
  el.setAttribute("cx",xfmt(x));
  el.setAttribute("cy",xfmt(y));
 });
 const curve=advCurvePath(display);
 advancedLine.setAttribute("d",curve);
 advancedFill.setAttribute("d",curve+" L406 141 L14 141 Z");
}
function requestRender(){
 if(reduce){display=bands.slice();render();return;}
 if(animation)return;
 animation=requestAnimationFrame(tick);
}
function tick(){
 animation=0;
 let delta=0;
 for(let i=0;i<5;i++){
  const diff=bands[i]-display[i];
  display[i]+=diff*.22;
  if(Math.abs(diff)<.018)display[i]=bands[i];
  else delta+=Math.abs(diff);
 }
 render();
 if(delta>.018&&section.isConnected)animation=requestAnimationFrame(tick);
}
// Pointer interaction with the original three-axis ring.
function coords(event){
 const rect=circle.getBoundingClientRect();
 // SVG viewBox is square with object-fit contain; CSS keeps it square.
 const scale=320/rect.width;
 return [(event.clientX-rect.left)*scale,(event.clientY-rect.top)*scale];
}
function nearestAxis(x,y){
 const theta=Math.atan2(y-160,x-160);
 let closest=axes[0],distance=Infinity;
 for(const axis of axes){
  const difference=Math.abs(Math.atan2(Math.sin(theta-axis.angle),Math.cos(theta-axis.angle)));
  if(difference<distance){distance=difference;closest=axis;}
 }
 return closest.name;
}
function moveHandle(event){
 if(!activeAxis)return;
 const [x,y]=coords(event);
 const radius=Math.hypot(x-160,y-160);
 const value=clamp((radius-baseRadius)/gainScale);
 setBasic(activeAxis,value);
}
circle.addEventListener("pointerdown",event=>{
 if(event.button!==undefined&&event.button!==0)return;
 const [x,y]=coords(event);
 if(Math.hypot(x-160,y-160)<20)return;
 const handle=event.target.closest("[data-vqe-handle]");
 activeAxis=handle?.dataset.vqeHandle||nearestAxis(x,y);
 if(circle.setPointerCapture)circle.setPointerCapture(event.pointerId);
 circle.classList.add("is-dragging");
 moveHandle(event);
 event.preventDefault();
});
circle.addEventListener("pointermove",event=>{if(activeAxis)moveHandle(event);});
function endDrag(event){
 if(!activeAxis)return;
 activeAxis=null;
 circle.classList.remove("is-dragging");
 if(circle.hasPointerCapture?.(event.pointerId))circle.releasePointerCapture(event.pointerId);
}
circle.addEventListener("pointerup",endDrag);
circle.addEventListener("pointercancel",endDrag);
circle.addEventListener("lostpointercapture",()=>{activeAxis=null;circle.classList.remove("is-dragging");});
syncControls();
changeMode(mode);
render();
})();
