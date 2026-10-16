![vyon](assets/branding/vyon-feature-banner.png)

# vyon

Your music, your way. Android, Android TV and desktop music playback with a Music / YouTube video switch.

## Project layout

```
android/       Phone app and companion watch module
  app/
  wearos/
tv/            Android TV app
core/          Shared data, UI and native audio analysis
  shared/
  ui/
  native/
desktop/
  app/         Shared desktop application
  ui/          Desktop Compose pages
  windows/     Windows icons, native bridge and toolchain
  linux/       Linux icon and AppImage packaging
  macos/       macOS icon and packaging notes
website/       Website integration location
assets/
  branding/    New supplied icon packs and approved banners
docs/          Product specification and third-party licenses
listen-together-server/ Listen Together Cloudflare Worker and reserved Go server source
```
