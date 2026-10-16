package com.vyon.music.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vyon.music.data.settings.AppSettings
import com.vyon.music.data.settings.LibraryViewType
import com.vyon.music.download.Downloads

/** The shared pages' settings and downloads, answered from the phone's own stores. */
object AndroidAppUiHost : AppUiHost {
    override val swipeToPlayNext = AppSettings.swipeToPlayNext
    override val homeRecentsViewType = AppSettings.homeRecentsViewType
    override fun setHomeRecentsViewType(value: LibraryViewType) = AppSettings.setHomeRecentsViewType(value)
    override val youtubeMode = AppSettings.youtubeMode
    override fun setYouTubeMode(enabled: Boolean) = AppSettings.setYouTubeMode(enabled)
    override val speedDial = AppSettings.speedDial
    override fun toggleSpeedDial(item: com.vyon.music.data.model.ShelfItem) = AppSettings.toggleSpeedDial(item)
    override val pinnedPlaylists = AppSettings.pinnedPlaylists
    override val librarySort = AppSettings.librarySort

    @Composable
    override fun downloadedIds(): Set<String> {
        val saved by Downloads.saved.collectAsStateWithLifecycle()
        return saved.keys
    }
}
