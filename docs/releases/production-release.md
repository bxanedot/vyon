# Production release procedure

## Version contract

The root Gradle build config is the source of truth for the Android version name and version code. The v1.0.0 baseline is version name 1.0.0 and version code 1. Desktop package versions are configured in desktop/app.

Every later Android release must use a version code greater than every version already distributed to users. Do not reuse a released signing key or version code.

## Required checks

Before publishing a tag:

1. Run the CI workflow and review every supported target.
2. Build Android, TV, and Wear OS release APKs with the established release key.
3. Verify each APK signature, application ID, version name, and version code.
4. Build the Windows, macOS, and Linux installers on their native runners.
5. Confirm the Windows desktop archive includes its renderer, media, window, system-media, and analysis libraries.
6. Review license notices for the exact dependency set included in each binary.
7. Confirm the website resolves the final GitHub release assets.
8. Publish only the verified installers with the v-prefixed version tag.

Do not upload unsigned Android builds, placeholder screenshots, or separate checksum files.

The tag workflow requires the repository variable `VYON_LICENSE_REVIEWED=true`. Set it only after someone has reviewed the licenses for the dependencies and native components actually shipped in every release package. The checked-in `NOTICE.md` is a source-level notice, not that release review.

## Android signing for GitHub Actions

The release workflow expects repository Actions secrets:

- ANDROID_KEYSTORE_BASE64 — base64 of the existing production keystore.
- ANDROID_KEYSTORE_PASSWORD — keystore password.
- ANDROID_KEY_ALIAS — key alias.
- ANDROID_KEY_PASSWORD — key password.

The workflow writes the keystore only to its temporary runner workspace and removes it when the job ends. Never commit the keystore or its passwords. If the original release key is unavailable, stop: a replacement key cannot update an already-distributed Android app under the same application ID.

## Release creation

Push a version tag only after all prerequisites and signing secrets are ready. The release workflow checks that the tag matches the source version, builds platform packages, verifies the Android signatures, and creates the GitHub release only after every artifact job succeeds. It does not generate or upload checksum files.
