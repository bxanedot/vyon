package com.vyon.music.ui.screens
import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.vyon.music.recognition.MusicRecognitionService
import com.music.shazamkit.models.RecognitionStatus
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VyonRecognitionSheet(onDismiss: () -> Unit, onSearch: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var job by remember { mutableStateOf<kotlinx.coroutines.Job?>(null) }
    var status by remember { mutableStateOf<RecognitionStatus>(RecognitionStatus.Ready) }
    val start = { job?.cancel(); job = scope.launch { status = RecognitionStatus.Listening; status = MusicRecognitionService.recognize(context) }; Unit }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted -> if (granted) start() else status = RecognitionStatus.Error("Microphone access is needed to recognize a song.") }
    DisposableEffect(Unit) { onDispose { job?.cancel() } }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Icon(com.vyon.music.ui.icons.VyonSymbols.Recognition, "Song recognition", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(56.dp))
            Text("Song recognition", style = MaterialTheme.typography.headlineMedium)
            when (val current = status) {
                RecognitionStatus.Ready -> Text("Find the music playing around you.")
                RecognitionStatus.Listening -> { CircularProgressIndicator(); Text("Listening…") }
                RecognitionStatus.Processing -> { CircularProgressIndicator(); Text("Finding your song…") }
                is RecognitionStatus.Success -> {
                    coil3.compose.AsyncImage(current.result.coverArtHqUrl ?: current.result.coverArtUrl, current.result.title, Modifier.size(120.dp))
                    Text(current.result.title, style = MaterialTheme.typography.titleLarge)
                    Text(current.result.artist)
                    Button(onClick = { onSearch(current.result.title + " " + current.result.artist) }) { Text("Find in vyon") }
                }
                is RecognitionStatus.NoMatch -> Text(current.message)
                is RecognitionStatus.Error -> Text(current.message, color = MaterialTheme.colorScheme.error)
            }
            if (job?.isActive != true) Button(onClick = { if (MusicRecognitionService.hasRecordPermission(context)) start() else permission.launch(Manifest.permission.RECORD_AUDIO) }) { Text("Recognize a song") }
            TextButton(onClick = { job?.cancel(); onDismiss() }) { Text("Close") }
        }
    }
}
