import { DurableObject } from "cloudflare:workers";
import { PartyRoom } from "./party";
export { PartyRoom };

interface Env {
  ROOMS: DurableObjectNamespace;
  PARTIES: DurableObjectNamespace;
  ASSETS: Fetcher;
  CREATE_KEY?: string;
}

type Role = "host" | "listener";
type Session = { joined: boolean; role: Role };
type Track = { id: string; title: string };
type Playback = {
  type: "state";
  trackId: string;
  title: string;
  positionMs: number;
  playing: boolean;
  queue: Track[];
  updatedAt: number;
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
}

async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (x) => x.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

function partyCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => chars[byte % chars.length]).join("");
}

function partyRequest(env: Env, code: string, path: string, request: Request): Promise<Response> {
  const room = env.PARTIES.getByName("party:" + code);
  return room.fetch(new Request("https://party.internal" + path, request));
}

function validTrack(value: unknown): value is Track {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Track).id === "string" &&
    (value as Track).id.length > 0 &&
    (value as Track).id.length <= 128 &&
    typeof (value as Track).title === "string" &&
    (value as Track).title.length <= 160
  );
}

export class ListenRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;

    // Internal endpoint: the public Worker never forwards user requests here.
    if (path === "/_initialize" && request.method === "POST") {
      if (await this.ctx.storage.get("hostHash")) return json({ error: "Room exists" }, 409);
      const body = (await request.json().catch(() => null)) as { hostKey?: unknown } | null;
      if (!body || typeof body.hostKey !== "string" || body.hostKey.length !== 64) {
        return json({ error: "Invalid host key" }, 400);
      }
      await this.ctx.storage.put("hostHash", await sha256(body.hostKey));
      return json({ created: true }, 201);
    }

    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return json({ error: "WebSocket required" }, 426);
    }
    if (!(await this.ctx.storage.get("hostHash"))) return json({ error: "Room not found" }, 404);
    if (this.ctx.getWebSockets().length >= 50) return json({ error: "Room is full" }, 429);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ joined: false, role: "listener" } satisfies Session);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string" || message.length > 32768) {
      socket.close(1009, "Invalid message size");
      return;
    }
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(message);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      data = parsed as Record<string, unknown>;
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    const session = (socket.deserializeAttachment() as Session | null) ?? {
      joined: false,
      role: "listener" as Role,
    };

    if (!session.joined) {
      if (data.type !== "join") {
        socket.close(1008, "First message must be join");
        return;
      }
      let role: Role = "listener";
      if (data.hostKey !== undefined && data.hostKey !== "") {
        if (typeof data.hostKey !== "string" || data.hostKey.length !== 64) {
          socket.close(1008, "Invalid host key");
          return;
        }
        const actual = await sha256(data.hostKey);
        const expected = (await this.ctx.storage.get<string>("hostHash")) ?? "";
        if (!safeEqual(actual, expected)) {
          socket.close(1008, "Invalid host key");
          return;
        }
        role = "host";
      }
      socket.serializeAttachment({ joined: true, role } satisfies Session);
      socket.send(JSON.stringify({ type: "welcome", role }));
      const state = await this.ctx.storage.get<Playback>("playback");
      if (state) socket.send(JSON.stringify(state));
      this.broadcastPresence();
      return;
    }

    if (data.type === "ping") {
      socket.send(JSON.stringify({ type: "pong", at: Date.now() }));
      return;
    }

    if (session.role !== "host") {
      socket.send(JSON.stringify({ type: "error", message: "Only hosts can change playback" }));
      return;
    }

    if (data.type !== "sync") {
      socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
      return;
    }

    if (
      typeof data.trackId !== "string" ||
      data.trackId.length > 128 ||
      typeof data.title !== "string" ||
      data.title.length > 160 ||
      typeof data.positionMs !== "number" ||
      !Number.isFinite(data.positionMs) ||
      data.positionMs < 0 ||
      data.positionMs > 86400000 ||
      typeof data.playing !== "boolean"
    ) {
      socket.send(JSON.stringify({ type: "error", message: "Invalid playback state" }));
      return;
    }

    const queue: Track[] = Array.isArray(data.queue) && data.queue.length <= 100 &&
      data.queue.every(validTrack)
      ? data.queue
      : [];

    const state: Playback = {
      type: "state",
      trackId: data.trackId,
      title: data.title,
      positionMs: Math.round(data.positionMs),
      playing: data.playing,
      queue,
      updatedAt: Date.now(),
    };

    await this.ctx.storage.put("playback", state);
    this.broadcast(state);
  }

  private broadcast(value: unknown): void {
    const encoded = JSON.stringify(value);
    for (const ws of this.ctx.getWebSockets()) {
      const session = ws.deserializeAttachment() as Session | null;
      if (session?.joined && ws.readyState === WebSocket.OPEN) {
        try { ws.send(encoded); } catch { /* socket disconnected */ }
      }
    }
  }

  private broadcastPresence(): void {
    const connections = this.ctx.getWebSockets().filter((ws) => {
      const session = ws.deserializeAttachment() as Session | null;
      return session?.joined && ws.readyState === WebSocket.OPEN;
    }).length;
    this.broadcast({ type: "presence", connections });
  }

  async webSocketClose(): Promise<void> {
    this.broadcastPresence();
  }

  async webSocketError(): Promise<void> {
    this.broadcastPresence();
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path === "/healthz" && request.method === "GET") return json({ ok: true });
    if (path === "/api/health") return json({ ok: true, service: "listen-together" });

    if (path === "/api/parties" && request.method === "POST") {
      const ip = request.headers.get("cf-connecting-ip") ?? "local";
      const limiter = env.PARTIES.getByName("rate:" + await sha256(ip));
      const limited = await limiter.fetch("https://party.internal/_rate", { method: "POST" });
      if (!limited.ok) return limited;

      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > 16_384) return json({ error: "request_too_large", message: "Request is too large." }, 413);
      let body: unknown;
      try { body = JSON.parse(text); } catch { return json({ error: "validation_error", message: "Party identity is invalid." }, 422); }
      for (let attempt = 0; attempt < 12; attempt++) {
        const code = partyCode();
        const room = env.PARTIES.getByName("party:" + code);
        const result = await room.fetch("https://party.internal/_party/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code, identity: body }),
        });
        if (result.status !== 409) return result;
      }
      return json({ error: "code_exhausted", message: "Could not allocate a party code." }, 503);
    }

    const join = /^\/api\/parties\/([A-Za-z0-9]{6})\/join$/.exec(path);
    if (join && request.method === "POST") return partyRequest(env, join[1].toUpperCase(), "/_party/join", request);
    const preview = /^\/api\/parties\/([A-Za-z0-9]{6})\/preview$/.exec(path);
    if (preview && request.method === "GET") return partyRequest(env, preview[1].toUpperCase(), "/_party/preview", request);
    const getParty = /^\/api\/parties\/([A-Za-z0-9]{6})$/.exec(path);
    if (getParty && request.method === "GET") return partyRequest(env, getParty[1].toUpperCase(), "/_party/get", request);
    const leave = /^\/api\/parties\/([A-Za-z0-9]{6})\/leave$/.exec(path);
    if (leave && request.method === "POST") return partyRequest(env, leave[1].toUpperCase(), "/_party/leave", request);
    const socket = /^\/ws\/parties\/([A-Za-z0-9]{6})$/.exec(path);
    if (socket && request.method === "GET") return partyRequest(env, socket[1].toUpperCase(), "/_party/ws", request);

    if (path === "/api/rooms") {
      if (request.method !== "POST") return json({ error: "POST required" }, 405);
      if (!env.CREATE_KEY) {
        return json({ error: "Set the CREATE_KEY Worker secret first" }, 503);
      }
      const given = request.headers.get("x-create-key") ?? "";
      if (!safeEqual(given, env.CREATE_KEY)) return json({ error: "Invalid creation key" }, 401);

      const roomId = randomHex(12);
      const hostKey = randomHex(32);
      const room = env.ROOMS.getByName(roomId);
      const result = await room.fetch(new Request("https://room.internal/_initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostKey }),
      }));
      if (!result.ok) return json({ error: "Failed to create room" }, 500);
      return json({ roomId, hostKey, path: "/room/" + roomId }, 201);
    }

    const match = /^\/room\/([0-9a-f]{24})$/.exec(path);
    if (match) return env.ROOMS.getByName(match[1]).fetch(request);

    if (path.startsWith("/api/") || path.startsWith("/room/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
