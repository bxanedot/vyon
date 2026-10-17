/* Privacy-friendly OS detection, verified stable releases, user-triggered downloads.
 * Never downloads files without a click, never guesses an installer URL. */
(() => {
  "use strict";
  const repo="bxanedot/vyon";
  const releasesUrl="https://github.com/"+repo+"/releases";
  const known=["android","windows","macos","linux"];
  function detectPlatform(ua=navigator.userAgent||"",hint=navigator.userAgentData?.platform||navigator.platform||""){
    const text=String(ua)+" "+String(hint);
    if(/Android/i.test(text))return "android";
    if(/iPhone|iPad|iPod/i.test(text))return null; // Not supported.
    if(/Windows|Win32|Win64/i.test(text))return "windows";
    if(/Macintosh|MacIntel|Mac OS X|macOS/i.test(text))return "macos";
    if(/Linux|X11/i.test(text))return "linux";
    return null;
  }
  const platform=detectPlatform();
  const labels={android:"Android",windows:"Windows",macos:"macOS",linux:"Linux"};
  const formats={
    android:name=>/\.apk$/i.test(name),
    windows:name=>/\.(exe|msi|msix|msixbundle)$/i.test(name),
    macos:name=>/\.(dmg|pkg)$/i.test(name),
    linux:name=>/\.(appimage|deb|rpm)$/i.test(name)
  };
  function verified(asset,system){
    if(!asset||typeof asset.name!=="string"||!formats[system]?.(asset.name))return false;
    try{
      const url=new URL(asset.browser_download_url);
      return url.protocol==="https:"&&url.hostname==="github.com"&&
        url.pathname.startsWith("/"+repo+"/releases/download/");
    }catch{return false}
  }
  const button=document.getElementById("smart-download");
  const label=document.getElementById("smart-download-label");
  const status=document.getElementById("smart-download-status");
  const select=document.getElementById("auto-platform");
  if(!button&&!select)return;
  const cardLinks=[...document.querySelectorAll(".platform-card")];
  function markPlatform(system){
    document.documentElement.dataset.detectedPlatform=system||"unknown";
    for(const card of cardLinks)card.classList.toggle("is-device-match",card.dataset.platform===system);
    if(select&&system)select.value=system;
  }
  function setButton(href,text,message,direct=false){
    if(button){
      button.href=href;
      button.dataset.directDownload=String(direct);
      button.setAttribute("aria-label",text);
    }
    if(label)label.textContent=text;
    if(status)status.textContent=message;
  }
  const target=platform;
  markPlatform(target);
  const fallback=()=>setButton("/download",target?"Find "+labels[target]+" installer":"Choose your device",
    "Browse official stable releases for your platform.");
  if(!target){fallback();return}
  setButton("/download","Find "+labels[target]+" download","Checking official stable releases…");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8500);
  fetch("https://api.github.com/repos/"+repo+"/releases?per_page=35",{
    signal:controller.signal,
    headers:{Accept:"application/vnd.github+json"}
  }).then(response=>{
    if(!response.ok)throw Error("Release lookup HTTP "+response.status);
    return response.json();
  }).then(data=>{
    if(!Array.isArray(data))throw Error("Invalid release response");
    const assets=data.filter(release=>!release.draft&&!release.prerelease&&
      !/nightly|canary|dev.build/i.test(String(release.name||"")+" "+String(release.tag_name||"")))
      .flatMap(release=>Array.isArray(release.assets)?release.assets:[]);
    const matches=assets.filter(asset=>verified(asset,target));
    if(!matches.length){fallback();return}
    const asset=matches[0];
    setButton(asset.browser_download_url,"Download for "+labels[target],
      "Verified stable release: "+asset.name,true);
    if(select){
      select.dataset.releaseVerified="true";
      select.dataset.selectedDownload=asset.browser_download_url;
    }
  }).catch(error=>{
    console.info("Smart download unavailable:",error.message);
    fallback();
  }).finally(()=>clearTimeout(timeout));
  // Do not replace the platform cards' existing release verification pipeline.
  // The separate primary CTA uses the exact same official source and formats.
})();
