/* Production smoke tests run after building dist/.
   Keep critical UX and discovery routes intact while optimizing resources. */
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile,stat} from "node:fs/promises";
import {join} from "node:path";

const output=join(process.cwd(),"dist");
const source=process.cwd();
const pages=["download","features","android","desktop","faq"];
const read=async file=>readFile(join(output,file),"utf8");
const homepage=await read("index.html");
const sitemap=await read("sitemap.xml");
const redirects=JSON.parse(await readFile(join(source,"vercel.json"),"utf8"));

assert.match(homepage,/<link rel="stylesheet" href="\/styles.css">/);
assert.match(homepage,/<link rel="stylesheet" href="\/compact.css/);
assert.match(homepage,/<link rel="stylesheet" href="\/equalizer.css">/);
assert.match(homepage,/<link rel="stylesheet" href="\/seo-pages.css">/);
assert.match(homepage,/href="https:\/\/fonts.googleapis.com\/css2\?/);
assert.match(homepage,/href="\/download"/);
assert.match(homepage,/<meta name="description"/);
assert.match(homepage,/https:\/\/vyon.live\//);
assert.match(await read("robots.txt"),/Sitemap: https:\/\/vyon.live\/sitemap.xml/);
assert.match(await read("google487965bff30850ae.html"),/google-site-verification:/);

for(const page of pages){
 const html=await read(page+".html");
 assert.match(html,new RegExp('<link rel="canonical" href="https://vyon.live/'+page+'">'));
 assert.match(html,/<meta name="description" content="[^"]+"/);
 assert.match(html,/<script type="application\/ld\+json">/);
 assert.match(html,/<link rel="stylesheet" href="\/seo-foundation.css">/);
 assert.match(html,/<link rel="stylesheet" href="\/seo-pages.css">/);
 assert.doesNotMatch(html,/<link rel="stylesheet" href="\/(?:styles|compact|equalizer).css/);
 assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,page+": should have one H1");
 assert.match(sitemap,new RegExp('https://vyon.live/'+page+'<'));
 assert.ok(redirects.rewrites.some(rule=>rule.source==="/"+page&&rule.destination==="/"+page+".html"),page+": route must exist");
 for(const sibling of pages) assert.match(html,new RegExp('href="/'+sibling+'"'));
 const schema=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 assert.ok(schema,page+": structured data is required");
 assert.equal(JSON.parse(schema[1])["@context"],"https://schema.org");
}

// The original interactive homepage code still needs to parse after optimization.
for(const script of ["app.js","equalizer.js","visit-counters.js"])
 execFileSync(process.execPath,["--check",join(output,script)],{stdio:"pipe"});

const css=["styles.css","compact.css","equalizer.css","seo-pages.css","seo-foundation.css"];
const siteScript=await read("app.js");
assert.match(siteScript,/const screenshotObserver=new IntersectionObserver/);
assert.match(siteScript,/async function loadStableReleases/);
assert.match(siteScript,/const downloadObserver=new IntersectionObserver/);
// Keep original interactions available; guard the particle work batching that
// prevents mobile resize/scroll bursts from saturating the main thread.
for(const pattern of [
 /let scrollPaintFrame=0/,
 /let resizeFrame=0/,
 /seenNearbyBoxes\.clear\(\)/,
 /const viewportWidth=document\.documentElement\.clientWidth/,
 /if\(p\.dotColorAccent===accent&&p\.dotColorValue\)/,
 /image\.decode\(\)\.then\(show,show\)/,
 /function collapseDottedLogo\(\)/,
 /function dragDotBrush\(/,
 /function renderOrb\(\)/
])assert.match(siteScript,pattern);
const cacheFor=route=>redirects.headers.find(rule=>rule.source===route)
 ?.headers.find(header=>header.key.toLowerCase()==="cache-control")?.value;
for(const route of ["/icons/(.*)","/screenshots/(.*)","/favicon.svg"]){
 assert.match(cacheFor(route)||"",/max-age=86400/,route+": cache one day");
 assert.match(cacheFor(route)||"",/stale-while-revalidate/,route+": serve existing assets while updating");
}
assert.match(cacheFor("/vyon-social-preview-2026.png")||"",/immutable/);
assert.ok(!redirects.headers.some(rule=>["/app.js","/styles.css","/compact.css"].includes(rule.source)),
 "Mutable app files must not get long-lived immutable caching");
execFileSync(process.execPath,["--check",join(source,"lighthouserc.cjs")],{stdio:"pipe"});

const guideCssBytes=(await stat(join(output,"seo-pages.css"))).size
 +(await stat(join(output,"seo-foundation.css"))).size;
const oldGuideCssBytes=(await stat(join(source,"styles.css"))).size
 +(await stat(join(source,"compact.css"))).size
 +(await stat(join(source,"seo-pages.css"))).size;
assert.ok(guideCssBytes<oldGuideCssBytes*.25,
 "Guide pages should avoid loading the full homepage CSS payload");
console.log(`Guide CSS (uncompressed): ${oldGuideCssBytes} → ${guideCssBytes} bytes (${Math.round(100*(1-guideCssBytes/oldGuideCssBytes))}% smaller)`);
const before=await Promise.all(css.map(async file=>(await stat(join(source,file))).size));
const after=await Promise.all(css.map(async file=>(await stat(join(output,file))).size));
const beforeBytes=before.reduce((a,b)=>a+b,0),afterBytes=after.reduce((a,b)=>a+b,0);
assert.ok(afterBytes<beforeBytes, "CSS minification should reduce transferred bytes");
console.log("Performance smoke tests passed: 5 routes, metadata, site links, JS syntax, build assets.");
console.log(`CSS payload (uncompressed): ${beforeBytes} → ${afterBytes} bytes (${Math.round(100*(1-afterBytes/beforeBytes))}% smaller)`);
