package com.vyon.music.data.listentogether

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

/**
 * What counts as an invite. Anything that is not the public URL shape must be refused outright
 * rather than half-parsed: a join is an action taken on someone else's behalf.
 */
class JamInviteTest {

    @Test
    fun `it reads the code out of an invite url`() {
        assertEquals("ABC123", JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC123"))
    }

    @Test
    fun `a code is normalised to upper case`() {
        assertEquals("ABC123", JamInvite.parse("${JamInvite.ORIGIN}/invite/abc123"))
    }

    @Test
    fun `query and fragment are ignored`() {
        assertEquals("ABC123", JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC123?utm=x"))
        assertEquals("ABC123", JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC123#top"))
    }

    @Test
    fun `another host is not an invite even with the same path`() {
        assertNull(JamInvite.parse("https://example.com/invite/ABC123"))
    }

    @Test
    fun `plain http is refused`() {
        assertNull(JamInvite.parse("http://vyon.bxane.workers.dev/invite/ABC123"))
    }

    @Test
    fun `a wrong-length code is refused`() {
        assertNull(JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC12"))
        assertNull(JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC1234"))
    }

    @Test
    fun `rubbish is refused rather than guessed at`() {
        assertNull(JamInvite.parse(null))
        assertNull(JamInvite.parse(""))
        assertNull(JamInvite.parse("ABC123"))
    }

    @Test
    fun `a built url round-trips`() {
        assertEquals("ZZ99QQ", JamInvite.parse(JamInvite.url("zz99qq")))
    }

    @Test
    fun `new links use the deployed listen together origin`() {
        assertEquals("https://vyon-listen-together.bxane.workers.dev/invite/ABC123", JamInvite.url("abc123"))
    }

    @Test
    fun `previous public invite links remain valid`() {
        assertEquals("ABC123", JamInvite.parse("https://vyon.bxane.workers.dev/invite/abc123"))
    }

    @Test
    fun `origin casing does not prevent joining`() {
        assertEquals("ABC123", JamInvite.parse("HTTPS://VYON-LISTEN-TOGETHER.BXANE.WORKERS.DEV/invite/abc123"))
    }

    @Test
    fun `lookalike hosts and malformed codes are refused`() {
        assertNull(JamInvite.parse("${JamInvite.ORIGIN}.example.com/invite/ABC123"))
        assertNull(JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC123/extra"))
        assertNull(JamInvite.parse("${JamInvite.ORIGIN}/invite/ABC12é"))
        assertNull(JamInvite.parse("http://vyon-listen-together.bxane.workers.dev/invite/ABC123"))
    }
}
