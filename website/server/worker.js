/* vyon Listen Together
 * Real-time room synchronization using a Cloudflare Durable Object.
 * Audio stays at its original HTTPS source, never proxied or stored here.
 */
const MAX_CLIENTS=24,MAX_MESSAGE=4096,MAX_TITLE=90;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const rand=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,"0")).join("");
const validId=id=>/^[a-f0-9]{24}$/.test(id);
function audioUrl(value){
 if(typeof value!=="string"||value.length>1700)return null;
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||!/\.(mp3|m4a|ogg|oga|wav|aac)(?:$)/i.test(u.pathname))return null;
  if(["localhost","127.0.0.1","::1"].includes(u.hostname))return null;
  return u.toString();
 }catch{return null;}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(path==="/api/listen/health"&&request.method==="GET")return json({ok:true,service:"vyon-listen",mode:"durable-objects"});
  if(path==="/api/listen/rooms"&&request.method==="POST"){
   const origin=request.headers.get("origin");
   if(origin&&origin!==url.origin)return json({error:"Invalid origin"},403);
   const id=rand(12),hostKey=rand(32);
   const stub=env.LISTEN_ROOMS.get(env.LISTEN_ROOMS.idFromName(id));
   const response=await stub.fetch(new Request("https://room.internal/init",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({hostKey})}));
   if(!response.ok)return json({error:"Unable to create room"},502);
   return json({room:id,hostKey,link:url.origin+"/listen/?room="+id},201);
  }
  const match=path.match(/^\/api\/listen\/rooms\/([a-f0-9]{24})(\/ws)?$/);
  if(match){
   if(match[2]){
    if(request.method!=="GET"||request.headers.get("Upgrade")?.toLowerCase()!=="websocket")return json({error:"WebSocket required"},426);
    const origin=request.headers.get("origin");
    if(origin!==url.origin)return json({error:"Cross-origin WebSockets are not allowed"},403);
   }else if(request.method!=="GET")return json({error:"Method not allowed"},405);
   const stub=env.LISTEN_ROOMS.get(env.LISTEN_ROOMS.idFromName(match[1]));
   return stub.fetch(new Request("https://room.internal"+(match[2]?"/ws":"/state"),request));
  }
  if(path.startsWith("/api/"))return json({error:"Unknown endpoint"},404);
  return env.ASSETS.fetch(request);
 }
};
export class ListenRoom {
 constructor(state,env){
  this.state=state;this.env=env;this.room=null;
  this.rate=new WeakMap();
  state.blockConcurrencyWhile(async()=>{this.room=await state.storage.get("room")||null;});
 }
 currentTime(){
  if(!this.room)return 0;
  if(this.room.paused)return this.room.position;
  return Math.max(0,this.room.position+(Date.now()-this.room.changedAt)/1000);
 }
 status(){
  const r=this.room;
  return {title:r.title,url:r.url,paused:r.paused,position:this.currentTime(),changedAt:r.changedAt,participants:this.state.getWebSockets().length,serverTime:Date.now()};
 }
 broadcast(payload){
  const data=JSON.stringify(payload);
  for(const ws of this.state.getWebSockets()){try{ws.send(data);}catch{}}
 }
 async fetch(request){
  const pathname=new URL(request.url).pathname;
  if(pathname==="/init"&&request.method==="POST"){
   if(this.room)return json({error:"Already initialized"},409);
   const body=await request.json().catch(()=>null);
   if(!body||!(/^[a-f0-9]{64}$/).test(body.hostKey))return json({error:"Invalid credentials"},400);
   this.room={key:body.hostKey,url:"",title:"",paused:true,position:0,changedAt:Date.now()};
   await this.state.storage.put("room",this.room);
   await this.state.storage.setAlarm(Date.now()+7*86400000);
   return json({ok:true},201);
  }
  if(!this.room)return json({error:"Room not found or expired"},404);
  if(pathname==="/state")return json(this.status());
  if(pathname!=="/ws"||request.headers.get("Upgrade")?.toLowerCase()!=="websocket")return json({error:"Not found"},404);
  if(this.state.getWebSockets().length>=MAX_CLIENTS)return json({error:"Room is full"},429);
  const [client,server]=Object.values(new WebSocketPair());
  this.state.acceptWebSocket(server);
  server.serializeAttachment({name:"Listener",host:false});
  server.send(JSON.stringify({type:"state",state:this.status(),host:false}));
  this.broadcast({type:"presence",participants:this.state.getWebSockets().length});
  return new Response(null,{status:101,webSocket:client});
 }
 async webSocketMessage(ws,data){
  if(typeof data!=="string"||data.length>MAX_MESSAGE){ws.close(1009,"Message too long");return;}
  const now=Date.now(),last=this.rate.get(ws)||{time:now,count:0};
  if(now-last.time>1000){last.time=now;last.count=0;}
  if(++last.count>16){ws.close(1008,"Rate limited");return;}
  this.rate.set(ws,last);
  let message;
  try{message=JSON.parse(data);}catch{return;}
  if(!message||typeof message.type!=="string"||!this.room)return;
  const current=ws.deserializeAttachment()||{name:"Listener",host:false};
  if(message.type==="hello"){
   const name=typeof message.name==="string"?message.name.trim().slice(0,25):"";
   const host=typeof message.hostKey==="string"&&message.hostKey===this.room.key;
   const profile={name:name||"Listener",host};
   ws.serializeAttachment(profile);
   ws.send(JSON.stringify({type:"state",state:this.status(),host}));
   this.broadcast({type:"presence",participants:this.state.getWebSockets().length});
   return;
  }
  if(message.type==="ping"){ws.send(JSON.stringify({type:"pong",sent:message.sent,serverTime:Date.now()}));return;}
  if(message.type!=="control"||!current.host){ws.send(JSON.stringify({type:"error",error:"Host permission required"}));return;}
  const action=message.action;
  if(action==="track"){
   const url=audioUrl(message.url),title=typeof message.title==="string"?message.title.trim().slice(0,MAX_TITLE):"";
   if(!url){ws.send(JSON.stringify({type:"error",error:"Use a direct public HTTPS audio file URL ending in .mp3, .m4a, .ogg, .wav or .aac"}));return;}
   this.room.url=url;this.room.title=title||"Shared track";this.room.position=0;this.room.paused=true;
  }else if(action==="play"){
   if(!this.room.url)return;
   this.room.position=this.currentTime();this.room.paused=false;
  }else if(action==="pause"){
   this.room.position=this.currentTime();this.room.paused=true;
  }else if(action==="seek"){
   const position=Number(message.position);
   if(!Number.isFinite(position)||position<0||position>86400)return;
   this.room.position=position;
  }else{return;}
  this.room.changedAt=Date.now();
  await this.state.storage.put("room",this.room);
  await this.state.storage.setAlarm(Date.now()+7*86400000);
  this.broadcast({type:"state",state:this.status()});
 }
 webSocketClose(ws){
  try{ws.close();}catch{}
  this.broadcast({type:"presence",participants:Math.max(0,this.state.getWebSockets().length-1)});
 }
 webSocketError(ws){try{ws.close();}catch{}}
 async alarm(){
  for(const ws of this.state.getWebSockets()){try{ws.close(1001,"Room expired");}catch{}}
  await this.state.storage.deleteAll();
  this.room=null;
 }
}
