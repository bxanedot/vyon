package com.vyon.music.desktop

import kotlin.test.Test
import kotlin.test.assertEquals

class DesktopUpdateCheckerTest {

    @Test
    fun installerSuffixesMatchPublishedPackageNames() {
        assertEquals(
            listOf("-windows-x64-setup.exe", "-windows-portable.zip"),
            DesktopUpdateChecker.installerSuffixes("Windows 11", "amd64"),
        )
        assertEquals(
            listOf(".AppImage", "-linux-amd64.deb"),
            DesktopUpdateChecker.installerSuffixes("Linux", "amd64"),
        )
        assertEquals(
            listOf("-macos-arm64.dmg", "-macos-arm64.pkg"),
            DesktopUpdateChecker.installerSuffixes("Mac OS X", "aarch64"),
        )
        assertEquals(
            listOf("-macos-x64.dmg", "-macos-x64.pkg"),
            DesktopUpdateChecker.installerSuffixes("Mac OS X", "x86_64"),
        )
        assertEquals(emptyList(), DesktopUpdateChecker.installerSuffixes("FreeBSD", "amd64"))
    }
}
