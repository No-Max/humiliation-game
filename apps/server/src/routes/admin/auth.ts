import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { signToken } from '../../lib/jwt.js';
import { requireAdmin, type AuthRequest } from '../../middleware/auth.js';

export const adminAuthRouter = Router();

adminAuthRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'admin',
  });

  res.json({
    accessToken: token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

adminAuthRouter.get('/me', requireAdmin(), async (req: AuthRequest, res) => {
  const user = await prisma.adminUser.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});
