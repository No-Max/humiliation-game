import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../lib/jwt.js';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function requireAdmin(roles?: Array<'ADMIN' | 'EDITOR'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const user = verifyToken(header.slice(7));
      if (user.type !== 'admin') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      if (roles && !roles.includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
