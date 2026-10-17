import {cp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {build as bundle} from "esbuild";
import sharp from "sharp";
const output=join(process.cwd(),"dist");
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const publicFiles=["index.html","app.js","visit-counters.js","styles.css","compact.css","equalizer.css","equalizer.js","premium.css","favicon.svg","vyon-social-preview.png","robots.txt","sitemap.xml","google487965bff30850ae.html"];
for(const file of publicFiles)await cp(join(process.cwd(),file),join(output,file));
for(const dir of ["icons","screenshots"])await cp(join(process.cwd(),dir),join(output,dir),{recursive:true});

// Generate an actual, validated social card PNG from the same official logo
// displayed on the site. The old preview asset in git is corrupted.
// Write both the stable name and a versioned path to bypass embed caches.
const svgLogo=await readFile(join(process.cwd(),"icons","vyon-mark.svg"),"utf8");
const logoPath=svgLogo.match(/<path\b[^>]*\bd="([^"]+)"/)?.[1];
if(!logoPath)throw new Error("vyon-mark.svg has no logo path");
const socialImageSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#08080b"/>
 <rect width="14" height="630" fill="#e73c53"/>
 <path d="M72 80 H1128" stroke="#333137" stroke-width="3"/>
 <svg x="157" y="235" width="312" height="189" viewBox="132 284 736 446">
  <path fill="#f6f5f7" d="${logoPath}"/>
 </svg>
 <path d="M626 158V445" stroke="#444148" stroke-width="3"/>
 <text x="659" y="311" font-family="DejaVu Sans,Arial,sans-serif" font-weight="700" font-size="100" letter-spacing="-4" fill="#f6f5f7">vyon</text>
 <text x="665" y="394" font-family="DejaVu Sans,Arial,sans-serif" font-size="34" fill="#cfccd2">Music, on your terms.</text>
 <text x="84" y="548" font-family="DejaVu Sans,Arial,sans-serif" font-size="20" fill="#bbb4bb">WINDOWS &#183; macOS &#183; LINUX &#183; ANDROID</text>
 <text x="928" y="548" font-family="DejaVu Sans,Arial,sans-serif" font-size="24" fill="#e73c53">vyon.live</text>
</svg>`;
const imageData=await sharp(Buffer.from(socialImageSvg))
 .png({compressionLevel:9})
 .toBuffer();
const {width:socialWidth,height:socialHeight,format:socialFormat}=await sharp(imageData).metadata();
if(socialWidth!==1200||socialHeight!==630||socialFormat!=="png")throw new Error("Invalid social card dimensions or encoding");
for(const filename of ["vyon-social-preview.png","vyon-social-preview-2026.png"]){
 await writeFile(join(output,filename),imageData);
}
console.log("Generated valid 1200x630 vyon Open Graph preview PNG.");
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
// All production and preview builds advertise the stable public domain.
// Never point social crawlers at a temporary, potentially protected Vercel URL.
console.log("Built Vyon static marketing website for Vercel.");
