package com.vyon.music.desktop

import androidx.compose.ui.graphics.Color
import kotlin.test.Test
import kotlin.test.assertEquals

class DesktopColorSchemeTest {
    @Test
    fun accentForegroundKeepsDarkAndLightArtworkReadable() {
        val original = DesktopAccent
        try {
            DesktopAccent = Color(0xFFC8102E)
            assertEquals(Color.White, desktopColorScheme().onPrimary)

            DesktopAccent = Color.White
            assertEquals(Color.Black, desktopColorScheme().onPrimary)
        } finally {
            DesktopAccent = original
        }
    }
}
