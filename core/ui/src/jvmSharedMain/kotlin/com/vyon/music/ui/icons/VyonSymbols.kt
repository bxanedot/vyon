package com.vyon.music.ui.icons
import com.composables.sfsymbols.SfSymbols
import com.composables.sfsymbols.monochrome.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccessibilityNew
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.PlayCircleOutline
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material.icons.rounded.Storage
import androidx.compose.material.icons.rounded.Tag
import androidx.compose.material.icons.rounded.Tune
/** Selected symbols vendored from cosmictaserdev-creator/Jetpack_SF_Symbols. */
object VyonSymbols {
    val Home get() = SfSymbols.Monochrome.SFHouseFill
    val Search get() = SfSymbols.Monochrome.SFMagnifyingglass
    val Library get() = SfSymbols.Monochrome.SFBooksVerticalFill
    val Settings get() = SfSymbols.Monochrome.SFGearshapeFill
    val Together get() = SfSymbols.Monochrome.SFPerson2Fill
    val Recognition get() = SfSymbols.Monochrome.SFMicrophoneFill
    val Explore get() = SfSymbols.Monochrome.SFSafari
    val Play get() = SfSymbols.Monochrome.SFPlayFill
    val Pause get() = SfSymbols.Monochrome.SFPauseFill
    val Next get() = SfSymbols.Monochrome.SFForwardEndFill
    val Previous get() = SfSymbols.Monochrome.SFBackwardEndFill

    // SF symbols remain first choice when the selected Jetpack catalog includes them;
    // these fall back to Material Symbols Rounded where the catalog has no match.
    val Appearance get() = Icons.Rounded.Palette
    val Language get() = Icons.Rounded.Language
    val Accessibility get() = Icons.Rounded.AccessibilityNew
    val Notifications get() = Icons.Rounded.Notifications
    val Playback get() = Icons.Rounded.PlayCircleOutline
    val Privacy get() = Icons.Rounded.Security
    val DataStorage get() = Icons.Rounded.Storage
    val Advanced get() = Icons.Rounded.Tune
    val About get() = Icons.Rounded.Info
    val Back get() = Icons.Rounded.ChevronLeft
    val Navigate get() = Icons.Rounded.ChevronRight
    val Website get() = Icons.Rounded.Language
    val Credits get() = Icons.Rounded.Favorite
    val Version get() = Icons.Rounded.Tag
}
