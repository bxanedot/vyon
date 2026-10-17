# Architecture overview

vyon is a Kotlin and Compose music player with shared playback and catalog logic, platform-specific interfaces, a static website, and two Listen Together service implementations.

## Source layout

| Path | Responsibility |
| --- | --- |
| android/app | Phone and tablet app, media service, Android integrations, and native decoders |
| android/wearos | Wear OS companion |
| tv | Android TV app |
| desktop/app | Desktop application, JVM playback, packaging, and native bridges |
| desktop/ui | Desktop-specific Compose UI |
| core/shared | Shared catalog, playback, data, and music models |
| core/ui | Compose UI shared by Android and TV |
| core/native | Platform-neutral audio analysis sources used by Android and desktop |
| desktop/platforms | Windows, macOS, and Linux packaging assets and native code |
| website | Static website and release-asset discovery |
| listen-together-server | Cloudflare Worker and Go service implementations |

The Gradle settings include Android modules only when an Android SDK is available. A desktop-only checkout can still configure the shared and desktop targets.

## Release path

The Android, TV, and Wear OS apps share the root version name and version code. Desktop package versioning is configured by the desktop module. The website discovers only published GitHub release assets; it does not host installers itself.

Listen Together exchanges room and playback state. It does not host audio.
