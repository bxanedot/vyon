package com.vyon.music.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.BlurredEdgeTreatment
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.unit.dp
import com.vyon.music.sharedui.resources.Res
import com.vyon.music.sharedui.resources.ic_logo
import org.jetbrains.compose.resources.imageResource

@Composable
fun VyonLogo(modifier: Modifier = Modifier.size(64.dp), contentDescription: String? = "vyon") {
    val bitmap = imageResource(Res.drawable.ic_logo)
    Box(modifier) {
        Image(
            bitmap, null,
            Modifier.matchParentSize().blur(4.dp, BlurredEdgeTreatment.Unbounded),
            alpha = 0.42f,
            filterQuality = FilterQuality.High,
        )
        Image(
            bitmap, contentDescription,
            Modifier.matchParentSize().blur(0.85.dp, BlurredEdgeTreatment.Unbounded),
            filterQuality = FilterQuality.High,
        )
    }
}
