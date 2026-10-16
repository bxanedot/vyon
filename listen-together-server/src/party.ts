import { DurableObject } from "cloudflare:workers";

interface Env {
  PARTIES: DurableObjectNamespace;
}

type Track = {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  durationMs?: number;
  fromAutoplay: boolean;
};

type Member = {
  memberId: string;
  userId: string;
  deviceId: string;
  displayName: string;
  avatarUrl?: string;
  token: string;
  isHost: boolean;
  connected: boolean;
  joinedAtMs: number;
  lastSeenMs: number;
};

type Playback = {
  seq: number;
  track: Track | null;
  queueSeq: number;
  queueIndex: number;
  isPlaying: boolean;
  positionMs: number;
  anchorMs: number;
  updatedBy: string | null;
  startedBy: string | null;
  startedByName: string | null;
  autoplayEnabled: boolean;
  updatedAtMs: number;
};

type Party = {
  code: string;
  createdAtMs: number;
  maxMembers: number;
  hostOnlyControl: boolean;
  members: Member[];
  playback: Playback;
  queue: Track[];
};

type JoinRequest = {
  userId: string;
  deviceId: string;
  displayName: string;
  avatarUrl?: string;
  maxMembers?: number;
  autoplayEnabled?: boolean;
};

const PARTY_KEY = "party";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const HEARTBEAT_MS = 5_000;
const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function error(status: number, code: string, message: string): Response {
  return json({ error: code, message }, status);
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => CODE_CHARS[byte % CODE_CHARS.length]).join("");
}

function cleanJoinRequest(value: unknown): JoinRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!userId || userId.length > 128 || !deviceId || deviceId.length > 128 || !displayName || displayName.length > 80) return null;

  let avatarUrl: string | undefined;
  if (body.avatarUrl !== undefined && body.avatarUrl !== null && body.avatarUrl !== "") {
    if (typeof body.avatarUrl !== "string" || body.avatarUrl.length > 1000 || !/^https?:\/\//i.test(body.avatarUrl)) return null;
    avatarUrl = body.avatarUrl;
  }

  let maxMembers: number | undefined;
  if (body.maxMembers !== undefined && body.maxMembers !== null) {
    if (typeof body.maxMembers !== "number" || !Number.isInteger(body.maxMembers) || body.maxMembers < 2 || body.maxMembers > 10) return null;
    maxMembers = body.maxMembers;
  }
  if (body.autoplayEnabled !== undefined && typeof body.autoplayEnabled !== "boolean") return null;

  return { userId, deviceId, displayName, avatarUrl, maxMembers, autoplayEnabled: body.autoplayEnabled as boolean | undefined };
}

async function readJson(request: Request): Promise<unknown | null> {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > 16_384) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > 16_384) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function publicMember(member: Member) {
  const { token: _token, deviceId: _deviceId, ...wire } = member;
  return wire;
}

function positionAt(playback: Playback, now: number): number {
  const position = playback.positionMs + (playback.isPlaying ? Math.max(0, now - playback.anchorMs) : 0);
  return playback.track?.durationMs ? Math.min(position, playback.track.durationMs) : position;
}

function playbackWire(party: Party, now = Date.now()) {
  return {
    ...party.playback,
    queueSeq: party.playback.queueSeq,
    queueLength: party.queue.length,
    queueIndex: party.playback.queueIndex,
    effectivePositionMs: positionAt(party.playback, now),
  };
}

function queueWire(party: Party) {
  return { seq: party.playback.queueSeq, index: party.playback.queueIndex, items: party.queue };
}

function partyWire(party: Party, now = Date.now()) {
  return {
    code: party.code,
    createdAtMs: party.createdAtMs,
    maxMembers: party.maxMembers,
    hostOnlyControl: party.hostOnlyControl,
    members: party.members.map(publicMember),
    playback: playbackWire(party, now),
    queue: queueWire(party),
    serverMs: now,
  };
}

function membersFrame(party: Party) {
  return {
    type: "members",
    members: party.members.map(publicMember),
    maxMembers: party.maxMembers,
    hostOnlyControl: party.hostOnlyControl,
    serverMs: Date.now(),
  };
}

function stateFrame(party: Party) {
  const now = Date.now();
  return { type: "state", playback: playbackWire(party, now), serverMs: now };
}

