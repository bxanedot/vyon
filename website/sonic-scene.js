/* Vyon Sonic Dimension — an actual GPU raymarched 3D sculpture.
 * Runs only when the scene is visible, user motion is allowed, and WebGL2 works.
 * No framework, extra WebGL context, external runtime, or input interception.
 */
(() => {
  "use strict";
  const host = document.getElementById("sonic-scene");
  const canvas = document.getElementById("sonic-canvas");
  if (!host || !canvas) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData === true;
  const weakDevice = (navigator.hardwareConcurrency || 8) <= 4;
  if (reduced.matches || saveData || weakDevice) {
    host.dataset.renderer = "fallback";
    return;
  }

  const gl = canvas.getContext("webgl2", {
    alpha: true, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: true, powerPreference: "low-power",
    preserveDrawingBuffer: false
  });
  if (!gl) {
    host.dataset.renderer = "fallback";
    return;
  }
  const vertex = `#version 300 es
    precision highp float;
    void main() {
      vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
      gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
    }
  `;
  const fragment = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform vec3 uAccent;
    uniform float uTime;
    uniform float uScroll;
    const float PI = 3.14159265;

    mat2 rot(float a) {
      return mat2(cos(a), -sin(a), sin(a), cos(a));
    }
    float torus(vec3 p, vec2 r) {
      vec2 q = vec2(length(p.xz)-r.x, p.y);
      return length(q)-r.y;
    }
    float smin(float a,float b,float k){
      float h = max(k-abs(a-b),0.0)/k;
      return min(a,b)-h*h*k*.25;
    }
    float shape(vec3 p){
      float spin = uTime * .20 + uPointer.x * .32 + uScroll * .21;
      p.xz *= rot(spin);
      p.yz *= rot(-.33 + uPointer.y * .22 + sin(uTime*.27)*.09);
      vec3 a = p; a.xy *= rot(.50);
      vec3 b = p; b.xy *= rot(-1.0);
      vec3 c = p; c.yz *= rot(1.02); c.xy *= rot(.18);
      float loopA = torus(a, vec2(.90,.147));
      float loopB = torus(b, vec2(.91,.13));
      float loopC = torus(c, vec2(.73,.092));
      float d = smin(loopA,loopB,.14);
      d = smin(d,loopC,.11);
      return d;
    }
    vec3 normalAt(vec3 p){
      vec2 e=vec2(.0015,0.);
      return normalize(vec3(
        shape(p+e.xyy)-shape(p-e.xyy),
        shape(p+e.yxy)-shape(p-e.yxy),
        shape(p+e.yyx)-shape(p-e.yyx)
      ));
    }
    void main(){
      vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;
      vec3 ro=vec3(0.,0.,3.75);
      vec3 rd=normalize(vec3(uv,-1.85));
      float t=0.;
      bool hit=false;
      vec3 p;
      for(int i=0;i<75;i++){
        p=ro+rd*t;
        float d=shape(p);
        if(d<.0013){hit=true;break;}
        t+=max(.008,d*.73);
        if(t>7.2)break;
      }
      if(!hit){
        float ring=abs(length(uv)-.63);
        float halo=exp(-length(uv*vec2(.8,1.05))*3.3)*.08;
        halo += exp(-ring*56.)*.065;
        vec3 col=mix(vec3(.27,.22,.45),uAccent,.64);
        fragColor=vec4(col*halo,halo);
        return;
      }
      vec3 n=normalAt(p);
      vec3 viewDir=normalize(ro-p);
      vec3 lightA=normalize(vec3(-.65,1.05,1.6));
      vec3 lightB=normalize(vec3(1.3,-.7,.9));
      float diffA=max(dot(n,lightA),0.);
      float diffB=max(dot(n,lightB),0.);
      float fres=pow(1.-max(dot(n,viewDir),0.),2.15);
      vec3 reflected=reflect(-viewDir,n);
      float specA=pow(max(dot(reflect(-lightA,n),viewDir),0.),48.);
      float specB=pow(max(dot(reflect(-lightB,n),viewDir),0.),20.);
      float spectral=sin(dot(p,vec3(7.,6.,4.))+uTime*.3)*.5+.5;
      vec3 steel=mix(vec3(.16,.19,.27),vec3(.72,.78,.88),diffA*.77);
      vec3 pigment=mix(uAccent,vec3(.29,.44,.91),spectral*.52);
      vec3 col=mix(steel,pigment,diffB*.50+fres*.44);
      col+=vec3(.91,.93,1.)*specA*.95;
      col+=uAccent*specB*.9;
      col+=mix(uAccent,vec3(.85,.64,1.),spectral)*fres*.77;
      col+=vec3(.025,.02,.04);
      col=pow(col,vec3(.9));
      float alpha=1.;
      fragColor=vec4(clamp(col,0.,1.)*alpha,alpha);
    }
  `;
  function makeShader(type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      console.warn("Vyon shader compilation failed",gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  let vs=makeShader(gl.VERTEX_SHADER,vertex);
  let fs=makeShader(gl.FRAGMENT_SHADER,fragment);
  if(!vs || !fs){host.dataset.renderer="fallback";return;}
  const program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
    console.warn("Vyon WebGL program link failed",gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    host.dataset.renderer="fallback";
    return;
  }
  gl.useProgram(program);
  const uniform=(name)=>gl.getUniformLocation(program,name);
  const uniforms={
    resolution:uniform("uResolution"),
    pointer:uniform("uPointer"),
    accent:uniform("uAccent"),
    time:uniform("uTime"),
    scroll:uniform("uScroll")
  };
  const vao=gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0,0,0,0);
  const palette={
    blood:[.90,.22,.33], violet:[.65,.60,1.0],
    acid:[.69,.95,.35], coral:[1.,.56,.42], ice:[.38,.78,.95]
  };
  let frame=0,visible=false,paused=document.hidden,disposed=false;
  let start=performance.now(),elapsed=0,prev=0,scroll=0;
  const pointer={x:0,y:0,tx:0,ty:0};
  let width=0,height=0;
  const dprLimit=window.innerWidth<800?1:1.35;
  const pixelBudget=window.innerWidth<800?300000:720000;
  const minFrameMs=window.innerWidth<800?33:20;
  let lastDraw=0;

  function resize(){
    const rect=canvas.getBoundingClientRect();
    if(!rect.width || !rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,dprLimit,
      Math.sqrt(pixelBudget/(rect.width*rect.height)));
    const w=Math.max(1,Math.round(rect.width*dpr));
    const h=Math.max(1,Math.round(rect.height*dpr));
    if(w!==width||h!==height){
      width=canvas.width=w;
      height=canvas.height=h;
      gl.viewport(0,0,w,h);
    }
  }
  function render(now){
    frame=0;
    if(disposed||!visible||paused||reduced.matches)return;
    resize();
    if(!width||!height)return;
    if(lastDraw && now-lastDraw<minFrameMs){
      frame=requestAnimationFrame(render);
      return;
    }
    lastDraw=now;
    const dt=Math.min((now-(prev||now))/1000,.05);
    prev=now;
    elapsed+=dt;
    pointer.x+=(pointer.tx-pointer.x)*Math.min(1,dt*2.7);
    pointer.y+=(pointer.ty-pointer.y)*Math.min(1,dt*2.7);
    const theme=palette[document.documentElement.dataset.accent]||palette.blood;
    scroll=Math.min(1,Math.max(0,-host.getBoundingClientRect().top/Math.max(host.offsetHeight,1)));
    gl.uniform2f(uniforms.resolution,width,height);
    gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);
    gl.uniform3f(uniforms.accent,...theme);
    gl.uniform1f(uniforms.time,elapsed);
    gl.uniform1f(uniforms.scroll,scroll);
    gl.drawArrays(gl.TRIANGLES,0,3);
    frame=requestAnimationFrame(render);
  }
  function schedule(){
    if(!frame && !disposed && visible && !paused && !reduced.matches){
      prev=0;
      frame=requestAnimationFrame(render);
    }
  }
  const observer=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(!visible && frame){cancelAnimationFrame(frame);frame=0}
    schedule();
  },{rootMargin:"100px 0px 100px 0px"});
  observer.observe(host);
  const onVisibility=()=>{
    paused=document.hidden;
    if(paused && frame){cancelAnimationFrame(frame);frame=0}
    else schedule();
  };
  const onPointer=e=>{
    const rect=host.getBoundingClientRect();
    pointer.tx=Math.max(-1,Math.min(1,((e.clientX-rect.left)/rect.width-.5)*2));
    pointer.ty=Math.max(-1,Math.min(1,((e.clientY-rect.top)/rect.height-.5)*2));
  };
  host.addEventListener("pointermove",onPointer,{passive:true});
  host.addEventListener("pointerleave",()=>{pointer.tx=0;pointer.ty=0},{passive:true});
  document.addEventListener("visibilitychange",onVisibility);
  const ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
  ro?.observe(host);
  const onReduce=()=>{
    if(reduced.matches){host.dataset.renderer="fallback";if(frame){cancelAnimationFrame(frame);frame=0}}
    else{host.dataset.renderer="webgl";schedule()}
  };
  reduced.addEventListener?.("change",onReduce);
  canvas.addEventListener("webglcontextlost",e=>{
    e.preventDefault();
    disposed=true;
    if(frame)cancelAnimationFrame(frame);
    host.dataset.renderer="fallback";
  });
  host.dataset.renderer="webgl";
  resize();
  schedule();
})();
