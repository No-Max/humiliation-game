import { randomInt } from 'node:crypto';
import { prisma } from './prisma.js';

export const ROOM_CODE_LENGTH = 6;

export async function generateUniqueRoomCode(): Promise<string> {
  const min = 10 ** (ROOM_CODE_LENGTH - 1);
  const max = 10 ** ROOM_CODE_LENGTH;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = String(randomInt(min, max));
    const existing = await prisma.gameRoom.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!existing) return code;
  }

  throw new Error('Could not generate unique room code');
}
