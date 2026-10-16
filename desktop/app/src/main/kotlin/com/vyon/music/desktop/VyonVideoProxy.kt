package com.vyon.music.desktop

import com.vyon.music.data.Http
import com.sun.net.httpserver.HttpServer
import com.vyon.youtube.YouTubeVideoStream
import okhttp3.Call
import okhttp3.Request
import java.net.InetSocketAddress
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/** JavaFX needs ordinary HTTP metadata and HEAD responses for signed YouTube MP4 streams. */
internal class VyonVideoProxy(stream: YouTubeVideoStream) : AutoCloseable {
    private val calls = ConcurrentHashMap.newKeySet<Call>()
    private val executor = Executors.newFixedThreadPool(3) { task -> Thread(task, "vyon-video-stream").apply { isDaemon = true } }
    private val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
    private val path = "/${UUID.randomUUID()}.mp4"
    val url: String get() = "http://127.0.0.1:${server.address.port}$path"

    init {
        server.executor = executor
        server.createContext(path) { exchange ->
            val method = exchange.requestMethod
            val range = exchange.requestHeaders.getFirst("Range")
            if (exchange.requestURI.path != path || exchange.requestURI.rawQuery != null || method !in setOf("GET", "HEAD")) {
                exchange.sendResponseHeaders(404, -1); exchange.close()
            } else if (range != null && !range.matches(Regex("bytes=(?:[0-9]+-[0-9]*|-[0-9]+)"))) {
                exchange.sendResponseHeaders(416, -1); exchange.close()
            } else {
                val request = Request.Builder().url(stream.videoUrl).method(method, null).apply {
                    stream.headers.forEach { (name, value) -> header(name, value) }
                    if (range != null) header("Range", range)
                }.build()
                val call = Http.client.newCall(request)
                calls.add(call)
                try {
                    call.execute().use { response ->
                        listOf("Content-Type", "Content-Range", "Accept-Ranges").forEach { name ->
                            response.header(name)?.let { exchange.responseHeaders.set(name, it) }
                        }
                        val length = response.header("Content-Length")?.toLongOrNull() ?: 0L
                        if (method == "HEAD") {
                            if (length > 0) exchange.responseHeaders.set("Content-Length", length.toString())
                            exchange.sendResponseHeaders(response.code, -1)
                        } else {
                            exchange.sendResponseHeaders(response.code, length)
                            response.body.byteStream().use { input -> exchange.responseBody.use { output -> input.copyTo(output) } }
                        }
                    }
                } catch (_: java.io.IOException) {
                    runCatching { exchange.sendResponseHeaders(502, -1) }
                } finally {
                    calls.remove(call)
                    exchange.close()
                }
            }
        }
        server.start()
    }

    override fun close() {
        calls.forEach(Call::cancel)
        server.stop(0)
        executor.shutdownNow()
    }
}
