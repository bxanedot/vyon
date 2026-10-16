import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
const output=join(process.cwd(),"dist");
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const publicFiles=["index.html","app.js","styles.css","compact.css","equalizer.css","equalizer.js","premium.css","favicon.svg","vyon-social-preview.png"];
for(const file of publicFiles)await cp(join(process.cwd(),file),join(output,file));
for(const dir of ["icons","screenshots"])await cp(join(process.cwd(),dir),join(output,dir),{recursive:true});
const hostname=process.env.VERCEL_URL;
if(hostname&&/^[a-z0-9.-]+$/i.test(hostname)){
 const path=join(output,"index.html");
 let html=await readFile(path,"utf8");
 const origin="https://"+hostname;
 html=html.replace('property="og:url" content="/"','property="og:url" content="'+origin+'/"');
 html=html.replaceAll('content="/vyon-social-preview.png"','content="'+origin+'/vyon-social-preview.png"');
 await writeFile(path,html);
}
console.log("Built Vyon static marketing website for Vercel.");
