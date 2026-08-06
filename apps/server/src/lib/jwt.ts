import jwt from 'jsonwebtoken';
import type { AdminRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  type: 'admin' | 'team';
}

export function signToken(payload: JwtPayload, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
