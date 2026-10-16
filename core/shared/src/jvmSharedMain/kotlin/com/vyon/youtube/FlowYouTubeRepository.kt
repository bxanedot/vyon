package com.vyon.youtube

import com.vyon.music.data.Http
import com.vyon.music.data.innertube.Innertube
import com.vyon.music.data.innertube.StreamResolver
import com.vyon.youtube.innertube.models.*
import com.vyon.youtube.player.stream.*
import kotlinx.coroutines.*
import kotlinx.serialization.json.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.schabi.newpipe.extractor.ServiceList
import org.schabi.newpipe.extractor.stream.StreamInfo
import java.io.IOException
import java.net.URLDecoder
import java.net.URLEncoder
import java.util.Collections
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resumeWithException

data class YouTubeVideo(val id: String, val title: String, val channel: String, val thumbnail: String?, val duration: String = "", val views: String = "")
data class YouTubeVideoPage(val videos: List<YouTubeVideo>, val continuation: String?)
data class YouTubeVideoStream(val videoUrl: String, val audioUrl: String? = null, val headers: Map<String, String> = emptyMap(), val client: String = "", val isLive: Boolean = false)

/** Flow's client identities, filter protocol, cipher protocol and extraction ladder, adapted to the shared JVM layer. */
object FlowYouTubeRepository {
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false; encodeDefaults = true }
    private val client = Http.client.newBuilder().callTimeout(18, TimeUnit.SECONDS).build()
    private val extraction = InFlightRequestCoalescer<String, YouTubeVideoStream>(CoroutineScope(SupervisorJob() + Dispatchers.IO))
    private const val ORIGIN = "https://www.youtube.com"

    private suspend fun Call.await(): Response = suspendCancellableCoroutine { continuation ->
        continuation.invokeOnCancellation { cancel() }
        enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) { if (!continuation.isCancelled) continuation.resumeWithException(e) }
            override fun onResponse(call: Call, response: Response) { continuation.resume(response) { _, value, _ -> value.close() } }
        })
    }

    private suspend fun post(endpoint: String, identity: YouTubeClient = YouTubeClient.WEB, authenticated: Boolean = false, build: JsonObjectBuilder.() -> Unit): JsonObject {
        val visitor = Innertube.ensureVisitorData()
        val locale = YouTubeLocale(Innertube.currentRegion, Innertube.currentLanguage)
        val body = buildJsonObject { put("context", json.encodeToJsonElement(identity.toContext(locale, visitor, null))); build() }
        val session = if (authenticated) Innertube.cookie else null
        val request = Request.Builder().url("$ORIGIN/youtubei/v1/$endpoint?prettyPrint=false")
            .header("User-Agent", identity.userAgent).header("Origin", ORIGIN).header("Referer", "$ORIGIN/")
            .header("X-YouTube-Client-Name", identity.clientId).header("X-YouTube-Client-Version", identity.clientVersion)
            .apply {
                if (session != null) {
                    header("Cookie", session)
                    Innertube.authorizationHeader(ORIGIN, session)?.let { header("Authorization", it) }
                }
            }
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        return client.newCall(request).await().use { response ->
            check(response.isSuccessful) { "YouTube returned HTTP ${response.code}" }
            json.parseToJsonElement(response.body.string()).jsonObject
        }
    }

    suspend fun home(continuation: String? = null): Result<YouTubeVideoPage> = result {
        val authenticated = Innertube.authorizationHeader(ORIGIN) != null
        val browse: suspend (Boolean) -> JsonObject = { useSession ->
            post("browse", authenticated = useSession) {
                if (continuation == null) put("browseId", "FEwhat_to_watch") else put("continuation", continuation)
            }
        }
        val response = try {
            browse(authenticated)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            if (!authenticated || continuation != null) throw e
            browse(false)
        }
        parsePage(response)
    }

    suspend fun search(query: String, continuation: String? = null): Result<YouTubeVideoPage> = result {
        val params = com.vyon.youtube.innertube.YouTubeSearchParams.build(contentType = com.vyon.youtube.innertube.YouTubeSearchParams.ContentType.VIDEO)
        parsePage(post("search") { if (continuation != null) put("continuation", continuation) else { put("query", query.trim()); params?.let { put("params", it) } } })
    }

    suspend fun suggestions(query: String): List<String> = result {
        if (query.isBlank()) return@result emptyList()
        val url = "https://suggestqueries-clients6.youtube.com/complete/search?client=firefox&ds=yt&q=" + URLEncoder.encode(query, "UTF-8")
        client.newCall(Request.Builder().url(url).build()).await().use { response ->
            (json.parseToJsonElement(response.body.string()).jsonArray.getOrNull(1) as? JsonArray).orEmpty().mapNotNull { (it as? JsonPrimitive)?.contentOrNull }.take(6)
        }
    }.getOrDefault(emptyList())

    private fun parsePage(root: JsonElement): YouTubeVideoPage {
        val videos = linkedMapOf<String, YouTubeVideo>()
        var continuation: String? = null
        fun visit(node: JsonElement) {
            when (node) {
                is JsonArray -> node.forEach(::visit)
                is JsonObject -> {
                    val renderer = listOf("videoRenderer", "compactVideoRenderer", "gridVideoRenderer", "videoWithContextRenderer").firstNotNullOfOrNull { node[it] as? JsonObject }
                    val lockup = node["lockupViewModel"] as? JsonObject
                    if (renderer != null) {
                        val id = renderer.text("videoId")
                        val title = renderer["title"].plainText()
                        if (id.matches(Regex("[A-Za-z0-9_-]{11}")) && title.isNotBlank()) videos.putIfAbsent(id, YouTubeVideo(id, title, (renderer["ownerText"] ?: renderer["shortBylineText"] ?: renderer["longBylineText"]).plainText(), thumbnail(renderer["thumbnail"]), renderer["lengthText"].plainText(), renderer["viewCountText"].plainText()))
                    } else if (lockup != null && lockup.text("contentType").contains("VIDEO")) {
                        val id = lockup.text("contentId")
                        val meta = lockup["metadata"]?.obj()?.get("lockupMetadataViewModel")?.obj()
                        val title = meta?.get("title").plainText()
                        val lines = collectText(meta?.get("metadata"))
                        if (id.matches(Regex("[A-Za-z0-9_-]{11}")) && title.isNotBlank()) videos.putIfAbsent(id, YouTubeVideo(id, title, lines.firstOrNull().orEmpty(), thumbnail(lockup["contentImage"]), collectText(lockup["contentImage"]).firstOrNull { it.contains(':') }.orEmpty(), lines.drop(1).joinToString(" · ")))
                    }
                    val cursor = node["continuationItemRenderer"]?.obj()?.get("continuationEndpoint")?.obj()?.get("continuationCommand")?.obj()?.text("token")
                    if (!cursor.isNullOrBlank()) continuation = cursor
                    node.filterKeys { !it.contains("adSlot", true) && !it.contains("promoted", true) }.values.forEach(::visit)
                }
                else -> Unit
            }
        }
        visit(root)
        return YouTubeVideoPage(videos.values.toList(), continuation)
    }

    private fun thumbnail(node: JsonElement?): String? {
        val urls = mutableListOf<String>()
        fun walk(value: JsonElement?) { when (value) { is JsonObject -> { value["url"]?.let { (it as? JsonPrimitive)?.contentOrNull }?.takeIf { it.contains("ytimg") || it.contains("ggpht") }?.let(urls::add); value.values.forEach(::walk) }; is JsonArray -> value.forEach(::walk); else -> Unit } }
        walk(node)
        return urls.lastOrNull()?.let { if (it.startsWith("//")) "https:$it" else it }
    }
    private fun collectText(node: JsonElement?): List<String> {
        val out = mutableListOf<String>()
        fun walk(n: JsonElement?) { when(n) { is JsonObject -> { (n["content"] as? JsonPrimitive)?.contentOrNull?.let(out::add); n.filterKeys { it != "content" }.values.forEach(::walk) }; is JsonArray -> n.forEach(::walk); else -> Unit } }
        walk(node); return out.distinct()
    }
    private fun JsonElement?.obj() = this as? JsonObject
    private fun JsonObject.text(name: String) = (get(name) as? JsonPrimitive)?.contentOrNull.orEmpty()
    private fun JsonElement?.plainText(): String = when (this) {
        is JsonPrimitive -> contentOrNull.orEmpty()
        is JsonObject -> (get("simpleText") ?: get("content"))?.let { (it as? JsonPrimitive)?.contentOrNull } ?: (get("runs") as? JsonArray).orEmpty().joinToString("") { (it as? JsonObject)?.text("text").orEmpty() }
        else -> ""
    }

    suspend fun resolve(videoId: String, progressiveOnly: Boolean = false, excludedClient: String? = null): Result<YouTubeVideoStream> = result {
        require(videoId.matches(Regex("[A-Za-z0-9_-]{11}"))) { "Invalid YouTube video ID" }
        extraction.run("$videoId:$progressiveOnly:$excludedClient") {
            val clients = listOf(YouTubeClient.VISIONOS, YouTubeClient.TV_TIZEN).filter { it.clientName != excludedClient }
            for (identity in clients) {
                try {
                    val decoder = if (identity.useSignatureTimestamp) FlowCipherDecoder.player() else null
                    if (identity.useSignatureTimestamp && decoder == null) continue
                    val response = post("player", identity) {
                        put("videoId", videoId); put("contentCheckOk", true); put("racyCheckOk", true)
                        if (decoder != null) putJsonObject("playbackContext") { putJsonObject("contentPlaybackContext") { put("signatureTimestamp", decoder.sts) } }
                    }
                    if (response["playabilityStatus"]?.obj()?.text("status") != "OK") continue
                    val data = response["streamingData"]?.obj() ?: continue
                    if (!progressiveOnly) data.text("hlsManifestUrl").takeIf(String::isNotBlank)?.let { return@run YouTubeVideoStream(it, headers = mapOf("User-Agent" to identity.userAgent), client = identity.clientName, isLive = response["videoDetails"]?.obj()?.get("isLiveContent")?.jsonPrimitive?.booleanOrNull == true) }
                    val progressive = (data["formats"] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }.filter { it.text("mimeType").startsWith("video/mp4") && it["audioQuality"] != null && (!progressiveOnly || it.text("mimeType").contains("avc1")) }
                    for (format in progressive.sortedByDescending { it["height"]?.jsonPrimitive?.intOrNull ?: 0 }) {
                        val url = formatUrl(format, decoder) ?: continue
                        if (probe(url, identity.userAgent)) return@run YouTubeVideoStream(url, headers = mapOf("User-Agent" to identity.userAgent), client = identity.clientName)
                    }
                    if (!progressiveOnly) {
                        val formats = (data["adaptiveFormats"] as? JsonArray).orEmpty().mapNotNull { it as? JsonObject }
                        val video = formats.filter { it.text("mimeType").startsWith("video/mp4") && (it["height"]?.jsonPrimitive?.intOrNull ?: 0) <= 1080 }.sortedByDescending { it["height"]?.jsonPrimitive?.intOrNull ?: 0 }.firstOrNull()
                        val audio = formats.filter { it.text("mimeType").startsWith("audio/mp4") }.maxByOrNull { it["bitrate"]?.jsonPrimitive?.intOrNull ?: 0 }
                        val v = video?.let { formatUrl(it, decoder) }; val a = audio?.let { formatUrl(it, decoder) }
                        val wait = PrerollWait.of(response["adPlacements"] as? JsonArray)
                        if (wait > 0) delay(wait)
                        if (v != null && a != null && probe(v, identity.userAgent) && probe(a, identity.userAgent)) return@run YouTubeVideoStream(v, a, mapOf("User-Agent" to identity.userAgent), identity.clientName)
                    }
                } catch (e: CancellationException) { throw e } catch (_: Exception) { }
            }
            withContext(Dispatchers.IO) {
                StreamResolver.initializeForVideo()
                val info = StreamInfo.getInfo(ServiceList.YouTube, "https://www.youtube.com/watch?v=$videoId")
                val muxed = info.videoStreams.filter { it.format == org.schabi.newpipe.extractor.MediaFormat.MPEG_4 && (!progressiveOnly || it.codec.orEmpty().contains("avc", true) || it.itag in listOf(18, 22)) }.maxByOrNull { it.resolution.filter(Char::isDigit).toIntOrNull() ?: 0 }
                if (muxed != null) return@withContext YouTubeVideoStream(muxed.content, client = "NewPipe")
                check(!progressiveOnly) { "No compatible MP4 stream is available. Try another video." }
                val v = info.videoOnlyStreams.filter { it.format == org.schabi.newpipe.extractor.MediaFormat.MPEG_4 && (it.resolution.filter(Char::isDigit).toIntOrNull() ?: 0) <= 1080 }.maxByOrNull { it.resolution.filter(Char::isDigit).toIntOrNull() ?: 0 } ?: error("No video stream is available")
                val a = info.audioStreams.maxByOrNull { it.averageBitrate } ?: error("No audio stream is available")
                YouTubeVideoStream(v.content, a.content, client = "NewPipe")
            }
        }
    }

    private suspend fun formatUrl(format: JsonObject, decoder: FlowCipherDecoder.Player?): String? {
        var url = format.text("url").takeIf(String::isNotBlank)
        if (url == null && decoder != null) {
            val cipher = SignatureCipher.parse(format.text("signatureCipher").ifBlank { format.text("cipher") }) ?: return null
            val solved = FlowCipherDecoder.decode(decoder.id, "sig", cipher.signature) ?: return null
            url = cipher.signedUrl(solved)
        }
        if (url == null) return null
        val match = Regex("([?&])n=([^&]+)").find(url)
        if (match != null && decoder != null) {
            val raw = URLDecoder.decode(match.groupValues[2], "UTF-8")
            val solved = FlowCipherDecoder.decode(decoder.id, "n", raw) ?: return null
            url = url.replaceRange(match.groups[2]!!.range, URLEncoder.encode(solved, "UTF-8"))
        }
        return url
    }
    private suspend fun probe(url: String, userAgent: String): Boolean = client.newCall(Request.Builder().url(url).header("Range", "bytes=0-0").header("User-Agent", userAgent).build()).await().use { it.isSuccessful }
    private suspend fun <T> result(block: suspend () -> T): Result<T> = try { Result.success(block()) } catch (e: CancellationException) { throw e } catch (e: Exception) { Result.failure(e) }

    /** Flow/PipePipe decoder protocol; bounded cache, a shared client, and cancellable HTTP. */
    private object FlowCipherDecoder {
        data class Player(val id: String, val sts: Int, val at: Long)
        private var current: Player? = null
        private val cache = Collections.synchronizedMap(object : LinkedHashMap<String, String>(64, .75f, true) { override fun removeEldestEntry(e: MutableMap.MutableEntry<String, String>?) = size > 512 })
        suspend fun player(): Player? {
            current?.takeIf { System.currentTimeMillis() - it.at < 86_400_000 }?.let { return it }
            return try {
                val response = get("https://api.pipepipe.dev/decoder/latest-player")
                val id = response.text("player"); val sts = response["signatureTimestamp"]?.jsonPrimitive?.intOrNull ?: return null
                if (id.isBlank()) null else Player(id, sts, System.currentTimeMillis()).also { current = it }
            } catch (e: CancellationException) { throw e } catch (_: Exception) { null }
        }
        suspend fun decode(player: String, kind: String, input: String): String? {
            val key = "$player:$kind:$input"; cache[key]?.let { return it }
            val response = get("https://api.pipepipe.dev/decoder/decode?player=${URLEncoder.encode(player, "UTF-8")}&$kind=${URLEncoder.encode(input, "UTF-8")}")
            val data = (response["responses"] as? JsonArray)?.firstOrNull()?.obj()?.get("data")?.obj()
            return data?.text(input)?.takeIf(String::isNotBlank)?.also { cache[key] = it }
        }
        private suspend fun get(url: String): JsonObject = client.newCall(Request.Builder().url(url).header("User-Agent", "PipePipe/4.9.0").build()).await().use { response -> check(response.isSuccessful); json.parseToJsonElement(response.body.string()).jsonObject }
    }
}
