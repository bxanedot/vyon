# Vyon Website

Standalone, responsive, interactive promotional website for **Vyon**.

This folder is intentionally isolated from the Android application source. All website assets live under **website/**. Do not move the site files into the repository root or an Android source folder.

## Contents

- **index.html** — page, demo player, release picker, metadata
- **styles.css** — responsive styles, motion, accent colors
- **app.js** — interactive particle art, local synth player, command palette, release panel
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

The download section fetches stable releases from the GitHub API and excludes experimental/prerelease builds. APK links appear only for actual published APK assets.

A private GitHub repository is **not** readable through GitHub's public releases API. For visitors without access, the release panel displays an accurate unavailable status and provides a link to GitHub. To offer public downloads, either make the repo public or publish releases elsewhere and adapt app.js. **Never embed a GitHub access token in browser code.**

## Interactive concept

The three short tracks in the preview player are generated locally using the Web Audio API. They are original synthesized demo loops, not Vyon app screenshots, music streams, or proof that a feature is shipped.

The site includes pointer-responsive particle art, a color switcher, an animated equalizer demo, keyboard navigation palette, mobile navigation, and reduced-motion support.

## License

The repository root LICENSE continues to apply. Project maintained by [bxane](https://github.com/bxanedot).