function queueFrame(party: Party) {
  return { type: "queue", queue: queueWire(party), serverMs: Date.now() };
}

function newParty(code: string, maxMembers: number, autoplayEnabled = false): Party {
  const now = Date.now();
  return {
    code,
    createdAtMs: now,
    maxMembers,
    hostOnlyControl: false,
    members: [],
    queue: [],
    playback: {
      seq: 0,
      track: null,
      queueSeq: 0,
      queueIndex: -1,
      isPlaying: false,
      positionMs: 0,
      anchorMs: now,
      updatedBy: null,
      startedBy: null,
      startedByName: null,
      autoplayEnabled,
      updatedAtMs: now,
    },
  };
}

function addMember(party: Party, input: JoinRequest): Member | null {
  const now = Date.now();
  const existing = party.members.find((member) => member.deviceId === input.deviceId);
  if (!existing && party.members.length >= party.maxMembers) return null;
  const member = existing ?? {
    memberId: randomHex(8),
    userId: input.userId,
    deviceId: input.deviceId,
    displayName: input.displayName,
    token: randomHex(24),
    isHost: party.members.length === 0,
    connected: false,
    joinedAtMs: now,
    lastSeenMs: now,
  };
  member.userId = input.userId;
  member.displayName = input.displayName;
  member.avatarUrl = input.avatarUrl;
  member.token = randomHex(24);
  member.lastSeenMs = now;
  if (!existing) party.members.push(member);
  return member;
}

function membership(party: Party, member: Member) {
  return { code: party.code, token: member.token, you: publicMember(member), party: partyWire(party) };
}

function cleanTrack(value: unknown): Track | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const track = value as Record<string, unknown>;
  if (typeof track.videoId !== "string" || !track.videoId || track.videoId.length > 128) return null;
  if (track.title !== undefined && typeof track.title !== "string") return null;
  if (track.artist !== undefined && typeof track.artist !== "string") return null;
  if (track.thumbnailUrl !== undefined && track.thumbnailUrl !== null && typeof track.thumbnailUrl !== "string") return null;
  if (track.durationMs !== undefined && track.durationMs !== null && (typeof track.durationMs !== "number" || !Number.isFinite(track.durationMs) || track.durationMs < 0)) return null;
  return {
    videoId: track.videoId,
    title: String(track.title ?? "").slice(0, 300),
    artist: String(track.artist ?? "").slice(0, 300),
    thumbnailUrl: typeof track.thumbnailUrl === "string" ? track.thumbnailUrl.slice(0, 1000) : undefined,
    durationMs: typeof track.durationMs === "number" ? Math.round(track.durationMs) : undefined,
    fromAutoplay: track.fromAutoplay === true,
  };
}

function nearestIndex(queue: Track[], videoId: string, around: number): number {
  const found = queue.map((track, index) => track.videoId === videoId ? index : -1).filter((index) => index >= 0);
  return found.length ? found.sort((a, b) => Math.abs(a - around) - Math.abs(b - around))[0] : -1;
}

