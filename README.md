<p align="center">
  <img src="assets/branding/vyon-feature-banner.png" alt="vyon — Music, on your terms." width="100%">
</p>

<h1 align="center">vyon</h1>

<p align="center"><strong>Music, on your terms.</strong></p>

<p align="center">
  An open-source, cross-platform music player powered by YouTube Music.<br>
  Built for the way you listen, from your phone to your desktop and TV.
</p>

<p align="center">
  <a href="https://vyon.live">Website</a> ·
  <a href="https://github.com/bxanedot/vyon/releases">Downloads</a> ·
  <a href="https://github.com/bxanedot/vyon/issues">Issues</a> ·
  <a href="#building-from-source">Build from source</a>
</p>

---

## About

**vyon** is a music player built around a custom listening experience: a YouTube Music-powered catalog, expressive interfaces, and deep playback controls. The project includes native Android and Android TV apps, a Compose Multiplatform desktop app for Windows, macOS, and Linux, a Wear OS companion, a marketing website, and optional listening-room infrastructure.

The platform apps share music data and playback-related code, but their interfaces and supported integrations can differ.

## Highlights

- **Your music, your way** — browse, search, play, queue, and organize music from the YouTube Music catalog, with a music/video playback switch.
- **A player that feels alive** — album-art-driven visuals, polished transitions, and dynamic artwork treatments.
- **Lyrics, in sync** — synchronized lyric display and support for multiple lyrics providers and formats.
- **More control over sound** — equalizer, loudness processing, crossfade, and smart/Automix transition logic, with platform-dependent audio capabilities.
- **More than one music source** — local media and additional source integrations, including SMB and WebDAV support in the Android codebase.
- **Connected listening** — optional Listen Together rooms, Discord presence, and listening-history/scrobbling integrations.
- **Made for different screens** — tailored desktop, touch, TV, and watch experiences instead of a single stretched layout.

> **Note:** Individual features depend on the platform, music source, device capabilities, and configured services. This is not an official YouTube or YouTube Music application.

## Platforms

| Platform | Project | Notes |
| --- | --- | --- |
| Android phones & tablets | `android/app` | Native Android app; Android 8.0+ (API 26) |
| Android TV | `tv` | Dedicated TV interface; Android 8.0+ (API 26) |
| Windows | `desktop/app` + `desktop/ui` | Compose Desktop app |
| macOS | `desktop/app` + `desktop/ui` | Compose Desktop app |
| Linux | `desktop/app` + `desktop/ui` | Compose Desktop app |
| Wear OS | `android/wearos` | Companion to the Android phone app; Wear OS 3+ (API 30) |

**iOS and iPadOS are not supported.** Platform source code does not necessarily mean a prebuilt installer is available for that platform.

## Download

Get published builds from the **[GitHub Releases page](https://github.com/bxanedot/vyon/releases)**, or visit **[vyon.live](https://vyon.live)** to find available downloads for your device.

Only download installers from sources you trust. The website links to a direct installer only when it can verify a matching published release asset.

## Building from source

### Prerequisites

- **Git**
- **JDK 21** for the desktop build (the Gradle wrapper supplies Gradle 9.3.1)
- **Android Studio / Android SDK** for Android, TV, or Wear OS builds; install the SDK platforms and native CMake components requested by the Android project
- An internet connection to resolve Gradle dependencies

The project uses Kotlin, Jetpack Compose, Compose Multiplatform, Android Media3, and shared Kotlin Multiplatform modules.

### 1. Clone

```bash
git clone https://github.com/bxanedot/vyon.git
cd vyon
```

### 2. Desktop (Windows, macOS, Linux)

Run the app from the repository root:

```bash
./gradlew :desktopApp:run
```

On Windows, use `gradlew.bat :desktopApp:run`.

The desktop app uses a Java 21 toolchain. Platform-specific native audio and packaging tools may require additional dependencies; see `desktop/app/build.gradle.kts` and the corresponding `desktop/<platform>/` folder. Native installer generation is OS-specific.

### 3. Android

Configure an Android SDK in Android Studio, or set `ANDROID_HOME` / `ANDROID_SDK_ROOT`. A valid `sdk.dir` entry in the ignored root `local.properties` also works.

Build the phone development APK:

```bash
./gradlew :app:assembleDevDebug
```

Build the TV or watch development APK:

```bash
./gradlew :tv:assembleDevDebug
./gradlew :wearos:assembleDevDebug
```

The `dev` Android variants use separate application IDs so that development and production installations can coexist. Without a detected Android SDK, `settings.gradle.kts` only includes the desktop application targets.

> Release APK signing requires private keystore configuration. Never commit `keystore.properties`, keystores, credentials, or `local.properties`.

### 4. Optional configuration

Some integrations need configuration before they can work. The Android and desktop builds read applicable values from local properties or environment variables, including:

| Setting | Purpose |
| --- | --- |
| `LASTFM_API_KEY` | Last.fm integration |
| `LASTFM_SECRET` | Last.fm request signing |
| `LISTEN_TOGETHER_SERVER` | Default address for a listening-room server |
| `MODULE_INDEX_URL` | Optional desktop source-module index |

These settings are optional for a basic local build. Consult the source for integration-specific setup; do not publish secrets.

## Project structure

```text
vyon/
├── android/
│   ├── app/                  # Android phone and tablet app
│   └── wearos/               # Wear OS companion
├── tv/                       # Android TV experience
├── desktop/
│   ├── app/                  # Desktop application and packaging
│   ├── ui/                   # Desktop-specific Compose UI
│   ├── windows/
│   ├── macos/
│   └── linux/
├── core/
│   ├── shared/               # Shared models, clients, playback logic
│   ├── ui/                   # Shared Compose interface components
│   └── native/               # Native audio-related sources/tools
├── website/                  # vyon.live marketing website
├── listen-together-server/   # Cloudflare Worker and Go server sources
├── assets/                   # Artwork and branding
└── README.md
```

### Website

The website is a static HTML/CSS/JavaScript project, built with Node.js tooling and deployed separately to Vercel.

```bash
cd website
npm install
npm run build
```

Serve `website/dist/` with a local static server to preview the production build. For hosting, analytics, visitor counters, and the interactive particle effects, see **[website/README.md](website/README.md)**.

### Listen Together

`listen-together-server/` contains listening-room synchronization services, including a Cloudflare Worker/Durable Objects implementation and a separate Go server. These services exchange playback metadata and state; **they do not stream music or redistribute audio**.

See **[listen-together-server/README.md](listen-together-server/README.md)** for the Worker setup, API, and security limitations. Server deployment and app integration are separate from installing the player.

## Contributing

Issues, bug reports, and pull requests are welcome. Before submitting a change:

1. Check the existing [issues](https://github.com/bxanedot/vyon/issues).
2. Keep changes scoped to the relevant platform or shared module.
3. Describe the behavior you changed and how you tested it.
4. Avoid committing generated builds, local settings, signing material, or API secrets.

## License & disclaimer

This repository is distributed under the **[GNU General Public License v3.0](LICENSE)**. Some bundled components and dependencies have their own licenses and notices; keep those notices intact.

vyon is an independent project and is **not affiliated with, endorsed by, or sponsored by Google or YouTube**. YouTube and YouTube Music are trademarks of their respective owners.

<p align="center">
  Made with ♥ by <a href="https://github.com/bxanedot">bxane</a>.
</p>
