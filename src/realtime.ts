export type SharedRoom = {
  code: string;
  caseId: string;
  players: number;
  round: 0 | 1 | 2 | 3;
  phase: 'lobby' | 'clue' | 'accuse' | 'reveal';
  secondsLeft: number;
  paused: boolean;
  updatedAt: number;
  expiresAt: number;
};

type RoomResponse = { room: SharedRoom; hostToken?: string; error?: string };

export const REALTIME_ORIGIN = import.meta.env.VITE_REALTIME_URL || 'http://127.0.0.1:8787';

async function roomRequest(path: string, init?: RequestInit): Promise<RoomResponse> {
  const response = await fetch(`${REALTIME_ORIGIN}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const result = await response.json() as RoomResponse;
  if (!response.ok) throw new Error(result.error || 'The room service is unavailable.');
  return result;
}

export function createRemoteRoom(caseId: string, players: number): Promise<RoomResponse> {
  return roomRequest('/rooms', { method: 'POST', body: JSON.stringify({ caseId, players }) });
}

export function joinRemoteRoom(code: string): Promise<RoomResponse> {
  return roomRequest(`/rooms/${encodeURIComponent(code.toUpperCase())}/join`, { method: 'POST', body: '{}' });
}

export function updateRemoteRoom(room: SharedRoom, hostToken: string): Promise<RoomResponse> {
  return roomRequest(`/rooms/${encodeURIComponent(room.code)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${hostToken}` },
    body: JSON.stringify({ round: room.round, phase: room.phase, secondsLeft: room.secondsLeft, paused: room.paused }),
  });
}

export function connectRemoteRoom(code: string, onRoom: (room: SharedRoom) => void, onStatus: (connected: boolean) => void): WebSocket {
  const socketUrl = new URL(`/rooms/${encodeURIComponent(code)}/socket`, REALTIME_ORIGIN);
  socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(socketUrl);
  socket.addEventListener('open', () => onStatus(true));
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as { type?: string; room?: SharedRoom };
    if (message.type === 'room' && message.room) onRoom(message.room);
  });
  socket.addEventListener('close', () => onStatus(false));
  socket.addEventListener('error', () => onStatus(false));
  return socket;
}