function applyAction(party: Party, member: Member, frame: Record<string, unknown>): { error?: [string, string]; queueChanged?: boolean; membersChanged?: boolean; kicked?: string } {
  const action = typeof frame.action === "string" ? frame.action : "";
  const playback = party.playback;
  const now = Date.now();
  const pos = typeof frame.positionMs === "number" && Number.isFinite(frame.positionMs) ? Math.max(0, Math.round(frame.positionMs)) : null;
  const hostOnlyAction = new Set(["kick", "setMaxMembers", "setHostOnlyControl"]);
  const playbackAction = new Set(["play", "pause", "seek", "setTrack", "setQueue", "queueAdd", "queueRemove", "queueClear", "queueMove", "next", "previous", "setAutoplay"]);
  if (hostOnlyAction.has(action) && !member.isHost) return { error: ["host_only", "Only the host can change party settings."] };
  if (party.hostOnlyControl && playbackAction.has(action) && !member.isHost) return { error: ["host_only", "Only the host can control the music in this party."] };

  const touch = () => { playback.seq++; playback.updatedBy = member.memberId; playback.updatedAtMs = now; };
  const touchQueue = () => { playback.queueSeq++; playback.updatedBy = member.memberId; playback.updatedAtMs = now; };
  const setTrack = (track: Track, index?: number, isPlaying = true, position = 0) => {
    playback.track = track;
    playback.positionMs = Math.max(0, position);
    playback.isPlaying = isPlaying;
    playback.anchorMs = now + (isPlaying ? 350 : 0);
    playback.startedBy = member.memberId;
    playback.startedByName = member.displayName;
    const requested = Number.isInteger(index) ? index! : -1;
    playback.queueIndex = requested >= 0 && requested < party.queue.length && party.queue[requested].videoId === track.videoId
      ? requested : nearestIndex(party.queue, track.videoId, playback.queueIndex);
    touch();
  };

  switch (action) {
    case "play":
      playback.positionMs = pos ?? positionAt(playback, now); playback.isPlaying = true; playback.anchorMs = now + 350; touch(); break;
    case "pause":
      playback.positionMs = pos ?? positionAt(playback, now); playback.isPlaying = false; playback.anchorMs = now; touch(); break;
    case "seek":
      if (pos === null) return { error: ["missing_position", "seek requires positionMs"] };
      playback.positionMs = pos; playback.anchorMs = now + (playback.isPlaying ? 350 : 0); touch(); break;
    case "setTrack": {
      const track = cleanTrack(frame.track);
      if (!track) return { error: ["invalid_track", "Track must include videoId"] };
      setTrack(track, typeof frame.queueIndex === "number" ? frame.queueIndex : undefined, frame.isPlaying !== false, pos ?? 0);
      break;
    }
    case "setQueue": {
      if (!Array.isArray(frame.queue) || frame.queue.length > 26) return { error: ["invalid_queue", "Queue must contain at most 26 tracks."] };
      const tracks = frame.queue.map(cleanTrack);
      if (tracks.some((track) => !track)) return { error: ["invalid_queue", "Every queue item must include videoId."] };
      party.queue = tracks as Track[];
      let index = typeof frame.queueIndex === "number" && Number.isInteger(frame.queueIndex) ? frame.queueIndex : -1;
      if (playback.track && (index < 0 || index >= party.queue.length || party.queue[index].videoId !== playback.track.videoId)) index = nearestIndex(party.queue, playback.track.videoId, index);
      playback.queueIndex = index >= 0 && index < party.queue.length ? index : -1;
      touchQueue(); return { queueChanged: true };
    }
    case "queueAdd": {
      const raw = Array.isArray(frame.tracks) ? frame.tracks : frame.track ? [frame.track] : [];
      if (raw.length === 0 || raw.length > 26) return { error: ["invalid_queue", "Add between 1 and 26 tracks."] };
      const tracks = raw.map(cleanTrack);
      if (tracks.some((track) => !track)) return { error: ["invalid_queue", "Every queue item must include videoId."] };
      if (party.queue.length + tracks.length > 26) return { error: ["queue_full", "The queue is full."] };
      const insertAt = frame.playNext === true ? playback.queueIndex + 1 : party.queue.length;
      party.queue.splice(Math.max(0, insertAt), 0, ...(tracks as Track[]));
      touchQueue(); return { queueChanged: true };
    }
    case "queueRemove": {
      const index = party.queue.findIndex((track) => track.videoId === frame.videoId);
      if (index < 0 || index === playback.queueIndex) return { error: ["not_found", "Track is not in the upcoming queue."] };
      party.queue.splice(index, 1); if (index < playback.queueIndex) playback.queueIndex--;
      touchQueue(); return { queueChanged: true };
    }
    case "queueClear":
      if (party.queue.length <= playback.queueIndex + 1) return { error: ["no_upcoming", "No upcoming tracks to clear."] };
      party.queue.splice(playback.queueIndex + 1); touchQueue(); return { queueChanged: true };
    case "queueMove": {
      const from = typeof frame.videoId === "string" ? party.queue.findIndex((track) => track.videoId === frame.videoId) : Number(frame.fromIndex);
      const to = Number(frame.toIndex);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from <= playback.queueIndex || to <= playback.queueIndex || from < 0 || from >= party.queue.length || to < 0 || to >= party.queue.length) return { error: ["invalid_move", "Invalid queue move indices."] };
      const [track] = party.queue.splice(from, 1); party.queue.splice(to, 0, track); touchQueue(); return { queueChanged: true };
    }
    case "next": case "previous": {
      const target = playback.queueIndex + (action === "next" ? 1 : -1);
      if (target < 0 || target >= party.queue.length) return { error: [action === "next" ? "end_of_queue" : "start_of_queue", action === "next" ? "Already at the end of the queue." : "Already at the beginning of the queue."] };
      setTrack(party.queue[target], target, true, 0); break;
    }
    case "setAutoplay":
      if (typeof frame.enabled !== "boolean") return { error: ["invalid_autoplay", "AutoPlay must be enabled or disabled."] };
      if (playback.autoplayEnabled !== frame.enabled) { playback.autoplayEnabled = frame.enabled; playback.updatedBy = member.memberId; playback.updatedAtMs = now; }
      break;
    case "setHostOnlyControl":
      if (typeof frame.enabled !== "boolean") return { error: ["invalid_control_policy", "Host-only control must be enabled or disabled."] };
      party.hostOnlyControl = frame.enabled; return { membersChanged: true };
    case "setMaxMembers":
      if (typeof frame.maxMembers !== "number" || !Number.isInteger(frame.maxMembers) || frame.maxMembers < party.members.length || frame.maxMembers > 10 || frame.maxMembers < 2) return { error: ["invalid_capacity", "Choose a party size from the current member count to 10."] };
      party.maxMembers = frame.maxMembers; return { membersChanged: true };
    case "kick": {
      if (typeof frame.memberId !== "string" || frame.memberId === member.memberId) return { error: ["invalid_member", "Choose another listener to remove."] };
      const index = party.members.findIndex((other) => other.memberId === frame.memberId);
      if (index < 0) return { error: ["not_found", "That listener is no longer in this party."] };
      const [removed] = party.members.splice(index, 1); return { membersChanged: true, kicked: removed.memberId };
    }
    default: return { error: ["unknown_action", `Unknown action '${action}'.`] };
  }
  return {};
}

