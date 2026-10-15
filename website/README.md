# Vyon Website

Standalone, responsive, interactive promotional website for **Vyon**.

This folder is intentionally isolated from the Android application source. All website assets live under **website/**. Do not move the site files into the repository root or an Android source folder.

## Contents

- **index.html** — page, demo player, release picker, metadata
- **styles.css** — original responsive layout and interactive component styling
- **premium.css** — editorial design system, responsive refinements, and high-end surface treatments
- **app.js** — morphing Orbit/Halo/Wave particle art, local synth player, command palette, scroll feedback, stable release panel
- **favicon.svg** — site icon
- **_headers** — Cloudflare Pages response headers

## Deploy on Cloudflare Pages

1. Go to **Cloudflare → Workers & Pages → Create → Pages → Connect to Git**.
2. Connect GitHub and select **bxanedot/vyon**. Because it is private, grant Cloudflare access to this repo.
3. Production branch: **main**.
4. **Root directory**: **website**.
5. **Framework preset**: **None**.
6. **Build command**: leave it blank.
7. **Build output directory**: **.** (the current website directory).
8. Deploy. You can then add a custom domain in Cloudflare Pages settings.

Everything is static: no npm, Node, bundler, GitHub API token, or Android build dependencies needed.

## Preview locally

From the website directory run:

    python -m http.server 8788

Then open http://localhost:8788 in a browser.

## Release integration

The download section shows **stable releases only**, fetching published non-prerelease builds from the GitHub API and excluding experimental releases. APK links appear only for actual published APK assets.

A private GitHub repository is **not** readable through GitHub's public releases API. For visitors without access, the release panel displays an accurate unavailable status and provides a link to GitHub. To offer public downloads, either make the repo public or publish releases elsewhere and adapt app.js. **Never embed a GitHub access token in browser code.**

## Interactive concept

The three short tracks in the preview player are generated locally using the Web Audio API. They are original synthesized demo loops, not Vyon app screenshots, music streams, or proof that a feature is shipped.

The site includes a custom particle sculpture with three working formations (Orbit, Halo, Wave), pointer-responsive surfaces, accent palette switching, a locally synthesized audio preview, a scroll progress bar, an animated equalizer, a keyboard navigation palette, responsive layouts, and reduced-motion support.

## License

The repository root LICENSE continues to apply. Project maintained by [bxane](https://github.com/bxanedot).

## Design notes

The site uses an original black-and-silver editorial direction with a restrained color accent and the Instrument Serif typeface. The animated player and abstract album art are clearly labelled as a design concept, not screenshots of the Android application.

All website-specific changes, including the premium design layer, stay inside this folder. The Android application, its Gradle setup, and the root license are not modified.
