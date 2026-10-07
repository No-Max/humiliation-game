import crypto from 'node:crypto';
import type { Request, Response } from 'express';

const COOKIE_NAME = 'hg_session';
const SESSION_TTL_SEC = 30 * 24 * 60 * 60;

export type SessionPayload = {
  playerId: string;
  exp: number;
};

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('SESSION_SECRET (or JWT_SECRET) is not configured');
  }
  return secret;
}

function sign(body: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url');
}

export function createSessionToken(playerId: string): string {
  const payload: SessionPayload = {
    playerId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload?.playerId || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function getSessionPlayerId(req: Request): string | null {
  return parseSessionToken(readCookie(req, COOKIE_NAME))?.playerId ?? null;
}

export function setSessionCookie(res: Response, playerId: string): void {
  const token = createSessionToken(playerId);
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SEC}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}
