import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  JoinRoomPayload,
  ServerToClientEvents,
} from '@humiliation-game/shared';
import { prisma } from '../lib/prisma.js';
import { GameEngine } from '../game/engine.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

const rooms = new Map<string, GameEngine>();
/** teamId → socketId активного подключения */
const teamConnections = new Map<string, string>();

function teamSlotPath(roomCode: string, teamId: string) {
  return `/team/${roomCode}/${teamId}`;
}

function displayPath(roomCode: string) {
  return `/display/${roomCode}`;
}

export function setupSocketHandlers(io: GameServer) {
  io.on('connection', (socket: GameSocket) => {
    let roomCode: string | null = null;
    let teamId: string | null = null;
    let role: 'team' | 'display' = 'display';

    socket.on('joinRoom', async (payload: JoinRoomPayload, callback) => {
      try {
        const room = await prisma.gameRoom.findUnique({
          where: { code: payload.roomCode },
          include: {
            teams: { orderBy: { sortOrder: 'asc' } },
            series: {
              include: {
                tours: {
                  orderBy: { sortOrder: 'asc' },
                  include: { questions: { orderBy: { sortOrder: 'asc' } } },
                },
              },
            },
          },
        });

        if (!room) {
          callback({ ok: false, error: 'Room not found' });
          return;
        }

        roomCode = payload.roomCode;
        role = payload.role;
        await socket.join(roomCode);

        let engine = rooms.get(roomCode);
        if (!engine) {
          engine = new GameEngine(roomCode, room.series, room.teams);
          rooms.set(roomCode, engine);
        }

        if (engine.isGameFinished()) {
          callback({ ok: false, error: 'Игра уже завершена — ссылки больше не активны' });
          return;
        }

        if (payload.role === 'display') {
          engine.displayCount += 1;
          callback({ ok: true, displayUrl: displayPath(roomCode) });
          io.to(roomCode).emit('roomState', engine.getPublicState());
          return;
        }

        let reconnected = false;
        let resolvedTeamName: string | undefined;

        if (payload.teamId) {
          const existing = room.teams.find((t) => t.id === payload.teamId);
          if (!existing) {
            callback({ ok: false, error: 'Командный слот не найден' });
            return;
          }
          teamId = existing.id;
          resolvedTeamName = existing.name;
          reconnected = true;
        } else if (payload.reconnectTeamName) {
          const existing = room.teams.find(
            (t) => t.name.toLowerCase() === payload.reconnectTeamName!.trim().toLowerCase(),
          );
          if (!existing) {
            callback({ ok: false, error: 'Команда с таким названием не найдена' });
            return;
          }
          teamId = existing.id;
          resolvedTeamName = existing.name;
          reconnected = true;
        } else if (payload.teamName) {
          const duplicate = room.teams.find(
            (t) => t.name.toLowerCase() === payload.teamName!.trim().toLowerCase(),
          );
          if (duplicate) {
            callback({
              ok: false,
              error: 'Команда уже есть — используйте ссылку командного слота',
            });
            return;
          }

          const newTeam = await prisma.gameTeam.create({
            data: {
              roomId: room.id,
              name: payload.teamName.trim(),
              sortOrder: room.teams.length,
            },
          });
          teamId = newTeam.id;
          resolvedTeamName = newTeam.name;
          engine.addTeam(newTeam);
        } else {
          callback({ ok: false, error: 'teamId, teamName or reconnectTeamName required' });
          return;
        }

        attachTeamSocket(io, socket, teamId);
        engine.setTeamConnected(teamId, true);

        callback({
          ok: true,
          teamId,
          teamName: resolvedTeamName,
          reconnected,
          teamSlotUrl: teamSlotPath(roomCode, teamId),
          displayUrl: displayPath(roomCode),
        });
        io.to(roomCode).emit('roomState', engine.getPublicState());
      } catch {
        callback({ ok: false, error: 'Failed to join room' });
      }
    });

    socket.on('startTour', (callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine) {
        callback({ ok: false, error: 'Room not found' });
        return;
      }
      const result = engine.startTour();
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback(result);
    });

    socket.on('submitAnswer', (answer, callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine || !teamId) {
        callback({ ok: false, error: 'Not in room' });
        return;
      }
      const result = engine.submitAnswer(teamId, answer);
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback({ ok: result.ok, error: result.error });
    });

    socket.on('pass', (callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine || !teamId) {
        callback({ ok: false, error: 'Not in room' });
        return;
      }
      const result = engine.pass(teamId);
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback(result);
    });

    socket.on('nextQuestion', (callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine) {
        callback({ ok: false, error: 'Room not found' });
        return;
      }
      const result = engine.nextQuestion();
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback(result);
    });

    socket.on('pauseGame', (callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine || !teamId) {
        callback({ ok: false, error: 'Not in room' });
        return;
      }
      const result = engine.pause(teamId);
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback(result);
    });

    socket.on('resumeGame', (callback) => {
      const engine = roomCode ? rooms.get(roomCode) : undefined;
      if (!engine || !teamId) {
        callback({ ok: false, error: 'Not in room' });
        return;
      }
      const result = engine.resume();
      if (result.ok && roomCode) {
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }
      callback(result);
    });

    socket.on('leaveRoom', (callback) => {
      if (!roomCode) {
        callback({ ok: true });
        return;
      }
      const engine = rooms.get(roomCode);
      const leavingTeamId = teamId;

      if (engine && leavingTeamId && teamConnections.get(leavingTeamId) === socket.id) {
        teamConnections.delete(leavingTeamId);
        engine.setTeamConnected(leavingTeamId, false);
        io.to(roomCode).emit('roomState', engine.getPublicState());
      }

      void socket.leave(roomCode);
      teamId = null;
      roomCode = null;
      callback({ ok: true });
    });

    socket.on('startGame', (callback) => {
      callback({ ok: true });
    });

    socket.on('disconnect', () => {
      if (!roomCode) return;
      const engine = rooms.get(roomCode);
      if (!engine) return;

      if (role === 'display') {
        engine.displayCount = Math.max(0, engine.displayCount - 1);
      } else if (teamId) {
        if (teamConnections.get(teamId) === socket.id) {
          teamConnections.delete(teamId);
          engine.setTeamConnected(teamId, false);
        }
      }

      io.to(roomCode).emit('roomState', engine.getPublicState());
    });
  });
}

function attachTeamSocket(io: GameServer, socket: GameSocket, teamId: string) {
  const existingSocketId = teamConnections.get(teamId);
  if (existingSocketId && existingSocketId !== socket.id) {
    io.sockets.sockets.get(existingSocketId)?.disconnect(true);
  }
  teamConnections.set(teamId, socket.id);
}
