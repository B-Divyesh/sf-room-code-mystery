import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve, upgradeWebSocket } from '@hono/node-server';
import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 8787);
const DB_PATH = process.env.DATABASE_PATH || '/data/rooms-v3.sqlite';
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const allowedOrigins = new Set([
  'https://room-code-mystery.sociobot.in',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]);

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('busy_timeout = 5000');
db.exec(`CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  players INTEGER NOT NULL CHECK(players BETWEEN 4 AND 8),
  host_token_hash TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 0,
  phase TEXT NOT NULL DEFAULT 'lobby',
  seconds_left INTEGER NOT NULL DEFAULT 180,
  paused INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
)`);

const app = new Hono();
const sockets = new Map();
const requestWindows = new Map();
const roomFields = 'code, case_id, players, round, phase, seconds_left, paused, updated_at, expires_at';

function hash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function publicRoom(row) {
  return {
    code: row.code,
    caseId: row.case_id,
    players: row.players,
    round: row.round,
    phase: row.phase,
    secondsLeft: row.seconds_left,
    paused: Boolean(row.paused),
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
  };
}

function getRoom(code) {
  db.prepare('DELETE FROM rooms WHERE expires_at <= ?').run(Date.now());
  return db.prepare(`SELECT ${roomFields}, host_token_hash FROM rooms WHERE code = ?`).get(code);
}

function makeCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const bytes = randomBytes(5);
    const code = [...bytes].map((value) => ALPHABET[value % ALPHABET.length]).join('');
    if (!getRoom(code)) return code;
  }
  throw new Error('Could not allocate a room code.');
}

function broadcast(code, room) {
  const payload = JSON.stringify({ type: 'room', room: publicRoom(room) });
  for (const socket of sockets.get(code) || []) {
    if (socket.readyState === 1) socket.send(payload);
  }
}

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin');
  if (origin && !allowedOrigins.has(origin)) return c.json({ error: 'Origin is not allowed.' }, 403);
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  const client = forwarded || c.req.header('x-real-ip') || 'local';
  const now = Date.now();
  const window = requestWindows.get(client) || { started: now, count: 0 };
  if (now - window.started > 60_000) Object.assign(window, { started: now, count: 0 });
  window.count += 1;
  requestWindows.set(client, window);
  if (window.count > 180) return c.json({ error: 'Too many requests. Try again in one minute.' }, 429);
  await next();
  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
  }
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
});

app.options('*', (c) => {
  const origin = c.req.header('Origin');
  if (!origin || !allowedOrigins.has(origin)) return c.body(null, 403);
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  c.header('Access-Control-Max-Age', '86400');
  return c.body(null, 204);
});

app.get('/health', (c) => c.json({ ok: true, storage: 'sqlite', ttlHours: 6 }));

app.post('/rooms', async (c) => {
  if (Number(c.req.header('content-length') || 0) > 2_048) return c.json({ error: 'Request is too large.' }, 413);
  let body;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Send valid room details.' }, 400); }
  if (!['glasshouse-lantern', 'orchid-ledger'].includes(body.caseId) || !Number.isInteger(body.players) || body.players < 4 || body.players > 8) {
    return c.json({ error: 'Choose a case and 4–8 players.' }, 400);
  }
  const code = makeCode();
  const hostToken = randomBytes(24).toString('base64url');
  const now = Date.now();
  db.prepare(`INSERT INTO rooms
    (code, case_id, players, host_token_hash, round, phase, seconds_left, paused, updated_at, expires_at)
    VALUES (?, ?, ?, ?, 0, 'lobby', 180, 1, ?, ?)`)
    .run(code, body.caseId, body.players, hash(hostToken), now, now + ROOM_TTL_MS);
  const room = getRoom(code);
  return c.json({ room: publicRoom(room), hostToken }, 201);
});

app.get('/rooms/:code', (c) => {
  const code = c.req.param('code').toUpperCase();
  const room = getRoom(code);
  if (!room) return c.json({ error: 'That room has ended or the code is wrong.' }, 404);
  return c.json({ room: publicRoom(room) });
});

app.post('/rooms/:code/join', (c) => {
  const room = getRoom(c.req.param('code').toUpperCase());
  if (!room) return c.json({ error: 'That room has ended or the code is wrong.' }, 404);
  return c.json({ room: publicRoom(room) });
});

app.patch('/rooms/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const room = getRoom(code);
  if (!room) return c.json({ error: 'That room has ended.' }, 404);
  const token = c.req.header('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token || hash(token) !== room.host_token_hash) return c.json({ error: 'Only the host can change the room.' }, 403);
  if (Number(c.req.header('content-length') || 0) > 2_048) return c.json({ error: 'Request is too large.' }, 413);
  let body;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Send valid room state.' }, 400); }
  const phases = ['lobby', 'clue', 'accuse', 'reveal'];
  if (!Number.isInteger(body.round) || body.round < 0 || body.round > 3 || !phases.includes(body.phase) ||
      !Number.isInteger(body.secondsLeft) || body.secondsLeft < 0 || body.secondsLeft > 180 || typeof body.paused !== 'boolean') {
    return c.json({ error: 'Room state is invalid.' }, 400);
  }
  const now = Date.now();
  db.prepare(`UPDATE rooms SET round = ?, phase = ?, seconds_left = ?, paused = ?, updated_at = ?, expires_at = ? WHERE code = ?`)
    .run(body.round, body.phase, body.secondsLeft, body.paused ? 1 : 0, now, now + ROOM_TTL_MS, code);
  const updated = getRoom(code);
  broadcast(code, updated);
  return c.json({ room: publicRoom(updated) });
});

app.get('/rooms/:code/socket', upgradeWebSocket((c) => {
  const code = c.req.param('code').toUpperCase();
  const origin = c.req.header('Origin');
  return {
    onOpen(_event, ws) {
      if ((origin && !allowedOrigins.has(origin)) || !getRoom(code)) {
        ws.close(1008, 'Room or origin is not allowed.');
        return;
      }
      if (!sockets.has(code)) sockets.set(code, new Set());
      sockets.get(code).add(ws.raw);
      ws.send(JSON.stringify({ type: 'room', room: publicRoom(getRoom(code)) }));
    },
    onClose(_event, ws) {
      sockets.get(code)?.delete(ws.raw);
      if (sockets.get(code)?.size === 0) sockets.delete(code);
    },
    onMessage() {},
  };
}));

app.notFound((c) => c.json({ error: 'Not found.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'The room service could not complete that request.' }, 500);
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 2_048 });
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0', websocket: { server: wss } }, (info) => {
  console.log(`Room service listening on ${info.port}; database ${DB_PATH}`);
});
