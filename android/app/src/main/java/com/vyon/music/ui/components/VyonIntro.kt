/**
 * Convx Project (C) 2026
 * Licensed under GPL-3.0 | See git history for contributors
 */

package com.vyon.music.ui.components

import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.graphics.FilterQuality
import android.provider.Settings
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.vyon.music.R
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.res.imageResource
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import com.vyon.music.ui.theme.rememberAppHaptics
import kotlin.math.PI
import kotlin.math.hypot
import kotlin.math.pow
import kotlin.math.sin

/**
 * Cold-start intro, drawn over the already-composed app: a white disc springs in carrying the
 * Vyon mark, beats twice (with ripples and a haptic tick each), then zooms through the
 * camera -- the mark outgrowing the disc for a layered tunnel -- and a hole opens from the
 * centre onto the live app underneath. One clock drives every layer, so it holds the display's
 * refresh rate with no per-phase animation state.
 *
 * The clock advances per frame, capped at [MAX_STEP_MS]: it runs while the app is still starting
 * up, and a wall-clock tween would skip the whole intro across one startup stall. A stall pauses
 * it instead. Skipped outright when the system animator scale is 0 (reduced motion).
 */
@Composable
fun VyonIntro(onFinished: () -> Unit) {
    val context = LocalContext.current
    val haptics = rememberAppHaptics()
    val reducedMotion = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }
    val clock = remember { mutableFloatStateOf(0f) }
    LaunchedEffect(Unit) {
        if (!reducedMotion) {
            var last = withFrameNanos { it }
            while (clock.floatValue < TOTAL_MS) {
                val now = withFrameNanos { it }
                val before = clock.floatValue
                val after = (before + ((now - last) / 1e6f).coerceAtMost(MAX_STEP_MS)).coerceAtMost(TOTAL_MS)
                last = now
                clock.floatValue = after
                if (BEATS_MS.any { it in before..after && it != before }) {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                }
            }
        }
        onFinished()
    }
    if (reducedMotion) return

    // Cache the supplied Vyon artwork once; scale it on the canvas without reallocating bitmaps.
    val logo = ImageBitmap.imageResource(R.drawable.vyon_logo)
    val logoViewport = logo.width.toFloat()
    val hole = remember { Path() }
    Canvas(
        Modifier
            .fillMaxSize()
            // Swallow touches until the app is revealed.
            .pointerInput(Unit) { awaitPointerEventScope { while (true) awaitPointerEvent().changes.forEach { it.consume() } } },
    ) {
        val t = clock.floatValue
        val c = center
        val r0 = 52.dp.toPx()
        val cover = hypot(size.width, size.height) / 2f * 1.05f

        // The reveal is a hole clipped out of everything below, so the app shows through
        // without a full-screen offscreen layer and BlendMode.Clear.
        val holeR = cover * outCubic(phase(t, REVEAL_START, TOTAL_MS))
        hole.reset()
        if (holeR > 0f) hole.addOval(Rect(c, holeR))
        clipPath(hole, ClipOp.Difference) {
            drawRect(Color.Black)

            // Ripples, under the disc.
            BEATS_MS.forEach { beat ->
                val x = (t - beat) / RIPPLE_MS
                if (x in 0f..1f) {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.45f * (1f - x)),
                        radius = r0 * (1f + 2.4f * outCubic(x)),
                        center = c,
                        style = Stroke(width = 2.dp.toPx() * (1f - 0.6f * x)),
                    )
                }
            }

            val beat = BEATS_MS.sumOf { pulse(t - it).toDouble() }.toFloat()
            val zoom = inCubic(phase(t, ZOOM_START, ZOOM_END))
            val discIn = outBack(phase(t, 0f, 450f))
            val discR = r0 * discIn * (1f + 0.09f * beat) + (cover - r0) * zoom
            drawCircle(Color.White, radius = discR.coerceAtLeast(0f), center = c)

            // Keep the supplied mark upright and fixed while the reveal moves around it.
            val glyph = r0 * 2f * 0.95f
            translate(c.x - glyph / 2f, c.y - glyph / 2f) {
                scale(glyph / logoViewport, pivot = Offset.Zero) {
                    drawImage(logo, dstSize = IntSize(logo.width, logo.height), filterQuality = FilterQuality.High)
                }
            }
        }
    }
}

private const val TOTAL_MS = 1700f
private const val ZOOM_START = 1000f
private const val ZOOM_END = 1480f
private const val REVEAL_START = 1400f
private const val RIPPLE_MS = 600f
private const val PULSE_MS = 220f

/** Most the clock advances per frame (~two 60 Hz frames), so stalls pause rather than skip. */
private const val MAX_STEP_MS = 34f

/** Two eighth notes at 120 BPM: a "da-dum". */
private val BEATS_MS = listOf(600f, 850f)

private fun phase(t: Float, start: Float, end: Float) = ((t - start) / (end - start)).coerceIn(0f, 1f)

private fun pulse(dt: Float) = if (dt in 0f..PULSE_MS) sin(PI.toFloat() * dt / PULSE_MS) else 0f

private fun outCubic(x: Float) = 1f - (1f - x).pow(3)

private fun inCubic(x: Float) = x * x * x

private fun outBack(x: Float): Float {
    val c1 = 1.70158f
    val c3 = c1 + 1f
    return 1f + c3 * (x - 1f).pow(3) + c1 * (x - 1f).pow(2)
}
