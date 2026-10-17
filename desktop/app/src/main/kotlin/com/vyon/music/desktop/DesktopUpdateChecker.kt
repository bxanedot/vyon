package com.vyon.music.desktop

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Looks at the repo's "latest release" on GitHub once per launch and says whether it is newer
 * than the running build. The installer is not run from here: the dialog opens the asset in the
 * browser, so the user installs it the way they installed the first one.
 *
 * GitHub's "latest" skips pre-releases and drafts, so a `-beta` desktop build is only ever
 * nudged toward a published release.
 */
internal object DesktopUpdateChecker {

    data class UpdateInfo(
        val version: String,
        val releaseUrl: String,
        /** The installer for this platform, or null when the release has none. */
        val downloadUrl: String?,
        val notes: String?,
    )

    private const val LATEST_RELEASE_URL =
        "https://api.github.com/repos/bxanedot/vyon/releases/latest"

    val currentVersion: String = System.getProperty("vyon.version") ?: "1.0.0"
    val currentVersionCode: Int = Integer.getInteger("vyon.versionCode", 1)

    private val json = Json { ignoreUnknownKeys = true }

    private val http = HttpClient(CIO) {
        install(HttpTimeout) {
            requestTimeoutMillis = 15_000
            connectTimeoutMillis = 10_000
        }
    }

    suspend fun check(): UpdateInfo? = runCatching {
        val response = http.get(LATEST_RELEASE_URL) {
            header("Accept", "application/vnd.github+json")
        }
        if (!response.status.isSuccess()) return@runCatching null
        val release = json.parseToJsonElement(response.bodyAsText()) as? JsonObject
            ?: return@runCatching null
        val tag = release["tag_name"]?.jsonPrimitive?.contentOrNull ?: return@runCatching null
        val url = release["html_url"]?.jsonPrimitive?.contentOrNull ?: return@runCatching null
        val latest = tag.removePrefix("v")
        if (!isNewer(latest, currentVersion)) return@runCatching null
        UpdateInfo(
            version = latest,
            releaseUrl = url,
            downloadUrl = installerUrl(
                release,
                installerSuffixes(System.getProperty("os.name").orEmpty(), System.getProperty("os.arch").orEmpty()),
            ),
            notes = release["body"]?.jsonPrimitive?.contentOrNull,
        )
    }.getOrNull()

    /**
     * These suffixes match the installers staged by .github/workflows/release.yml.
     */
    internal fun installerSuffixes(osName: String, architecture: String): List<String> = when {
        osName.startsWith("Windows", ignoreCase = true) -> listOf("-windows-x64-setup.exe", "-windows-portable.zip")
        osName.contains("Linux", ignoreCase = true) -> listOf(".AppImage", "-linux-amd64.deb")
        osName.contains("Mac", ignoreCase = true) -> when (architecture.lowercase()) {
            "arm64", "aarch64" -> listOf("-macos-arm64.dmg", "-macos-arm64.pkg")
            "x86_64", "amd64" -> listOf("-macos-x64.dmg", "-macos-x64.pkg")
            else -> emptyList()
        }
        else -> emptyList()
    }

    private fun installerUrl(release: JsonObject, suffixes: List<String>): String? {
        val assets = release["assets"]?.jsonArray?.mapNotNull { it as? JsonObject }.orEmpty()
        for (suffix in suffixes) {
            val hit = assets.firstOrNull { asset ->
                asset["name"]?.jsonPrimitive?.contentOrNull?.endsWith(suffix, ignoreCase = true) == true &&
                    asset["state"]?.jsonPrimitive?.contentOrNull == "uploaded"
            }
            hit?.get("browser_download_url")?.jsonPrimitive?.contentOrNull?.let { return it }
        }
        return null
    }

    private class Parsed(val parts: List<Int>, val preRelease: Boolean)

    private fun parse(raw: String): Parsed {
        val dash = raw.indexOf('-')
        val base = if (dash >= 0) raw.substring(0, dash) else raw
        return Parsed(base.split('.').map { it.toIntOrNull() ?: 0 }, dash >= 0)
    }

    /** Numeric comparison, with a `-betaN` build counted as older than the plain release it leads up to. */
    internal fun isNewer(latest: String, current: String): Boolean {
        val l = parse(latest)
        val c = parse(current)
        for (i in 0 until maxOf(l.parts.size, c.parts.size)) {
            val a = l.parts.getOrElse(i) { 0 }
            val b = c.parts.getOrElse(i) { 0 }
            if (a != b) return a > b
        }
        return c.preRelease && !l.preRelease
    }
}
