# vyon website

vyon is an Android music player that uses YouTube Music as its backend. This directory contains its standalone compact website, official screenshot gallery, creator icons, Android APK download panel, and browser-based Listen Together. Android project files are unchanged.

## Directory

- index.html, styles.css, compact.css, app.js — responsive marketing website
- icons/*.svg — bundled social SVGs and custom Guns.lol monogram
- screenshots/ — real Android screenshots (not fabricated)
- listen/index.html, listen/listen.css, listen/listen.js — browser listening room
- server/worker.js — Cloudflare Durable Object WebSocket room server
- wrangler.jsonc — one-worker static assets and room binding
- .assetsignore — excludes private server files from public static assets

## Auto deployment to Cloudflare

Cloudflare **Workers with Static Assets** is required for the live WebSocket rooms. Static-only Cloudflare Pages hosting cannot run this Worker.

One-time account setup:

1. Create a scoped Cloudflare API token with permissions to deploy Workers and use Durable Objects.
2. In GitHub repository bxanedot/vyon > Settings > Secrets and variables > Actions, add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
3. Use Actions > Deploy vyon website and Listen Together > Run workflow once. All later main-branch changes inside website/ automatically redeploy both the site and the room server.
4. Configure a custom domain for the vyon-web Worker in Cloudflare if desired. Use its workers.dev URL initially if enabled.
5. If the domain is already linked to Cloudflare Pages, migrate that domain to the Worker. Do not attach it to both simultaneously.

GitHub Actions skips deployment until the credentials have been set. No Cloudflare account access or secrets are available to this chat, so the workflow is configured but not yet active on a Cloudflare account.

Manual alternative: from inside website/, run npx wrangler@latest deploy after logging in. For local full-stack development, run npx wrangler@latest dev. A basic Python static HTTP server can preview only the marketing site, not the listening rooms.

## Listen Together

At /listen/ a host creates a room and shares an invite link. The host can select a direct public HTTPS audio URL (mp3, m4a, ogg, oga, wav or aac), then play, pause and seek in synchronization. Guest browsers fetch audio from the original source and use WebSockets for synchronization. Users must enable audio manually when their browser blocks autoplay.

Room state is stored in Cloudflare Durable Objects and expires after seven days of inactivity. Room capacity is 24 connections. Host authorization uses a randomly generated secret stored in the creator's sessionStorage, separate from the shared invite link. Anybody with an invite can listen. The server does NOT store or proxy copyrighted music or share private/local media files. Use media that you have permission to share. It does not yet sync Android APK playback.

## Screenshot setup

Add real vyon APK captures at these exact paths:

- website/screenshots/home.webp
- website/screenshots/now-playing.webp
- website/screenshots/library.webp

The website shows labeled empty placeholders until the images exist and expands real images on click. Never use made-up app screenshots.

## Music source and affiliation

vyon uses **YouTube Music as its music backend**; the website must not describe vyon as an independent music service or imply it hosts its own music catalogue. The separate website-based Listen Together prototype uses public direct HTTPS audio URLs and is **not** yet integrated with YouTube Music or the Android player.

## Releases

APK ONLY: the download section checks GitHub's stable releases and offers a download only if a real Android .apk asset is present. There is no Nightly channel or desktop distribution. Private GitHub releases may be inaccessible to site visitors through the public GitHub API.

## Theme, socials, inspiration

Your color, your mood switches violet, lime, coral, and ice across entire site backgrounds, foreground accents, navigation and cards; preferences persist in localStorage. The layout is deliberately shorter than the original, inspired by public visual patterns at xan.lat without copying source.

Icon links: https://guns.lol/bxane · https://ko-fi.com/bxane · https://patreon.com/bxane · https://discord.gg/h4Wsu824Uf · https://t.me/+T9avk7iJ7_YyN2Rk

The root LICENSE still applies. Maintained by bxane (https://github.com/bxanedot).

## Hidden listening-room page

The existing browser-based Listen Together implementation remains available only when someone knows the direct `/listen/` URL. The public website no longer links to or advertises it (including header, mobile navigation, hero, feature cards and command menu). The room page has a `noindex,nofollow` robots instruction, but it is **not access-controlled**. Anyone who knows or guesses the URL may still open it.

## Sound dot and matte finish

Sphere, Halo and Wave now have a fourth **Sound** mode: a pulsing particle-based radial waveform visualization. It is decorative; it does not ask for microphone access or access YouTube Music playback. The grain overlay and tinted background gradients are removed in favor of a matte-black page while theme accents stay functional.

## guns.lol icon

The guns.lol profile card now uses the official guns.lol apple-touch icon from `https://assets.guns.lol/favicon/apple-touch-icon.png`, not the previous hand-drawn glyph. It is served by guns.lol's asset host.

## Brand casing

The displayed project name is consistently written as **vyon** in lowercase. Other proper names (for example YouTube Music and Patreon) retain their original capitalization.

## Simplified public layout (October 2026)

The marketing website retains a **fixed matte-black header** that stays in view while scrolling. The footer has been removed. The public header and command navigation no longer feature a Connect link; creator support and social cards remain lower on the page. Browser Listen Together stays unadvertised and accessible only by its direct URL.

The hero uses a **single vyon particle silhouette** derived from the original waveform icon artwork. The separate overlaid image and alternate Sphere/Halo/Wave/Sound selectors have been removed. Clicking or pressing Enter/Space on the particle silhouette accelerates its rotation from a gentle ~18 degrees per second (30% of 60°/s) to ~48 degrees per second (80%), then smoothly reduces it to its normal pace. Reduced-motion settings stop continuous spinning.
