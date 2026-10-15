/* vyon Listen Together — WebSocket room client; the browser fetches audio from its source. */
(()=>{
"use strict";
const $=s=>document.querySelector(s);
const setText=(s,value)=>{$(s).textContent=String(value)};
try {
 const saved=localStorage.getItem("vyon-accent");
 if(["violet","acid","coral","ice"].includes(saved)){
  document.documentElement.dataset.accent=saved;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.content=({violet:"#0b0918",acid:"#0b150a",coral:"#190d13",ice:"#08151b"})[saved];
 }
} catch {}
const params=new URLSearchParams(location.search);
const roomRe=/^[a-f0-9]{24}$/;
const roomElement=$("#room"),lobby=$("#lobby"),audio=$("#room-audio");
const label=$("#connection-label"),indicator=$("#connection-indicator"),unlock=$("#audio-unlock"),enable=$("#enable-audio");
let roomId=params.get("room"),socket=null,state=null,isHost=false,audioEnabled=false;
let attempt=0,reconnect=null,requestedLeave=false,latencyMs=0,lastState=0;
const time=s=>{s=Math.max(0,Number(s)||0);return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")};
function info(message){setText("#room-message",message)}
function hasConnection(){return socket&&socket.readyState===WebSocket.OPEN}
function send(payload){if(!hasConnection())return false;socket.send(JSON.stringify(payload));return true}
function roomLink(){return location.origin+"/listen/?room="+roomId}
function hostKey(){try{return sessionStorage.getItem("vyon-host-"+roomId)||""}catch{return""}}
function saveHostKey(k){try{sessionStorage.setItem("vyon-host-"+roomId,k)}catch{}}
function setConnection(connected){indicator.classList.toggle("online",connected);label.textContent=connected?"Room connected":"Connecting…";$("#participant-count").textContent=connected?"Connected to session":"Offline";}
function permission(){const ok=isHost&&hasConnection();$("#host-panel").hidden=!isHost;$("#room-toggle").disabled=!ok||!state?.url;$("#room-seek").disabled=!ok||!state?.url;$("#room-control-caption").textContent=isHost?"You control the room's playback":"Only the host controls playback";}
function setVolume(){audio.volume=Math.max(0,Math.min(1,Number($("#room-volume").value)/100));}
$("#room-volume").addEventListener("input",setVolume);setVolume();
function desiredPosition(s){return Math.max(0,s.position+(!s.paused?Math.max(0,(Date.now()-s.serverTime+latencyMs/2)/1000):0))}
function alignPlayback(force=false){
 if(!state||!state.url)return;
 const desired=desiredPosition(state);
 if(audio.readyState>=1){
  const bound=Number.isFinite(audio.duration)?Math.min(Math.max(0,audio.duration-.2),desired):desired;
  if(force||Math.abs(audio.currentTime-bound)>1.25){try{audio.currentTime=bound}catch{}}
 }
 if(state.paused){audio.pause();}
 else if(audioEnabled&&audio.paused){
  audio.play().catch(()=>{audioEnabled=false;unlock.hidden=false;info("Tap Enable audio to start playback on this device.");});
 }
}
function paint(){
 if(!state)return;
 const hasTrack=!!state.url;
 setText("#room-title",hasTrack?state.title||"Shared track":"No track selected");
 setText("#track-subtitle",hasTrack?"Synced playback · Public HTTPS audio":"Waiting for the host to choose a track.");
 $("#room-toggle-icon").textContent=state.paused?"▶":"Ⅱ";
 const duration=Number.isFinite(audio.duration)?audio.duration:0;
 const pos=hasTrack?Math.max(0,Math.min(duration||86400,desiredPosition(state))):0;
 setText("#room-current",time(pos));setText("#room-total",duration?time(duration):"—:—");
 const slider=$("#room-seek");slider.max=String(duration||Math.max(1,pos));slider.value=String(pos);
 slider.style.setProperty("--fill",(duration?Math.min(100,Math.max(0,pos/duration*100)):0)+"%");
 permission();
}
function applyState(next){
 if(!next||typeof next!=="object")return;
 const different=next.url!==state?.url;
 state=next;lastState=Date.now();
 if(different){
  audio.pause();
  audio.removeAttribute("src");audio.load();
  if(state.url){
   audio.src=state.url;audio.load();
  }
 }
 alignPlayback(true);paint();
}
function websocketUrl(){return (location.protocol==="https:"?"wss:":"ws:")+"//"+location.host+"/api/listen/rooms/"+roomId+"/ws"}
function connect(){
 if(!roomRe.test(roomId)){info("Invalid room link.");return;}
 requestedLeave=false;
 lobby.hidden=true;roomElement.hidden=false;
 $("#invite-link").value=roomLink();setText("#room-code",roomId.slice(0,8).toUpperCase());
 setConnection(false);permission();
 const ws=new WebSocket(websocketUrl());socket=ws;
 ws.onopen=()=>{attempt=0;setConnection(true);const name=$("#creator-name").value.trim()||"Listener";send({type:"hello",name,hostKey:hostKey()});info("You're in the room.");};
 ws.onmessage=e=>{
  let message;try{message=JSON.parse(e.data)}catch{return}
  if(message.type==="state"){
   isHost=!!message.host||isHost;
   if(message.state)applyState(message.state);
   if(isHost)$("#host-panel").hidden=false;
  }else if(message.type==="presence"){setText("#participant-count",message.participants+" listening");}
  else if(message.type==="pong"){const rtt=Date.now()-Number(message.sent);if(Number.isFinite(rtt)&&rtt>=0&&rtt<5000)latencyMs=rtt;}
  else if(message.type==="error"){info(message.error||"Room error.");}
 };
 ws.onclose=e=>{
  setConnection(false);permission();
  if(requestedLeave)return;
  info(e.code===1001?"Room expired or connection ended.":"Connection lost. Reconnecting…");
  attempt++;reconnect=setTimeout(connect,Math.min(10000,750*Math.pow(1.6,attempt)));
 };
 ws.onerror=()=>{setConnection(false);info("Couldn't connect to the listening server. Cloudflare Worker deployment may not be active.");};
}
$("#create-room").addEventListener("click",async()=>{
 const btn=$("#create-room");btn.disabled=true;info("Creating room…");
 try{
  const response=await fetch("/api/listen/rooms",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
  const data=await response.json();
  if(!response.ok||!roomRe.test(data.room)||!data.hostKey)throw Error(data.error||"Cannot create room");
  roomId=data.room;saveHostKey(data.hostKey);
  history.replaceState({}, "", "/listen/?room="+roomId);
  connect();
 }catch(e){info("Room creation failed: "+e.message+". Confirm that the Cloudflare Worker is deployed.");}
 finally{btn.disabled=false}
});
$("#leave-room").addEventListener("click",()=>{
 requestedLeave=true;clearTimeout(reconnect);
 if(socket){socket.onclose=null;socket.close();socket=null}
 audio.pause();state=null;roomId=null;isHost=false;
 history.replaceState({},"","/listen/");
 lobby.hidden=false;roomElement.hidden=true;setConnection(false);info("");
});
$("#copy-link").addEventListener("click",async()=>{
 const value=roomLink();
 try{await navigator.clipboard.writeText(value);$("#copy-link").textContent="Copied ✓";setTimeout(()=>{$("#copy-link").textContent="Copy"},2000)}
 catch{$("#invite-link").focus();$("#invite-link").select();info("Copy the selected invite link.");}
});
$("#set-track").addEventListener("click",()=>{
 const url=$("#track-url").value.trim();
 try{
  const u=new URL(url);
  if(u.protocol!=="https:"||!/\.(mp3|m4a|ogg|oga|wav|aac)$/i.test(u.pathname))throw Error();
 }catch{info("Use a direct HTTPS audio file URL ending in .mp3, .m4a, .ogg, .wav or .aac.");return;}
 if(!send({type:"control",action:"track",url,title:$("#track-title").value.trim()}))info("Room is disconnected.");
 else info("Sharing track with the room.");
});
$("#room-toggle").addEventListener("click",()=>{if(!isHost||!state?.url)return;send({type:"control",action:state.paused?"play":"pause"});});
$("#room-seek").addEventListener("change",()=>{if(!isHost||!state?.url)return;send({type:"control",action:"seek",position:Number($("#room-seek").value)});});
enable.addEventListener("click",async()=>{
 audioEnabled=true;unlock.hidden=true;
 if(!state?.url){info("Audio enabled. Waiting for the host to select a track.");return;}
 if(!state.paused){
  try{await audio.play();alignPlayback(true);info("Audio enabled. Listening together.");}
  catch(e){audioEnabled=false;unlock.hidden=false;info("Playback blocked or the audio URL is unavailable.");}
 }else info("Audio enabled. Waiting for playback.");
});
audio.addEventListener("loadedmetadata",()=>{alignPlayback(true);paint();});
audio.addEventListener("error",()=>{if(state?.url)info("Can't load this audio file. Use a public, playable HTTPS audio URL.");});
audio.addEventListener("ended",()=>{if(isHost&&hasConnection())send({type:"control",action:"pause"});});
setInterval(()=>{
 if(state){alignPlayback(false);paint();}
 if(hasConnection()&&Date.now()-lastState>15000)send({type:"ping",sent:Date.now()});
},1000);
if(roomId){if(roomRe.test(roomId))connect();else info("The room link is invalid.");}
})();
