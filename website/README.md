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

## Motion and accessibility

Logo debris uses a fixed 120 Hz physics step with interpolated rendering, so falling and collisions stay visually consistent at different screen refresh rates. Text reactions are gentler and rate-limited. Section reveals, command palette, mobile menu, FAQ answers, buttons, social cards, and EQ presets use coordinated easing; the equalizer curve applies time-based exponential smoothing instead of frame-dependent interpolation. `prefers-reduced-motion` continues to disable decorative movement.


## Design polish and browser testing

The current site deliberately remains **vanilla HTML/CSS/JavaScript**. The
ambient lighting on the homepage and the SEO guide pages takes inspiration
from Shader Gradient and the principles behind React Bits, Taste Skill and
Emil Kowalski's motion guidance, but uses composited CSS animation rather than
loading another JavaScript renderer. The original particle canvas and its
interactions are unchanged. Motion stops under `prefers-reduced-motion`, and
mobile guide pages avoid an expensive sticky blur.

Avoid adding R3F, Spline, Shader/WebGPU renderers, Lenis or GSAP by default:
only introduce one when there is a specific interaction that native CSS/Canvas
cannot express clearly, a reduced-motion fallback, and verified mobile
performance. Preserve the Vyon logo, color palette, typography and accessible
navigation.

Pull requests changing `website/**` run browser checks in
`.github/workflows/website-browser.yml`. Playwright verifies the homepage,
desktop/mobile navigation, all five SEO guides and reduced-motion behavior.
The runner is installed in CI only; it is not included in the deployed bundle.

To reproduce the browser checks locally (requires Python 3):

```sh
cd website
npm ci
npm run build
npm install --no-save --package-lock=false @playwright/test@1.56.1
npx playwright install chromium
npx playwright test --config=playwright.config.mjs
```


## Premium editorial website layer

The homepage keeps all original platform downloads, real screenshot placeholders,
the interactive ten-band equalizer, the particle logo and falling-dot physics,
saved accent themes, the Liquid Glass toggle, the command palette, community
links, FAQ, visitor counts and SEO navigation.

\`studio.css\` adds a consistent editorial layout system on top of the existing
homepage styles: restrained accent-reactive atmospheres, a refined floating
header, clearer section hierarchy, product-style platform cards, gallery framing,
and tactile yet subtle interaction feedback. The original IDs and JS events are
unchanged. The stylesheet loads last so it can unify legacy visual treatments
without replacing the underlying functionality. It has no network resources,
fonts, shaders, JavaScript, or WebGPU dependency.

Do not remove \`studio.css\` from \`build-vercel.mjs\`: it must be copied and
minified for Vercel's \`dist/\`. The production smoke test and Playwright
browser suite assert its presence, mobile text bounds, and interaction
continuity.

To preview the website, serve the built \`dist/\` directory over HTTP. Opening
\`website/index.html\` directly with \`file://\` is **not supported**: root-relative
\`/styles.css\`, scripts and icons require a web server and will appear unstyled
otherwise. See the local build commands above.


## Sonic Dimension redesign (WebGL2 + optional Rive)

The hero contains a **real fragment-shader 3D sculpture**, raymarched with
multiple interlocking toroidal signed-distance fields, calculated surface
normals, specular highlights, Fresnel lighting, and the visitor's chosen
accent color. It is not a screenshot or a CSS 3D imitation. The renderer uses
WebGL2 only while the hero is visible. It pauses on tab backgrounding and
automatically falls back to a fully CSS-rendered three-ring sculpture on
devices without WebGL2, reduced-motion requests, Data Saver, or constrained
devices. The fallback must remain visually complete.

The original physics-powered dotted logo is **preserved**, not replaced: it
lives in the new dedicated `#particle-lab` installation. All of its
interactions and original IDs remain. Downloads, equalizer, FAQ, themes, the
Liquid Glass toggle, counters, gallery, and SEO routes still use the original
JavaScript.

`dimension.css` intentionally remakes the layout, while `sonic-scene.js`
supplies the GPU scene. Both files are copied to `dist/` by
`build-vercel.mjs`. Do not inline runtime dependencies or insert remote
shader frameworks.

### Branded Rive animations

`rive-studio.js` provides a **real, lazy Rive Canvas Lite runtime integration**
that activates only if a locally hosted, genuine `.riv` animation is assigned
to the `data-rive-src` attribute on `.rive-motion-slot`. Export your
interactive Vyon motion piece from the Rive editor, publish it within the
`website/` static assets, add the path to the build's public file list, then
set its state machine via `data-rive-state-machine`. The runtime downloads
only when this visible artwork exists; a missing asset never creates a broken
widget. No fake `.riv` file is generated.

Sitereel.ai provides layout/art-direction prompt references rather than a
runtime. Manus.im is an independent agent/web-builder, not a client-side
animation library. The Vyon site remains owned, editable source code.

### Test gates

Run `npm run build` from `website/` to run the production smoke checks.
The browser CI additionally checks desktop/mobile content, the WebGL scene's
presence and fallback behavior, keyboard navigation, and the existing audio
and theme interactions. Chrome screenshots are attached to the browser
workflow for visual inspection before merging.

### Anime.js motion art direction

`anime-motion.js` loads the pinned **Anime.js v4.5.0 ES module** on capable,
motion-enabled browsers. It orchestrates a staggered hero entrance, a
one-time particle-lab editorial reveal and gentle download-card arrival.
The actual particle physics, WebGL shader, equalizer and legacy `.reveal`
logic are deliberately not controlled by Anime.js, avoiding competing
transforms. If the CDN is unreachable, the site renders normally; the
animation enhancement is optional. Reduced-motion and Data Saver opt out.