export class PartyRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/_rate" && request.method === "POST") return this.rateLimit();
    if (path === "/_party/create" && request.method === "POST") return this.create(request);
    if (path === "/_party/join" && request.method === "POST") return this.join(request);
    if (path === "/_party/preview" && request.method === "GET") return this.preview();
    if (path === "/_party/get" && request.method === "GET") return this.getParty(request);
    if (path === "/_party/leave" && request.method === "POST") return this.leave(request);
    if (path === "/_party/ws" && request.headers.get("upgrade")?.toLowerCase() === "websocket") return this.connectParty(request);
    return error(404, "not_found", "Not found.");
  }

  private async rateLimit(): Promise<Response> {
    const now = Date.now();
    const result = await this.ctx.storage.transaction(async (txn) => {
      const state = await txn.get<{ window: number; count: number }>("createRate");
      const window = Math.floor(now / 60_000);
      const count = state?.window === window ? state.count : 0;
      if (count >= 2) return false;
      await txn.put("createRate", { window, count: count + 1 });
      await txn.setAlarm((window + 1) * 60_000);
      return true;
    });
    return result ? json({ ok: true }) : error(429, "create_rate_limited", "You can create up to two parties per minute. Please try again shortly.");
  }

  private async create(request: Request): Promise<Response> {
    if (await this.ctx.storage.get<Party>(PARTY_KEY)) return error(409, "code_collision", "Could not allocate a party code.");
    const value = await readJson(request);
    const body = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
    const input = cleanJoinRequest(body?.identity);
    if (!input) return error(422, "validation_error", "Party identity is invalid.");
    const code = typeof body?.code === "string" && /^[A-Z0-9]{6}$/.test(body.code) ? body.code : "";
    if (!code) return error(422, "validation_error", "Party code is invalid.");
    const party = newParty(code, input.maxMembers ?? 5, input.autoplayEnabled ?? false);
    const member = addMember(party, input)!;
    await this.ctx.storage.put(PARTY_KEY, party);
    await this.ctx.storage.setAlarm(party.createdAtMs + MAX_AGE_MS);
    return json(membership(party, member), 201);
  }

  private async join(request: Request): Promise<Response> {
    const input = cleanJoinRequest(await readJson(request));
    if (!input) return error(422, "validation_error", "Party identity is invalid.");
    const result = await this.ctx.storage.transaction(async (txn) => {
      const party = await txn.get<Party>(PARTY_KEY);
      if (!party || Date.now() - party.createdAtMs > MAX_AGE_MS) return { response: error(404, "no_such_party", "No party with that code.") };
      const member = addMember(party, input);
      if (!member) return { response: error(409, "party_full", `This party is full (${party.maxMembers} devices).`) };
      await txn.put(PARTY_KEY, party);
      return { party, member };
    });
    if ("response" in result) return result.response ?? error(500, "server_error", "The party request failed.");
    this.broadcast(membersFrame(result.party));
    return json(membership(result.party, result.member));
  }

  private async preview(): Promise<Response> {
    const party = await this.ctx.storage.get<Party>(PARTY_KEY);
    if (!party || Date.now() - party.createdAtMs > MAX_AGE_MS) return error(404, "no_such_party", "No party with that code.");
    const members = [...party.members].sort((a, b) => a.joinedAtMs - b.joinedAtMs);
    const host = members.find((member) => member.isHost);
    return json({
      code: party.code,
      hostName: host?.displayName ?? "",
      memberCount: members.length,
      maxMembers: party.maxMembers,
      isFull: members.length >= party.maxMembers,
      members: members.map(({ displayName, avatarUrl, isHost }) => ({ displayName, avatarUrl, isHost })),
    });
  }

  private async getParty(request: Request): Promise<Response> {
    const party = await this.ctx.storage.get<Party>(PARTY_KEY);
    if (!party || Date.now() - party.createdAtMs > MAX_AGE_MS) return error(404, "no_such_party", "No party with that code.");
    if (!this.authenticate(party, request)) return error(401, "bad_token", "This device is not a member of that party.");
    return json(partyWire(party));
  }

  private async leave(request: Request): Promise<Response> {
    const result = await this.ctx.storage.transaction(async (txn) => {
      const party = await txn.get<Party>(PARTY_KEY);
      const member = party && this.authenticate(party, request);
      if (!party || !member) return { response: error(401, "bad_token", "This device is not a member of that party.") };
      party.members = party.members.filter((other) => other.memberId !== member.memberId);
      if (member.isHost && party.members.length) party.members[0].isHost = true;
      if (party.members.length === 0) {
        await txn.delete(PARTY_KEY);
        await txn.deleteAlarm();
      }
      else await txn.put(PARTY_KEY, party);
      return { party, memberId: member.memberId };
    });
    if ("response" in result) return result.response ?? error(500, "server_error", "The party request failed.");
    this.sendToMember(result.memberId, { type: "bye", reason: "left" });
    this.closeMember(result.memberId);
    if (result.party.members.length) this.broadcast(membersFrame(result.party), result.memberId);
    return json({ ok: true });
  }

  private authenticate(party: Party, request: Request): Member | undefined {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    return token ? party.members.find((member) => member.token === token) : undefined;
  }

  private async connectParty(request: Request): Promise<Response> {
    const result = await this.ctx.storage.transaction(async (txn) => {
      const party = await txn.get<Party>(PARTY_KEY);
      const member = party && this.authenticate(party, request);
      if (!party || !member || Date.now() - party.createdAtMs > MAX_AGE_MS) return null;
      member.connected = true;
      member.lastSeenMs = Date.now();
      await txn.put(PARTY_KEY, party);
      return { party, member };
    });
    if (!result) return error(401, "bad_token", "This device is not a member of that party.");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ memberId: result.member.memberId });
    server.send(JSON.stringify({ type: "welcome", you: publicMember(result.member), party: partyWire(result.party), serverMs: Date.now() }));
    this.broadcast(membersFrame(result.party));
    await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_MS);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string" || new TextEncoder().encode(message).byteLength > 16_384) {
      socket.close(1009, "Message too large"); return;
    }
    let frame: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(message);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      frame = parsed as Record<string, unknown>;
    } catch { socket.send(JSON.stringify({ type: "error", error: "invalid_json", message: "Invalid JSON." })); return; }

    const { memberId } = (socket.deserializeAttachment() as { memberId?: string } | null) ?? {};
    if (!memberId) { socket.close(1008, "Unknown member"); return; }
    const kind = frame.type;
    if (kind === "ping") {
      socket.send(JSON.stringify({ type: "pong", clientMs: frame.clientMs, serverMs: Date.now() })); return;
    }
    if (kind === "report") return;

    const result = await this.ctx.storage.transaction(async (txn) => {
      const party = await txn.get<Party>(PARTY_KEY);
      const member = party?.members.find((item) => item.memberId === memberId);
      if (!party || !member) return { terminal: true };
      member.lastSeenMs = Date.now();
      if (kind === "sync") return { party, response: stateFrame(party) };
      if (kind === "syncQueue") return { party, response: queueFrame(party) };
      if (kind !== "control") return { error: ["unknown_type", "Unknown message type."] as [string, string] };
      const applied = applyAction(party, member, frame);
      if (applied.error) { await txn.put(PARTY_KEY, party); return { error: applied.error }; }
      await txn.put(PARTY_KEY, party);
      return { party, applied, member };
    });

    if (result.terminal) { socket.send(JSON.stringify({ type: "bye", reason: "left" })); socket.close(1008, "Party ended"); return; }
    if (result.response) { socket.send(JSON.stringify(result.response)); return; }
    if (result.error) { socket.send(JSON.stringify({ type: "error", error: result.error[0], message: result.error[1] })); return; }
    if (!result.party || !result.applied || !result.member) return;

    const { party, applied, member } = result;
    if (applied.kicked) {
      this.sendToMember(applied.kicked, { type: "bye", reason: "kicked", message: "The host removed you from this party." });
      this.closeMember(applied.kicked);
    }
    if (applied.queueChanged) this.broadcast(queueFrame(party));
    this.broadcast(stateFrame(party));
    if (applied.membersChanged) this.broadcast(membersFrame(party));
    this.broadcast({ type: "activity", action: frame.action, by: member.displayName, atMs: Date.now(), detail: String(frame.action ?? "") });
  }

  async webSocketClose(socket: WebSocket): Promise<void> { await this.disconnected(socket); }
  async webSocketError(socket: WebSocket): Promise<void> { await this.disconnected(socket); }

  private async disconnected(socket: WebSocket): Promise<void> {
    const { memberId } = (socket.deserializeAttachment() as { memberId?: string } | null) ?? {};
    if (!memberId) return;
    const stillConnected = this.ctx.getWebSockets().some((other) => {
      if (other === socket || other.readyState !== WebSocket.OPEN) return false;
      return (other.deserializeAttachment() as { memberId?: string } | null)?.memberId === memberId;
    });
    const party = await this.ctx.storage.transaction(async (txn) => {
      const current = await txn.get<Party>(PARTY_KEY);
      const member = current?.members.find((item) => item.memberId === memberId);
      if (!current || !member) return null;
      member.connected = stillConnected;
      member.lastSeenMs = Date.now();
      await txn.put(PARTY_KEY, current);
      return current;
    });
    if (party) this.broadcast(membersFrame(party));
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    const party = await this.ctx.storage.get<Party>(PARTY_KEY);
    if (!party) { await this.ctx.storage.deleteAll(); return; }
    if (now - party.createdAtMs >= MAX_AGE_MS) { await this.ctx.storage.deleteAll(); return; }
    if (this.ctx.getWebSockets().some((socket) => socket.readyState === WebSocket.OPEN)) {
      this.broadcast(stateFrame(party));
      this.broadcast(queueFrame(party));
      await this.ctx.storage.setAlarm(now + HEARTBEAT_MS);
    } else {
      await this.ctx.storage.setAlarm(party.createdAtMs + MAX_AGE_MS);
    }
  }

  private broadcast(frame: unknown, exceptMemberId?: string): void {
    const encoded = JSON.stringify(frame);
    for (const socket of this.ctx.getWebSockets()) {
      const memberId = (socket.deserializeAttachment() as { memberId?: string } | null)?.memberId;
      if (memberId !== exceptMemberId && socket.readyState === WebSocket.OPEN) {
        try { socket.send(encoded); } catch { /* disconnected socket */ }
      }
    }
  }

  private sendToMember(memberId: string, frame: unknown): void {
    for (const socket of this.ctx.getWebSockets()) {
      if ((socket.deserializeAttachment() as { memberId?: string } | null)?.memberId === memberId) {
        try { socket.send(JSON.stringify(frame)); } catch { /* disconnected socket */ }
      }
    }
  }

  private closeMember(memberId: string): void {
    for (const socket of this.ctx.getWebSockets()) {
      if ((socket.deserializeAttachment() as { memberId?: string } | null)?.memberId === memberId) {
        try { socket.close(1000, "Membership ended"); } catch { /* disconnected socket */ }
      }
    }
  }
}
