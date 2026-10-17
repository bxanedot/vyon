/* Optional branded Rive motion slot. No Rive assets are fabricated:
   when a genuine .riv export is provided, set data-rive-src to its local path.
   The original particle canvas is always the functional fallback. */
(() => {
 "use strict";
 const mount=document.querySelector("[data-rive-motion]");
 if(!mount)return;
 const src=mount.dataset.riveSrc?.trim();
 if(!src || !/^\/[a-zA-Z0-9/_-]+\.riv$/.test(src))return;
 if(window.matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData)return;
 const canvas=mount.querySelector("canvas");
 if(!canvas)return;
 const observer=new IntersectionObserver(async entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  observer.disconnect();
  try {
   const check=await fetch(src,{method:"HEAD",cache:"force-cache"});
   if(!check.ok)return;
   const {Rive,Layout,Fit,Alignment}=await import("https://esm.sh/@rive-app/canvas-lite@2.44.2");
   let instance;
   instance=new Rive({
    src,canvas,
    stateMachines:mount.dataset.riveStateMachine||undefined,
    autoplay:true,
    layout:new Layout({fit:Fit.Contain,alignment:Alignment.Center}),
    onLoad:()=>{
     instance.resizeDrawingSurfaceToCanvas();
     mount.classList.add("rive-ready");
    },
    onLoadError:()=>{mount.classList.remove("rive-ready");instance?.cleanup()}
   });
   const resize=new ResizeObserver(()=>instance.resizeDrawingSurfaceToCanvas());
   resize.observe(canvas);
   document.addEventListener("visibilitychange",()=>{
    if(document.hidden)instance.pause();else instance.play();
   });
   window.addEventListener("pagehide",()=>{resize.disconnect();instance.cleanup()},{once:true});
  }catch(error){
   console.warn("Rive asset unavailable; the original Vyon particle lab remains active.",error);
  }
 },{rootMargin:"100px"});
 observer.observe(mount);
})();