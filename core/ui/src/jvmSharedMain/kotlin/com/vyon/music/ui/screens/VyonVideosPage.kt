package com.vyon.music.ui.screens

import com.vyon.music.ui.components.VyonLogo
import com.vyon.music.data.innertube.Innertube
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.vyon.music.sharedui.resources.*
import com.vyon.music.ui.icons.VyonSymbols
import com.vyon.youtube.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun VyonVideosPage(onMusic: () -> Unit, onVideo: (YouTubeVideo) -> Unit, onSettings: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    var query by rememberSaveable { mutableStateOf("") }
    var submitted by rememberSaveable { mutableStateOf("") }
    var page by remember { mutableStateOf<YouTubeVideoPage?>(null) }
    var failure by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var suggestions by remember { mutableStateOf<List<String>>(emptyList()) }
    var refresh by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()
    val loadFailure = stringResource(Res.string.vyon_video_failure)
    val keyboard = LocalSoftwareKeyboardController.current
    val focus = LocalFocusManager.current
    fun submit(value: String) {
        query = value.trim(); submitted = query; suggestions = emptyList(); refresh++
        keyboard?.hide(); focus.clearFocus()
    }
    LaunchedEffect(submitted, refresh) {
        loading = true; failure = null; page = null
        val result = if (submitted.isBlank()) FlowYouTubeRepository.home() else FlowYouTubeRepository.search(submitted)
        result.onSuccess { page = it }.onFailure { failure = it.message ?: loadFailure }
        loading = false
    }
    LaunchedEffect(query) { suggestions = emptyList(); if (query.isNotBlank() && query != submitted) { delay(280); suggestions = FlowYouTubeRepository.suggestions(query) } }
    Surface(modifier = modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background, contentColor = MaterialTheme.colorScheme.onBackground) {
    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("vyon", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.weight(1f))
            FilterChip(selected = false, onClick = onMusic, label = { Text(stringResource(Res.string.vyon_music)) })
            FilterChip(colors = FilterChipDefaults.filterChipColors(selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = .18f), selectedLabelColor = MaterialTheme.colorScheme.primary), selected = true, onClick = {}, label = { Text("YouTube") })
            onSettings?.let { IconButton(onClick = it) { Icon(VyonSymbols.Settings, stringResource(Res.string.vyon_settings), tint = MaterialTheme.colorScheme.primary) } }
        }
        Row(Modifier.fillMaxWidth().padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(query, { query = it }, modifier = Modifier.weight(1f), singleLine = true, placeholder = { Text(stringResource(Res.string.vyon_video_search)) }, shape = RoundedCornerShape(24.dp), leadingIcon = { Icon(VyonSymbols.Search, null) }, keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(imeAction = androidx.compose.ui.text.input.ImeAction.Search), keyboardActions = androidx.compose.foundation.text.KeyboardActions(onSearch = { submit(query) }))
            Button(onClick = { submit(query) }) { Text(stringResource(Res.string.vyon_search)) }
        }
        if (suggestions.isNotEmpty()) Column(Modifier.fillMaxWidth().padding(horizontal = 24.dp)) {
            suggestions.forEach { suggestion -> TextButton(onClick = { submit(suggestion) }, modifier = Modifier.fillMaxWidth()) { Text(suggestion, modifier = Modifier.fillMaxWidth()) } }
        }
        if (submitted.isNotBlank()) TextButton(onClick = { query = ""; submitted = "" }) { Text(stringResource(Res.string.vyon_video_feed)) }
        else Text(
            stringResource(if (Innertube.cookie != null) Res.string.vyon_video_suggestions else Res.string.vyon_video_explore),
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 12.dp),
        )
        val displayedPage = page
        when {
            loading && page == null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            failure != null -> Column(Modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                VyonLogo(Modifier.size(110.dp), contentDescription = null)
                Text(failure.orEmpty(), style = MaterialTheme.typography.bodyLarge)
                TextButton(onClick = { refresh++ }) { Text(stringResource(Res.string.vyon_retry)) }
            }
            displayedPage?.videos.isNullOrEmpty() -> Column(Modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                VyonLogo(Modifier.size(110.dp), contentDescription = null)
                Text(stringResource(if (submitted.isBlank()) Res.string.vyon_video_empty else Res.string.vyon_video_no_results))
            }
            else -> LazyVerticalGrid(GridCells.Adaptive(250.dp), modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(20.dp), verticalArrangement = Arrangement.spacedBy(22.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                items(displayedPage?.videos.orEmpty(), key = { it.id }) { video ->
                    var focused by remember { mutableStateOf(false) }
                    Column(Modifier.onFocusChanged { focused = it.hasFocus }.clip(RoundedCornerShape(16.dp)).border(if (focused) 3.dp else 0.dp, if (focused) MaterialTheme.colorScheme.primary else Color.Transparent, RoundedCornerShape(16.dp)).clickable { onVideo(video) }) {
                        Box(Modifier.fillMaxWidth().aspectRatio(16f / 9f).background(MaterialTheme.colorScheme.surfaceVariant)) {
                            AsyncImage(video.thumbnail, video.title, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            if (video.duration.isNotBlank()) Text(video.duration, color = Color.White, style = MaterialTheme.typography.labelMedium, modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp).clip(RoundedCornerShape(5.dp)).background(Color.Black.copy(alpha = .8f)).padding(horizontal = 5.dp, vertical = 2.dp))
                        }
                        Text(video.title, style = MaterialTheme.typography.titleMedium, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp))
                        Text(listOf(video.channel, video.views).filter(String::isNotBlank).joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                    }
                }
                displayedPage?.continuation?.let { cursor -> item(span = { GridItemSpan(maxLineSpan) }) {
                    TextButton(enabled = !loading, modifier = Modifier.fillMaxWidth(), onClick = {
                        val searchTerm = submitted
                        val requestRefresh = refresh
                        val previousVideos = displayedPage?.videos.orEmpty()
                        scope.launch {
                            loading = true
                            val result = if (searchTerm.isBlank()) FlowYouTubeRepository.home(cursor) else FlowYouTubeRepository.search(searchTerm, cursor)
                            if (submitted == searchTerm && refresh == requestRefresh && page != null) result.onSuccess { next -> page = next.copy(videos = (previousVideos + next.videos).distinctBy { it.id }) }.onFailure { failure = it.message }
                            loading = false
                        }
                    }) { Text(stringResource(if (loading) Res.string.vyon_loading else Res.string.vyon_video_more)) }
                } }
            }
        }
    }
    }
}
