package com.vyon.music.desktop

import com.vyon.music.data.model.SearchFilter
import com.vyon.music.data.model.SearchResult
import com.vyon.music.data.model.Song

internal object DesktopMusicSources {
    suspend fun search(query: String, filter: SearchFilter): Result<List<SearchResult>> =
        DesktopSourceRegistry.search(query, filter)

    suspend fun resolve(
        song: Song,
        qualityOverride: String? = null,
        excludedSourceId: String? = null,
        forDownload: Boolean = false,
    ): Result<DesktopStream> = DesktopSourceRegistry.resolve(song, qualityOverride, excludedSourceId, forDownload)

    /** As [resolve], but for playback: races the sources and reports what is still running. */
    suspend fun resolveLive(
        song: Song,
        qualityOverride: String? = null,
        excludedSourceId: String? = null,
    ): Result<DesktopLiveResolution> =
        DesktopSourceRegistry.resolveLive(song, qualityOverride, excludedSourceId)

    /** A second look, asked from scratch once the first one settled for nothing better. */
    suspend fun upgradeFor(song: Song, playing: DesktopStream?): DesktopStream? =
        DesktopSourceRegistry.upgradeFor(song, playing)

    /** The quality rung in force. */
    fun ceiling(qualityOverride: String? = null): DesktopAudioQuality =
        DesktopSourceRegistry.ceiling(qualityOverride)

    fun worthSwapping(candidate: DesktopStreamFormat, playing: DesktopStreamFormat?): Boolean =
        DesktopSourceRegistry.worthSwapping(candidate, playing)

    fun sourceNameFor(stream: DesktopStream): String = DesktopSourceRegistry.sourceNameFor(stream)

    fun hasYouTubeOriginal(song: Song): Boolean = DesktopSourceRegistry.hasYouTubeOriginal(song)

    fun mayServeFromAddon(song: Song): Boolean = DesktopSourceRegistry.mayServeFromAddon(song)
}
