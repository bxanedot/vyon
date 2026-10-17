/* Vyon Mark / 3D — official SVG extruded to a lit GPU mesh.
 * This replaces an unrelated torus raymarcher with real brand geometry.
 * Entirely self-contained; graceful, recognizable SVG fallback.
 */
(() => {
 "use strict";
 const host=document.getElementById("sonic-scene");
 const canvas=document.getElementById("sonic-canvas");
 if(!host||!canvas)return;
 const reduced=matchMedia("(prefers-reduced-motion: reduce)");
 const constrained=navigator.connection?.saveData||(navigator.hardwareConcurrency||8)<=4;
 const fail=reason=>{host.dataset.renderer="fallback";host.dataset.renderReason=reason};
 if(reduced.matches||constrained){fail(reduced.matches?"reduced-motion":"device");return}
 const gl=canvas.getContext("webgl2",{
  alpha:true,antialias:true,depth:true,stencil:false,
  premultipliedAlpha:false,powerPreference:"low-power",
  preserveDrawingBuffer:false
 });
 if(!gl){fail("webgl-unavailable");return}

 const vertexSource=[
  "#version 300 es",
  "precision highp float;",
  "in vec3 aPosition; in vec3 aNormal;",
  "uniform vec2 uTilt; uniform float uAspect; uniform float uTime;",
  "out vec3 vNormal; out vec3 vPosition;",
  "void main(){",
  "float rx=uTilt.y, ry=uTilt.x;",
  "mat3 Y=mat3(cos(ry),0.,-sin(ry),0.,1.,0.,sin(ry),0.,cos(ry));",
  "mat3 X=mat3(1.,0.,0.,0.,cos(rx),sin(rx),0.,-sin(rx),cos(rx));",
  "mat3 rotation=X*Y;",
  "vec3 p=rotation*aPosition;",
  "p.y+=sin(uTime*.65)*.018;",
  "vNormal=normalize(rotation*aNormal); vPosition=p;",
  "gl_Position=vec4(p.x*3.35*uAspect,p.y*3.35,p.z,3.65-p.z);",
  "}"
 ].join("\n");
 const fragmentSource=[
  "#version 300 es",
  "precision highp float;",
  "in vec3 vNormal;in vec3 vPosition;",
  "uniform vec3 uAccent;out vec4 outColor;",
  "void main(){",
  "vec3 n=normalize(vNormal),v=normalize(vec3(0.,0.,3.6)-vPosition);",
  "vec3 key=normalize(vec3(-.6,1.15,1.8)),rim=normalize(vec3(.92,-.45,1.));",
  "float k=max(dot(n,key),0.),f=max(dot(n,rim),0.);",
  "float spec=pow(max(dot(reflect(-key,n),v),0.),55.);",
  "float spec2=pow(max(dot(reflect(-rim,n),v),0.),24.);",
  "float fres=pow(1.-max(dot(n,v),0.),2.5);",
  "vec3 metal=mix(vec3(.17,.16,.23),vec3(.82,.80,.9),k*.82+.09);",
  "metal=mix(metal,uAccent,f*.33+fres*.26);",
  "metal+=vec3(1.,.96,1.)*spec*.72;",
  "metal+=uAccent*(spec2*.64+fres*.56);",
  "outColor=vec4(clamp(metal,0.,1.),1.);",
  "}"
 ].join("\n");
 function compile(type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
   console.warn("Vyon icon shader:",gl.getShaderInfoLog(shader));
   gl.deleteShader(shader);return null;
  }
  return shader;
 }
 const vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
 if(!vs||!fs){fail("shader");return}
 const program=gl.createProgram();
 gl.attachShader(program,vs);gl.attachShader(program,fs);
 gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
  console.warn("Vyon icon program:",gl.getProgramInfoLog(program));
  gl.deleteProgram(program);fail("shader-link");return;
 }

 // The official SVG mark consists of three separate polygonal contours.
 // Use its actual path data; no unrelated torus or manually drawn logo.
 function readContours(text){
  const doc=new DOMParser().parseFromString(text,"image/svg+xml");
  if(doc.querySelector("parsererror"))throw Error("Invalid SVG");
  const paths=[...doc.querySelectorAll("path")];
  if(!paths.length)throw Error("Missing official Vyon mark");
  const all=[];
  for(const path of paths){
   const tokens=(path.getAttribute("d")||"").match(/[MmLlZz]|[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/g)||[];
   let poly=[],cmd=null,i=0;
   const flush=()=>{if(poly.length>=3)all.push(poly);poly=[]};
   while(i<tokens.length){
    const token=tokens[i];
    if(/^[MmLlZz]$/.test(token)){
     cmd=token.toUpperCase();i++;
     if(cmd==="Z"){flush();cmd=null}
     continue;
    }
    if(cmd!=="M"&&cmd!=="L")throw Error("Unsupported path data");
    if(i+1>=tokens.length)throw Error("Incomplete SVG path");
    const x=Number(tokens[i++]),y=Number(tokens[i++]);
    if(!Number.isFinite(x)||!Number.isFinite(y))throw Error("Invalid path coordinate");
    if(cmd==="M"&&poly.length)flush();
    poly.push({x:(x-500)/350,y:(507-y)/350});
    cmd="L";
   }
   flush();
  }
  if(all.length<3)throw Error("Missing Vyon path components");
  return all;
 }
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const area=p=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a.x*b.y-b.x*a.y},0)*.5;
 function cleaned(source){
  const p=source.filter((v,i)=>i===0||Math.hypot(v.x-source[i-1].x,v.y-source[i-1].y)>1e-7);
  if(p.length>2&&Math.hypot(p[0].x-p.at(-1).x,p[0].y-p.at(-1).y)<1e-7)p.pop();
  for(let pass=0;pass<2;pass++)for(let i=p.length-1;i>=0&&p.length>3;i--)
   if(Math.abs(cross(p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]))<1e-7)p.splice(i,1);
  return p;
 }
 function triangulate(poly){
  const sign=Math.sign(area(poly));
  if(!sign)throw Error("Degenerate mark");
  const ids=poly.map((_,i)=>i),out=[];
  let safety=poly.length*poly.length;
  while(ids.length>3&&safety-->0){
   let found=false;
   for(let i=0;i<ids.length;i++){
    const ai=ids[(i+ids.length-1)%ids.length],bi=ids[i],ci=ids[(i+1)%ids.length];
    const a=poly[ai],b=poly[bi],c=poly[ci];
    if(cross(a,b,c)*sign<=1e-8)continue;
    let occupied=false;
    for(const k of ids){
     if(k===ai||k===bi||k===ci)continue;
     const p=poly[k];
     if(cross(a,b,p)*sign>=-1e-9&&cross(b,c,p)*sign>=-1e-9&&cross(c,a,p)*sign>=-1e-9){occupied=true;break}
    }
    if(occupied)continue;
    out.push(sign>0?[ai,bi,ci]:[ai,ci,bi]);
    ids.splice(i,1);found=true;break;
   }
   if(!found)throw Error("Could not triangulate official mark");
  }
  if(ids.length!==3)throw Error("Incomplete mark triangulation");
  out.push(sign>0?[ids[0],ids[1],ids[2]]:[ids[0],ids[2],ids[1]]);
  return out;
 }
 function buildMesh(contours){
  const buffer=[];
  const put=(p,z,n)=>buffer.push(p.x,p.y,z,...n);
  const tri=(a,az,b,bz,c,cz,n)=>{put(a,az,n);put(b,bz,n);put(c,cz,n)};
  const quad=(a,az,b,bz,c,cz,d,dz,n)=>{
   tri(a,az,b,bz,c,cz,n);tri(b,bz,d,dz,c,cz,n);
  };
  for(const raw of contours){
   const poly=cleaned(raw),triangles=triangulate(poly);
   const cx=poly.reduce((v,p)=>v+p.x,0)/poly.length;
   const cy=poly.reduce((v,p)=>v+p.y,0)/poly.length;
   const inner=poly.map(p=>({x:cx+(p.x-cx)*.984,y:cy+(p.y-cy)*.984}));
   for(const [i,j,k] of triangles){
    tri(inner[i],.18,inner[j],.18,inner[k],.18,[0,0,1]);
    tri(inner[k],-.15,inner[j],-.15,inner[i],-.15,[0,0,-1]);
   }
   const dir=Math.sign(area(poly));
   for(let i=0;i<poly.length;i++){
    const j=(i+1)%poly.length;
    const a=poly[i],b=poly[j],ia=inner[i],ib=inner[j];
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const nx=dir*dy/len,ny=-dir*dx/len;
    quad(ia,.18,ib,.18,a,.11,b,.11,[nx*.68,ny*.68,.74]);
    quad(a,.11,b,.11,a,-.10,b,-.10,[nx,ny,0]);
    quad(a,-.10,b,-.10,ia,-.15,ib,-.15,[nx*.73,ny*.73,-.68]);
   }
  }
  if(buffer.length<1200||buffer.length>250000)throw Error("Invalid mark mesh size");
  return new Float32Array(buffer);
 }

 const palette={blood:[.90,.22,.33],violet:[.65,.60,1],acid:[.69,.95,.35],
  coral:[1,.56,.42],ice:[.38,.78,.95]};
 const pointer={x:0,y:0,targetX:0,targetY:0};
 const pixelBudget=innerWidth<850?360000:850000;
 const frameMs=innerWidth<850?33:20;
 let visible=false,disposed=false,observer,resizeObserver;
 let frame=0,previous=0,lastDraw=0,elapsed=0,count=0,started=false;
 const uniforms={
  tilt:gl.getUniformLocation(program,"uTilt"),
  aspect:gl.getUniformLocation(program,"uAspect"),
  time:gl.getUniformLocation(program,"uTime"),
  accent:gl.getUniformLocation(program,"uAccent")
 };
 function resize(){
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const dpr=Math.min(devicePixelRatio||1,innerWidth<850?1:1.5,
   Math.sqrt(pixelBudget/(rect.width*rect.height)));
  const width=Math.max(1,Math.round(rect.width*dpr));
  const height=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==width||canvas.height!==height){
   canvas.width=width;canvas.height=height;
   gl.viewport(0,0,width,height);
  }
 }
 function render(now){
  frame=0;
  if(disposed||!visible||document.hidden||reduced.matches)return;
  if(lastDraw&&now-lastDraw<frameMs){frame=requestAnimationFrame(render);return}
  const dt=Math.min((now-(previous||now))/1000,.05);
  previous=now;lastDraw=now;elapsed+=dt;
  resize();
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const smooth=Math.min(1,dt*3.5);
  pointer.x+=(pointer.targetX-pointer.x)*smooth;
  pointer.y+=(pointer.targetY-pointer.y)*smooth;
  const accent=palette[document.documentElement.dataset.accent]||palette.blood;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniform2f(uniforms.tilt,.15+pointer.x*.19,-.07+pointer.y*.13);
  gl.uniform1f(uniforms.aspect,rect.height/rect.width);
  gl.uniform1f(uniforms.time,elapsed);
  gl.uniform3f(uniforms.accent,...accent);
  gl.drawArrays(gl.TRIANGLES,0,count);
  if(!started){
   started=true;host.dataset.renderer="webgl";
   host.dataset.geometry="vyon-mark";host.dataset.vertexCount=String(count);
  }
  frame=requestAnimationFrame(render);
 }
 const stop=()=>{if(frame){cancelAnimationFrame(frame);frame=0}previous=0};
 const schedule=()=>{if(!frame&&!disposed&&visible&&!document.hidden&&!reduced.matches){
  previous=0;frame=requestAnimationFrame(render);
 }};
 function teardown(reason){
  disposed=true;stop();observer?.disconnect();resizeObserver?.disconnect();fail(reason);
 }
 canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();teardown("context-lost")});
 reduced.addEventListener?.("change",()=>{if(reduced.matches)teardown("reduced-motion")});
 host.addEventListener("pointermove",event=>{
  const r=host.getBoundingClientRect();
  pointer.targetX=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));
  pointer.targetY=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));
 },{passive:true});
 host.addEventListener("pointerleave",()=>{pointer.targetX=0;pointer.targetY=0},{passive:true});
 document.addEventListener("visibilitychange",()=>document.hidden?stop():schedule());

 fetch("/icons/vyon-mark.svg",{cache:"force-cache"})
 .then(r=>{if(!r.ok)throw Error("Could not load official Vyon SVG");return r.text()})
 .then(text=>{
  if(disposed)return;
  const data=buildMesh(readContours(text));
  count=data.length/6;
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const vao=gl.createVertexArray();
  gl.bindVertexArray(vao);
  const position=gl.getAttribLocation(program,"aPosition");
  const normal=gl.getAttribLocation(program,"aNormal");
  if(position<0||normal<0)throw Error("Missing vertex attributes");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(normal);
  gl.vertexAttribPointer(normal,3,gl.FLOAT,false,24,12);
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  gl.clearColor(0,0,0,0);
  observer=new IntersectionObserver(entries=>{
   visible=entries.some(e=>e.isIntersecting);
   if(visible)schedule();else stop();
  },{rootMargin:"110px 0px 110px 0px"});
  observer.observe(host);
  resizeObserver=typeof ResizeObserver==="undefined"?null:new ResizeObserver(resize);
  resizeObserver?.observe(host);
  resize();
 })
 .catch(error=>{
  console.warn("Vyon 3D icon failed; showing official SVG instead.",error);
  teardown("geometry");
 });
})();