# vyon website

The website for **vyon**, a music player powered by YouTube Music for Windows, macOS, Linux and Android. iOS/iPadOS are not supported.

## Hosting: Vercel only

The live site uses **https://vyon.live**, hosted on Vercel with HTTPS and automatic deployment from the `main` branch of `bxanedot/vyon`. `www.vyon.live` redirects permanently to the main address.

Import the repository into Vercel with **Root Directory: `website`**, framework **Other**. The repository's `website/vercel.json` runs `npm run build`, which bundles the public static assets and Vercel Analytics in `website/dist/`. No server runtime or secret credentials are needed for the marketing site. The built `dist/` directory is generated at deploy time and ignored by Git.

To test the site locally, run `npm install` and `npm run build` inside `website/`, then serve the generated `dist/` directory using a local static web server.

## Social sharing previews

Discord, Telegram, X and other Open Graph-compatible link previews use a
single 1200 × 630 PNG at `https://vyon.live/vyon-social-preview.png`.
The page defines absolute `og:url`, `og:image`, secure image URL, canonical
link and X's `summary_large_image` card metadata. The Vercel build does not
rewrite these to temporary preview-deployment hostnames. Instagram may choose
not to show a link preview depending on the surface and app behavior; this
cannot be forced with metadata.

To inspect social metadata on a deployment, open its **Open Graph** tab in
Vercel. Platform caches may require time before updating.

## Web Analytics

`@vercel/analytics` is bundled from `analytics-entry.js` and injected into the generated HTML by `build-vercel.mjs`. This is a plain HTML/JavaScript site, so no Next.js or React component is used. Enable Analytics in the project's Vercel dashboard to start collecting page views.

## Live visitor counters

Under the Get vyon button the site shows **online now** (browser sessions active within the last 90 seconds) and **total visits** (new browser session IDs seen since activation). The source of truth is a private, RLS-protected set of tables in the existing Vyon Supabase project. A CORS-restricted Supabase Edge Function records session heartbeats and returns aggregate counts. No database secrets are shipped in browser JavaScript. Counts are not retroactive and can be affected by content blockers, multiple tabs, session resets and automated traffic. Refresh every 30 seconds while the page is visible.

## Interactive particles

- The dot-built logo stays still until clicked or dragged. Clicking breaks off a cluster; dragging removes only the individual dots touched.
- Click an emptied logo area to create a dotted heart, then click the heart to collapse its dots with the same gravity physics. The interaction can repeat.
- **Click blank space anywhere on the page:** a compact cloud of dots appears at the pointer and immediately breaks into independently falling bodies. Links, controls, images and text do not trigger this effect.
- Each falling dot has its own collision radius, mass, bounce and friction. Dots collide with one another, bounce off text, and settle near the bottom of the page. Text has a brief spring reaction on impact.
- Decorative dots are applied to the website's buttons. Normal controls work on their first activation; a second activation releases the button decoration into falling particles.
- The physics overlay does not intercept page interactions. The `prefers-reduced-motion` setting skips falling and transition animation.

## Downloads

Official stable GitHub Releases are inspected for Windows (EXE/MSI/MSIX), macOS (DMG/PKG), Linux (AppImage/DEB/RPM), and Android (APK). The site only links directly to verified published installers, otherwise showing the official Releases page. No downloads are fabricated.

## Screenshots and branding

- The header uses the transparent white `icons/vyon-logo.png`. Browser favicon uses `favicon.svg`.
- Genuine Android screenshots belong at `screenshots/home.webp`, `screenshots/now-playing.webp`, and `screenshots/library.webp`. If missing, the website displays honest placeholders, not generated screenshots.
- The original theme accents, equalizer demo, links to creator/community profiles, FAQ, and social preview are preserved.

The app uses YouTube Music as its backend and is not affiliated with YouTube. The root repository `LICENSE` applies.
