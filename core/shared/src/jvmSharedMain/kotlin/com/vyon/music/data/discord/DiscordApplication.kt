package com.vyon.music.data.discord

/**
 * Vyon's own Discord application, shared by the phone and desktop presence.
 *
 * Discord reads more off this id than the code suggests. The local socket on
 * the desktop titles the activity with the application's registered name, some
 * Discord surfaces do the same for a gateway activity that carries it, and an
 * activity with no `large_image` shows the application's icon. Both come from
 * the developer portal entry, so the name there has to stay "vyon".
 *
 * It gives Vyon's presence a stable display name and app icon across Discord
 * clients that prefer the registered application name to the activity text.
 */
object DiscordApplication {
    const val ID = "1543679166967193620"
}
