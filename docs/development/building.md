# Build and check vyon

## Prerequisites

- JDK 21 for desktop; use the repository Gradle wrapper.
- Android SDK for the phone, TV, and Wear OS targets.
- Node.js 24 and npm for the website and Cloudflare Worker.
- Go 1.27 for the Go service.

## Kotlin and Android

From the repository root:

    ./gradlew :shared:jvmTest :desktopApp:test

With an Android SDK configured:

    ./gradlew :app:testDevDebugUnitTest
    ./gradlew :app:assembleProdRelease :tv:assembleProdRelease :wearos:assembleProdRelease

On Windows, use gradlew.bat in place of gradlew.

Android release builds are not distributable unless they are signed with the project's release key. See releases/production-release.md.

## Website

    cd website
    npm ci
    npm run build

The build includes route, metadata, link, JavaScript, and generated asset smoke checks.

## Listen Together services

Cloudflare Worker:

    cd listen-together-server
    npm ci
    npm run typecheck

Go service:

    cd listen-together-server/go
    go test -count=1 ./...

## Desktop installers

The Compose desktop module exposes native package tasks for MSI and EXE on Windows, DMG and PKG on macOS, and DEB and RPM on Linux. Windows packaging also depends on the MinGW C++ toolchain, CMake, and Ninja to produce its native bridges.
