import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  JoinRoomPayload,
  RoomState,
  ServerToClientEvents,
} from '@humiliation-game/shared';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let reconnectHandler: (() => void) | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: '/socket.io',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function onRoomState(callback: (state: RoomState) => void) {
  const s = connectSocket();
  s.on('roomState', callback);
  return () => s.off('roomState', callback);
}

export function onSocketConnectionChange(callback: (connected: boolean) => void) {
  const s = connectSocket();
  const onConnect = () => callback(true);
  const onDisconnect = () => callback(false);
  s.on('connect', onConnect);
  s.on('disconnect', onDisconnect);
  callback(s.connected);
  return () => {
    s.off('connect', onConnect);
    s.off('disconnect', onDisconnect);
  };
}

export function setAutoRejoin(getPayload: () => JoinRoomPayload | null) {
  const s = getSocket();
  if (reconnectHandler) {
    s.off('connect', reconnectHandler);
  }

  reconnectHandler = () => {
    const payload = getPayload();
    if (!payload) return;
    s.emit('joinRoom', payload, () => {});
  };

  s.on('connect', reconnectHandler);
}

export function disableAutoRejoin() {
  setAutoRejoin(() => null);
}

export function leaveRoom(callback: (result: { ok: boolean; error?: string }) => void) {
  connectSocket().emit('leaveRoom', callback);
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function joinRoom(
  payload: JoinRoomPayload,
  callback: (result: { ok: boolean; error?: string; teamId?: string; teamName?: string }) => void,
) {
  connectSocket().emit('joinRoom', payload, callback);
}
