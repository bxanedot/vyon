/* Aggregated visit and presence counters. No IP collection or third-party client key. */
(()=>{
"use strict";
const live=document.getElementById("vyon-live-count");
const total=document.getElementById("vyon-total-count");
if(!live||!total)return;
const endpoint="https://hehzkmlkrsfbsmqtzfut.supabase.co/functions/v1/vyon-web-counters";
const key="vyon-visit-session-v1";
let id;
try{
 id=sessionStorage.getItem(key);
 if(!id||!/^[0-9a-f-]{36}$/i.test(id)){
  id=crypto.randomUUID();
  sessionStorage.setItem(key,id);
 }
}catch{id=crypto.randomUUID();}
let running=false;
async function refresh(){
 if(running||document.hidden)return;
 running=true;
 try{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7500);
  let response;
  try{
   response=await fetch(endpoint,{method:"POST",mode:"cors",headers:{"content-type":"application/json"},
    body:JSON.stringify({session:id}),cache:"no-store",signal:controller.signal});
  }finally{clearTimeout(timer);}
  if(!response.ok)throw Error("Counters unavailable");
  const data=await response.json();
  if(!Number.isSafeInteger(data.live)||!Number.isSafeInteger(data.total))throw Error("Invalid counts");
  live.textContent=data.live.toLocaleString();
  total.textContent=data.total.toLocaleString();
 }catch{
  live.textContent="—";total.textContent="—";
 }finally{running=false;}
}
refresh();
const timer=setInterval(refresh,30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh();});
window.addEventListener("pagehide",()=>clearInterval(timer),{once:true});
})();
