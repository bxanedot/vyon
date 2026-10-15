# Vyon website

Vyon's standalone compact website, official screenshot gallery, creator icons, Android APK download panel, and browser-based Listen Together. Android project files are unchanged.

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
3. Use Actions > Deploy Vyon website and Listen Together > Run workflow once. All later main-branch changes inside website/ automatically redeploy both the site and the room server.
4. Configure a custom domain for the vyon-web Worker in Cloudflare if desired. Use its workers.dev URL initially if enabled.
5. If the domain is already linked to Cloudflare Pages, migrate that domain to the Worker. Do not attach it to both simultaneously.

GitHub Actions skips deployment until the credentials have been set. No Cloudflare account access or secrets are available to this chat, so the workflow is configured but not yet active on a Cloudflare account.

Manual alternative: from inside website/, run npx wrangler@latest deploy after logging in. For local full-stack development, run npx wrangler@latest dev. A basic Python static HTTP server can preview only the marketing site, not the listening rooms.

## Listen Together

At /listen/ a host creates a room and shares an invite link. The host can select a direct public HTTPS audio URL (mp3, m4a, ogg, oga, wav or aac), then play, pause and seek in synchronization. Guest browsers fetch audio from the original source and use WebSockets for synchronization. Users must enable audio manually when their browser blocks autoplay.

Room state is stored in Cloudflare Durable Objects and expires after seven days of inactivity. Room capacity is 24 connections. Host authorization uses a randomly generated secret stored in the creator's sessionStorage, separate from the shared invite link. Anybody with an invite can listen. The server does NOT store or proxy copyrighted music or share private/local media files. Use media that you have permission to share. It does not yet sync Android APK playback.

## Screenshot setup

Add real Vyon APK captures at these exact paths:

- website/screenshots/home.webp
- website/screenshots/now-playing.webp
- website/screenshots/library.webp

The website shows labeled empty placeholders until the images exist and expands real images on click. Never use made-up app screenshots.

## Releases

APK ONLY: the download section checks GitHub's stable releases and offers a download only if a real Android .apk asset is present. There is no Nightly channel or desktop distribution. Private GitHub releases may be inaccessible to site visitors through the public GitHub API.

## Theme, socials, inspiration

Your color, your mood switches violet, lime, coral, and ice across entire site backgrounds, foreground accents, navigation and cards; preferences persist in localStorage. The layout is deliberately shorter than the original, inspired by public visual patterns at xan.lat without copying source.

Icon links: https://guns.lol/bxane · https://ko-fi.com/bxane · https://patreon.com/bxane · https://discord.gg/h4Wsu824Uf · https://t.me/+T9avk7iJ7_YyN2Rk

The root LICENSE still applies. Maintained by bxane (https://github.com/bxanedot).
