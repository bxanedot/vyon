<div align="center">

<img src="assets/branding/vyon-feature-banner.png" alt="vyon — Music, on your terms." width="100%">

# 🤝 Contributing to vyon

### Help make listening better for everyone.

Bug fixes, new features, design improvements, translations, documentation, and careful testing all make a difference. Whether this is your first contribution or your fiftieth, you're welcome here.

[![Contributions welcome](https://img.shields.io/badge/CONTRIBUTIONS-WELCOME-c44759?style=for-the-badge&labelColor=161616)](https://github.com/bxanedot/vyon/pulls)
[![Open issues](https://img.shields.io/github/issues/bxanedot/vyon?style=for-the-badge&logo=github&logoColor=white&labelColor=161616&color=555555)](https://github.com/bxanedot/vyon/issues)
[![License GPL-3.0](https://img.shields.io/github/license/bxanedot/vyon?style=for-the-badge&labelColor=161616&color=555555)](LICENSE)

[**🎵 Project**](README.md) · [**🐛 Issues**](https://github.com/bxanedot/vyon/issues) · [**🔀 Pull requests**](https://github.com/bxanedot/vyon/pulls) · [**🛡️ Security**](SECURITY.md)

</div>

---

## ✨ Ways to contribute

You don't have to write code to help.

| Area | Examples |
| --- | --- |
| 🐛 **Bug fixes** | Playback failures, crashes, downloads, navigation, and device-specific issues |
| 🎵 **Music features** | Artist, album, playlist and single-track downloads; library; sources; lyrics; audio |
| 🎨 **Design & UX** | Accessibility, animations, responsive layouts, polished and consistent interfaces |
| 🌍 **Translations** | Improve existing strings and translations, or help expand language support |
| 📖 **Documentation** | Clearer explanations, useful screenshots, typo fixes, and troubleshooting |
| 🧪 **Testing** | Reproduce issues, add regression tests, and check behavior on supported devices |

If you're looking for something to do, start with [open issues](https://github.com/bxanedot/vyon/issues). For a larger feature or redesign, open an issue to discuss the approach before doing extensive work. That avoids duplicate effort and helps keep changes aligned with the project.

## 🐛 Reporting bugs

First, check whether someone has [already reported it](https://github.com/bxanedot/vyon/issues).

When filing a bug, please include:

- **What happened** and **what you expected instead**.
- **Steps to reproduce** — ideally the smallest repeatable example.
- **Platform and device** — e.g. Android version and phone model, Windows/macOS/Linux version, or Android TV.
- **App version** (or commit SHA), plus the relevant music source if applicable.
- **Useful evidence** — screenshots, short recordings, or **redacted** logs.

For download issues, include whether it affects a **single track, album, playlist, or artist page**, and whether the download fails, stalls, saves incorrectly, or cannot play offline. For playback issues, mention the audio format/quality or output device if relevant.

> **🔐 Security issues belong in a private report, not a public issue.** Read [SECURITY.md](SECURITY.md) for responsible disclosure instructions. Never include passwords, session cookies, authentication tokens, or private user data in bug reports.

## 💡 Suggesting features

Have an idea? [Open a feature request](https://github.com/bxanedot/vyon/issues/new) and briefly explain:

1. **The problem:** What is missing or difficult today?
2. **Your idea:** What should the user be able to do?
3. **The experience:** Where would it appear and how should it behave?
4. **The scope:** Which platforms would benefit?

Mockups, screenshots, and concrete examples are helpful. Keep requests focused on the **user experience**, not only an implementation detail.

## 🔀 Sending a pull request

1. **Check existing work.** Search issues and open PRs for the same change.
2. **Fork the repository** and create a descriptive branch from the latest `main`, e.g. `fix/android-download-queue` or `feat/desktop-lyrics`.
3. **Keep the change focused.** Avoid unrelated formatting, refactors, and dependency upgrades in the same PR.
4. **Test the affected behavior.** Add or update tests when practical and verify the change on the platforms it touches.
5. **Open a PR targeting `bxanedot/vyon:main`.** Explain what changed, why, and how you checked it.

### ✅ PR checklist

- [ ] My change addresses one clear issue or feature.
- [ ] I checked for regressions in nearby playback, downloads, or navigation flows.
- [ ] I added/updated relevant tests, or explained why tests were not practical.
- [ ] UI changes include screenshots or a short recording, when helpful.
- [ ] I documented user-visible changes that need explanation.
- [ ] I did not commit credentials, private account data, generated builds, or unrelated files.
- [ ] I included a link to the related issue, if one exists.

**Suggested PR description:**

```md
## What changed
A short description of the improvement.

## Why
The problem this solves, with an issue link if available.

## How I tested
- Platform(s) and version(s):
- Steps performed:
- Test command(s) and results:

## Screenshots
Before / after (for visible UI changes).
```

Maintainers may request changes before merging. Submission does not guarantee acceptance, and timelines can vary.

## 🗺️ Find the right part of the project

vyon shares core music logic, but not every interface is shared between platforms.

| Directory | What lives here |
| --- | --- |
| `android/app/` | Phone/tablet app, Android downloads, playback services, integrations |
| `android/wearos/` | Wear OS companion and phone/watch interactions |
| `tv/` | Android TV screens and TV-specific behavior |
| `desktop/app/` | Desktop playback, downloads, integrations, and application behavior |
| `desktop/ui/` | Desktop-specific Compose interface |
| `core/shared/` | Shared music models, catalog clients, lyrics, and playback logic |
| `core/ui/` | Shared Compose UI used by the Android/TV codebase |
| `core/native/` | Native audio components and related tooling |
| `website/` | The [vyon.live](https://vyon.live) website |
| `listen-together-server/` | Listen Together services (Cloudflare Worker and Go implementation) |

A change in `core/shared/` may affect **both desktop and Android**. A change in `core/ui/` does **not** automatically update `desktop/ui/`; those interfaces are maintained separately. Changes under `tv/` may reuse Android app sources, so check for interactions with the phone implementation.

## 🧪 Testing your changes

Use the checks relevant to your contribution — you do **not** need to run every platform's suite for a documentation-only or website-only PR.

<details>
<summary><strong>Kotlin & Android / desktop</strong></summary>

Run from the repository root with the Gradle wrapper:

```bash
# Shared JVM tests
./gradlew :shared:jvmTest

# Desktop app tests
./gradlew :desktopApp:test

# Android phone unit tests (requires an Android SDK)
./gradlew :app:testDevDebugUnitTest
```

On Windows, replace `./gradlew` with `gradlew.bat`.

The Gradle project includes Android modules only when a valid Android SDK is detected. Desktop builds use a Java 21 toolchain. Other modules and device tests may have additional requirements; use the relevant module's Gradle configuration and existing tests as a guide.

For player, download, queue, and UI changes, also test the relevant behavior manually where possible. If you could not run a check, note that in your PR rather than claiming it passed.
</details>

<details>
<summary><strong>Website</strong></summary>

```bash
cd website
npm install
npm run build
```

Check desktop and mobile layouts, links, keyboard navigation, reduced-motion behavior, and performance. The website is deployed through Vercel; please avoid breaking its static build or release-download links.
</details>

<details>
<summary><strong>Listen Together service</strong></summary>

Cloudflare Worker:

```bash
cd listen-together-server
npm install
npm run typecheck
```

Go implementation:

```bash
cd listen-together-server/go
go test ./...
```

For synchronization work, test reconnects, host/guest permissions, queue updates, and clock drift without accessing other users' rooms or accounts.
</details>

## 🧩 Code & design guidelines

- **Match the surrounding code.** Follow existing Kotlin, Compose, JavaScript/TypeScript, and Go patterns instead of introducing another style for the same feature.
- **Protect playback stability.** Queue ordering, cancellation, buffering, audio quality, and offline state should remain predictable.
- **Treat downloads as collections when appropriate.** An album or playlist batch has different library behavior from saving a single track; preserve track metadata and avoid duplicate downloads.
- **Keep interfaces platform-appropriate.** Respect Android's touch interactions, TV remote focus, desktop mouse/keyboard behavior, and watch constraints.
- **Prioritize accessibility and performance.** Label controls, keep focus/navigation usable, respect reduced motion, and avoid excessive background work or animations.
- **Make network work defensive.** External music APIs and providers can fail, change, or return incomplete metadata. Handle these cases clearly.
- **Don't introduce secrets.** Keep API keys, session data, signing keys, credentials, and local configuration out of commits.
- **Respect licensing and rights.** Preserve required third-party notices. Avoid adding copyrighted media, artwork, fonts, or proprietary code without redistribution rights.

## 💬 Community expectations

Be constructive and respectful. Focus feedback on code and behavior, explain your reasoning, and assume other contributors are acting in good faith. Harassment, discriminatory language, spam, or personal attacks are not welcome. Disagreements about design and implementation should remain technical and civil.

## 📜 License

By submitting a contribution, you agree that your submitted changes may be distributed under the project's [GNU General Public License v3.0](LICENSE), alongside any applicable third-party license obligations. Only contribute code and assets you have the rights to submit.

---

<div align="center">

**Thanks for helping build vyon.** ❤️

[![Browse issues](https://img.shields.io/badge/FIND%20AN%20ISSUE-%E2%86%92-c44759?style=for-the-badge&labelColor=161616)](https://github.com/bxanedot/vyon/issues)
[![Open a PR](https://img.shields.io/badge/OPEN%20A%20PR-%E2%86%92-333333?style=for-the-badge&labelColor=161616)](https://github.com/bxanedot/vyon/compare)

<sub>Made with ♥ by <a href="https://github.com/bxanedot">bxane</a> · <a href="https://vyon.live">vyon.live</a></sub>

</div>
