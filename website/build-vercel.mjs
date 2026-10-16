import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {build as bundle} from "esbuild";
const output=join(process.cwd(),"dist");
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const publicFiles=["index.html","app.js","styles.css","compact.css","equalizer.css","equalizer.js","premium.css","favicon.svg","vyon-social-preview.png"];
for(const file of publicFiles)await cp(join(process.cwd(),file),join(output,file));
for(const dir of ["icons","screenshots"])await cp(join(process.cwd(),dir),join(output,dir),{recursive:true});
// Include tracking only in the compiled Vercel dist/ output, rather than
// relying on a framework-specific Analytics component.
await bundle({
 entryPoints:[join(process.cwd(),"analytics-entry.js")],
 outfile:join(output,"analytics.js"),
 bundle:true,
 platform:"browser",
 format:"esm",
 target:["es2020"],
 minify:true,
 define:{
  "process.env.NODE_ENV":JSON.stringify("production"),
  "process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG":JSON.stringify(process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG||"")
 }
});
const analyticsPage=join(output,"index.html");
let analyticsHtml=await readFile(analyticsPage,"utf8");
if(!analyticsHtml.includes('src="/analytics.js"')){
 analyticsHtml=analyticsHtml.replace('</body>','  <script type="module" src="/analytics.js"></script>\n</body>');
 await writeFile(analyticsPage,analyticsHtml);
}
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
