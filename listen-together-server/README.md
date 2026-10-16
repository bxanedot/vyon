# Listen Together server (Cloudflare)

Independent, starter synchronization service for vyon. The existing website/ directory is unchanged.

This is a Cloudflare Worker backed by one SQLite Durable Object per room. The included demo can:
- create private-hosted listening rooms
- share a listener-only invite URL
- connect multiple browsers using WebSockets
- synchronize track IDs, track titles, play/pause, seek position, and queue
- estimate current playback time using a timestamp
- persist the last playback state across room reconnects
- serve Vyon Android Listen Together parties using the app's `/api/parties` and `/ws/parties` protocol

**This server does not stream or redistribute audio.** Integrate its events with the music player that each listener is authorized to use. It is not a YouTube Music integration.

## Run locally

1. Install Node.js 20+.
2. In this folder, run:

       npm install
       cp .dev.vars.example .dev.vars
       npm run dev

   On Windows, copy .dev.vars.example to .dev.vars using File Explorer. Replace the sample CREATE_KEY with a unique password for local testing. Do not commit .dev.vars.

3. Open the localhost URL printed by Wrangler. Enter the creation key and press Create room.
4. Open the share URL in another browser or private window, and change playback state as host.

## Deploy to Cloudflare

1. Create/login to a Cloudflare account.
2. Run the following from this folder:

       npm install
       npx wrangler login
       npm run deploy

3. Configure the required Worker secret for the browser demo:

       npx wrangler secret put CREATE_KEY

   Enter a random long password that you keep private. Do not hardcode it in GitHub or client code. The secret is used to prevent arbitrary visitors from creating unlimited rooms.

4. Open the *.workers.dev address that Wrangler printed and create your first room in the browser.

Cloudflare Durable Objects can incur usage charges outside included allowances; check your plan and limits.

## API

### Vyon app

- GET `/healthz` — health JSON used by the Android app
- POST `/api/parties` — creates an app party, capped at two per IP per minute
- POST `/api/parties/<CODE>/join` — joins an app party
- GET `/api/parties/<CODE>/preview` — shows names and capacity before joining
- GET `/api/parties/<CODE>` and POST `/api/parties/<CODE>/leave` — authenticated membership operations
- WSS `/ws/parties/<CODE>` — authenticated party sync, queue, presence, and playback controls

App parties keep the app's six-character codes and host/member tokens. They use a separate Durable Object namespace from the browser demo.

### Browser demo

- GET /api/health — health JSON
- POST /api/rooms with header x-create-key: <CREATE_KEY>
  — returns JSON { roomId, hostKey, path }
- WSS /room/<roomId> — connect to an existing room (room ID is 24 lowercase hex characters)

After the WebSocket opens, send one of:

Listener:

    {"type":"join"}

Host:

    {"type":"join","hostKey":"YOUR_PRIVATE_HOST_KEY"}

When joined, the server sends a welcome event and latest saved state, if any.
Host playback update:

    {
      "type": "sync",
      "trackId": "example-song-id",
      "title": "Example song",
      "positionMs": 15000,
      "playing": true,
      "queue": [{"id": "next-song", "title": "Next song"}]
    }

The server broadcasts:

    {
      "type": "state",
      "trackId": "example-song-id",
      "title": "Example song",
      "positionMs": 15000,
      "playing": true,
      "queue": [{"id": "next-song", "title": "Next song"}],
      "updatedAt": 1792170000000
    }

To estimate the current playhead for a playing track, calculate
positionMs + max(0, Date.now() - updatedAt), then seek/adjust as needed.
Use a proper clock-offset calculation for low-drift production syncing.

## Security and limitations

- Guests may connect and read state if they know the invite room ID, but cannot change it.
- The host key is a 256-bit random secret, sent in a WebSocket message after connecting; it is not included in invite URLs. The browser demo saves the host key in sessionStorage so the creator can reconnect in the same tab. Protect that tab and do not share the host key.
- The server stores only a SHA-256 hash of the host key. The room ID has 96 random bits.
- Rooms are capped at 50 connections and queue length at 100 items. For public production, add rate limiting to the room-creation endpoint, room expiration/cleanup, monitoring, and optional user account authorization.
- Playback metadata is not end-to-end encrypted, and anyone with a room link can read it.
- App party identities and profile fields are supplied by the client; this Worker does not verify an account-provider token.
- The app party-creation endpoint is public and limited to two rooms per IP per minute. Add account verification or stronger abuse controls before opening it to a large public audience.
- This service does not connect to an external music API; each device plays audio through its own configured source.
- The Cloudflare Worker and the existing Vercel website can be deployed separately.

## Commands

    npm run dev
    npm run deploy
    npm run typecheck

See Cloudflare's current Durable Objects and Wrangler documentation:
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/workers/wrangler/configuration/
