package com.vyon.music.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.PlaybackException
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MergingMediaSource
import androidx.media3.ui.PlayerView
import com.vyon.youtube.*

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
@Composable
fun VyonVideoPlayer(video: YouTubeVideo, onClose: () -> Unit) {
    val context = LocalContext.current
    val player = remember { ExoPlayer.Builder(context).build() }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, player) {
        val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_PAUSE) player.pause() }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    var error by remember(video.id) { mutableStateOf<String?>(null) }
    var loading by remember(video.id) { mutableStateOf(true) }
    var retry by remember(video.id) { mutableIntStateOf(0) }
    var usedClient by remember { mutableStateOf<String?>(null) }
    var excluded by remember { mutableStateOf<String?>(null) }
    BackHandler(onBack = onClose)
    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onPlayerError(exception: PlaybackException) {
                loading = false
                if (retry == 0) { excluded = usedClient; retry++ } else error = exception.message ?: "The video couldn't be played."
            }
            override fun onPlaybackStateChanged(state: Int) { if (state == Player.STATE_READY) loading = false }
        }
        player.addListener(listener)
        onDispose { player.removeListener(listener); player.release() }
    }
    LaunchedEffect(video.id, retry) {
        player.stop(); loading = true; error = null
        FlowYouTubeRepository.resolve(video.id, excludedClient = excluded).onSuccess { stream ->
            usedClient = stream.client
            val http = DefaultHttpDataSource.Factory().setDefaultRequestProperties(stream.headers)
            val factory = DefaultMediaSourceFactory(DefaultDataSource.Factory(context, http))
            val picture = factory.createMediaSource(MediaItem.fromUri(stream.videoUrl))
            val source = stream.audioUrl?.let { MergingMediaSource(picture, factory.createMediaSource(MediaItem.fromUri(it))) } ?: picture
            player.setMediaSource(source); player.prepare(); player.playWhenReady = true
        }.onFailure { error = it.message ?: "Video playback is unavailable"; loading = false }
    }
    Box(Modifier.fillMaxSize().background(Color.Black).windowInsetsPadding(WindowInsets.safeDrawing)) {
        AndroidView(factory = { PlayerView(it).apply { this.player = player; useController = true; keepScreenOn = true; isFocusable = true; requestFocus() } }, modifier = Modifier.fillMaxSize())
        Row(Modifier.fillMaxWidth().background(Color.Black.copy(alpha = .6f)).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onClose) { Text("Back", color = Color.White) }
            Text(video.title, color = Color.White, maxLines = 1, modifier = Modifier.weight(1f))
        }
        if (loading) CircularProgressIndicator(Modifier.align(Alignment.Center))
        error?.let { message -> Column(Modifier.align(Alignment.Center).background(Color.Black.copy(alpha = .85f)).padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(message, color = Color.White)
            Button(onClick = { excluded = null; retry++ }) { Text("Retry") }
            TextButton(onClick = onClose) { Text("Back to videos") }
        } }
    }
}
