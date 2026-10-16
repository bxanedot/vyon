package com.vyon.music.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Code
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.Forum
import com.vyon.music.sharedui.resources.*
import com.vyon.music.ui.icons.VyonSymbols
import org.jetbrains.compose.resources.painterResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun VyonAbout(modifier: Modifier = Modifier, onLicenses: (() -> Unit)? = null) {
    val uri = LocalUriHandler.current
    Column(modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Column(Modifier.fillMaxWidth().padding(bottom = 8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            VyonLogo(Modifier.size(88.dp))
        Text("vyon", color = MaterialTheme.colorScheme.onBackground, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
        Text("1.0.0 · " + stringResource(Res.string.vyon_tagline), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        }
        AboutSection(stringResource(Res.string.vyon_lead_dev)) {
            AboutPerson(painterResource(Res.drawable.bxane_avatar), "bxane", stringResource(Res.string.vyon_lead_dev), Icons.Rounded.Code) {
                uri.openUri("https://github.com/bxanedot")
            }
            HorizontalDivider(Modifier.padding(start = 68.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutPerson(painterResource(Res.drawable.vantom_avatar), "Vantom", stringResource(Res.string.vyon_inspector), Icons.Rounded.Info) {
                uri.openUri("https://guns.lol/vantom0101")
            }
        }
        AboutSection(stringResource(Res.string.vyon_app_info)) {
            AboutRow(VyonSymbols.Version, "Version", "1.0.0")
            HorizontalDivider(Modifier.padding(start = 48.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutRow(VyonSymbols.Website, stringResource(Res.string.vyon_website), "vyon.bxane.workers.dev") {
                uri.openUri("https://vyon.bxane.workers.dev")
            }
            HorizontalDivider(Modifier.padding(start = 48.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutRow(Icons.Rounded.Code, stringResource(Res.string.vyon_source), "github.com/bxandot/vyon") {
                uri.openUri("https://github.com/bxandot/vyon")
            }
            onLicenses?.let {
                AboutRow(VyonSymbols.About, "Open source licenses", null, it)
            }
        }
        AboutSection(stringResource(Res.string.vyon_community)) {
            AboutRow(Icons.Rounded.Forum, "Discord", null) { uri.openUri("https://discord.gg/h4Wsu824Uf") }
            HorizontalDivider(Modifier.padding(start = 48.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutRow(Icons.Rounded.Send, "Telegram", null) { uri.openUri("https://t.me/+T9avk7iJ7_YyN2Rk") }
        }
        AboutSection(stringResource(Res.string.vyon_support)) {
            AboutRow(VyonSymbols.Credits, "Patreon", null) { uri.openUri("https://www.patreon.com/cw/bxane") }
            HorizontalDivider(Modifier.padding(start = 48.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutRow(Icons.Rounded.Favorite, "Ko-fi", null) { uri.openUri("https://ko-fi.com/bxane") }
            HorizontalDivider(Modifier.padding(start = 48.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
            AboutRow(Icons.Rounded.Favorite, "bxane", "guns.lol/bxane") { uri.openUri("https://guns.lol/bxane") }
        }
        Text("GPL v3 · Not affiliated with YouTube or Google.", Modifier.fillMaxWidth().padding(top = 8.dp), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
    }
}

@Composable
private fun AboutSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(start = 14.dp, bottom = 7.dp, top = 8.dp))
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(MaterialTheme.colorScheme.surfaceVariant), content = content)
    }
}

@Composable
private fun AboutPerson(painter: androidx.compose.ui.graphics.painter.Painter, name: String, role: String, icon: ImageVector, onClick: () -> Unit) {
    Surface(onClick = onClick, color = MaterialTheme.colorScheme.surfaceVariant) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Image(painter, "$name profile", Modifier.size(42.dp).clip(CircleShape))
            Column(Modifier.weight(1f)) {
                Text(name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
                Text(role, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(icon, null, Modifier.size(21.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AboutRow(icon: ImageVector, title: String, detail: String?, onClick: (() -> Unit)? = null) {
    val row: @Composable () -> Unit = {
        Row(Modifier.fillMaxWidth().heightIn(min = 50.dp).padding(horizontal = 15.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(13.dp)) {
            Icon(icon, null, Modifier.size(21.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(title, Modifier.weight(1f), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface)
            detail?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.End) }
            if (onClick != null) Icon(VyonSymbols.Navigate, null, Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.72f))
        }
    }
    if (onClick != null) Surface(onClick = onClick, color = MaterialTheme.colorScheme.surfaceVariant, content = row)
    else Surface(color = MaterialTheme.colorScheme.surfaceVariant, content = row)
}

@Composable
fun VyonReservedListening(modifier: Modifier = Modifier) {
    Column(modifier.fillMaxSize().padding(32.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        VyonLogo(Modifier.size(120.dp))
        Spacer(Modifier.height(20.dp))
        Text("Listen Together", color = MaterialTheme.colorScheme.onBackground, style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
        Spacer(Modifier.height(12.dp))
        Text(stringResource(Res.string.vyon_reserved), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(12.dp))
        Text(stringResource(Res.string.vyon_reserved_detail), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyLarge, textAlign = TextAlign.Center)
    }
}
