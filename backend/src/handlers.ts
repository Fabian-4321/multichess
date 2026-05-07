import { Server, Socket } from 'socket.io';
import { Game } from './Game';
import { BotDifficulty, GameMode, Position, PlayerColor } from './types';
import { findBestMove } from './ai';

interface RoomEntry {
  game: Game | null;
  roomCode: string;
  isOnline: boolean;
  mode: GameMode;
  humanColors: PlayerColor[];
  waitingSockets: Map<string, PlayerColor>;
}

const rooms = new Map<string, RoomEntry>();
const socketToRoom = new Map<string, string>();

const MODE_COLORS: Record<GameMode, PlayerColor[]> = {
  '1v1': ['white', 'black'],
  '4player': ['white', 'red', 'black', 'blue'],
};

export function registerHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {

    socket.on('start-game', (config: { mode: GameMode; difficulty: BotDifficulty }, callback: (res: any) => void) => {
      try {
        const roomCode = genCode();
        const game = new Game(config.mode, socket.id, config.difficulty);
        rooms.set(roomCode, { game, roomCode, isOnline: false, mode: config.mode, humanColors: ['white'], waitingSockets: new Map() });
        socketToRoom.set(socket.id, roomCode);
        socket.join(roomCode);
        callback({ success: true, roomCode, state: game.state });

        if (game.isBotTurn()) scheduleBot(roomCode, game, io);
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('create-online', (config: { mode: GameMode }, callback: (res: any) => void) => {
      try {
        const roomCode = genCode();
        const mode = config.mode || '1v1';
        const colors = MODE_COLORS[mode];
        const waitingSockets = new Map<string, PlayerColor>();
        waitingSockets.set(socket.id, colors[0]);

        rooms.set(roomCode, {
          game: null,
          roomCode,
          isOnline: true,
          mode,
          humanColors: [colors[0]],
          waitingSockets,
        });
        socketToRoom.set(socket.id, roomCode);
        socket.join(roomCode);
        callback({ success: true, roomCode, playerCount: 1, needed: colors.length, color: colors[0] });
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('join-online', (data: { roomCode: string }, callback: (res: any) => void) => {
      try {
        const code = data.roomCode.toUpperCase().trim();
        const entry = rooms.get(code);
        if (!entry) throw new Error('Raum nicht gefunden');
        if (!entry.isOnline) throw new Error('Kein Online-Raum');
        if (entry.game) throw new Error('Spiel bereits gestartet');

        const colors = MODE_COLORS[entry.mode];
        const joinedCount = entry.waitingSockets.size;
        if (joinedCount >= colors.length) throw new Error('Spiel bereits voll');

        const assignedColor = colors[joinedCount];
        entry.waitingSockets.set(socket.id, assignedColor);
        entry.humanColors.push(assignedColor);

        socketToRoom.set(socket.id, code);
        socket.join(code);

        const newCount = entry.waitingSockets.size;

        if (newCount >= colors.length) {
          launchGame(code, entry, io);
          callback({ success: true, state: entry.game!.state, color: assignedColor });
        } else {
          io.to(code).emit('room-update', { playerCount: newCount, needed: colors.length });
          callback({ success: true, playerCount: newCount, needed: colors.length, color: assignedColor });
        }
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('start-early', (callback: (res: any) => void) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) throw new Error('Kein Raum');
        const entry = rooms.get(roomCode);
        if (!entry) throw new Error('Raum nicht gefunden');
        if (!entry.isOnline) throw new Error('Kein Online-Raum');
        if (entry.game) throw new Error('Spiel bereits gestartet');
        if (entry.waitingSockets.size < 2) throw new Error('Mindestens 2 Spieler noetig');

        launchGame(roomCode, entry, io);
        callback({ success: true });
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('make-move', (data: { from: Position; to: Position }, callback: (res: any) => void) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) throw new Error('Kein Spiel');
        const entry = rooms.get(roomCode);
        if (!entry) throw new Error('Raum nicht gefunden');
        const game = entry.game;
        if (!game) throw new Error('Spiel noch nicht gestartet');

        const color = getPlayerColor(game, socket.id);
        if (!color) throw new Error('Nicht dein Spiel');

        game.makeMove(data.from, data.to, color);
        io.to(roomCode).emit('game-state', game.state);
        callback({ success: true });

        if (!game.state.winner && game.isBotTurn()) scheduleBot(roomCode, game, io);
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('get-valid-moves', (pos: Position, callback: (moves: Position[]) => void) => {
      const roomCode = socketToRoom.get(socket.id);
      if (!roomCode) { callback([]); return; }
      const entry = rooms.get(roomCode);
      if (!entry || !entry.game) { callback([]); return; }
      const game = entry.game;
      const color = getPlayerColor(game, socket.id);
      callback(color ? game.getValidMovesFor(pos, color) : []);
    });

    socket.on('restart-game', (callback: (res: any) => void) => {
      try {
        const roomCode = socketToRoom.get(socket.id);
        if (!roomCode) throw new Error('Kein Spiel');
        const entry = rooms.get(roomCode);
        if (!entry) throw new Error('Raum nicht gefunden');
        entry.game!.restart();
        io.to(roomCode).emit('game-state', entry.game!.state);
        callback({ success: true });
        if (entry.game!.isBotTurn()) scheduleBot(roomCode, entry.game!, io);
      } catch (e: any) { callback({ success: false, error: e.message }); }
    });

    socket.on('disconnect', () => {
      const roomCode = socketToRoom.get(socket.id);
      if (roomCode) {
        socketToRoom.delete(socket.id);
        const entry = rooms.get(roomCode);
        if (entry) {
          if (entry.game) {
            const color = getPlayerColor(entry.game, socket.id);
            if (color) entry.game.state.players[color]!.connected = false;
          }
          if (entry.waitingSockets) {
            entry.waitingSockets.delete(socket.id);
          }
        }
      }
    });
  });
}

function launchGame(code: string, entry: RoomEntry, io: Server) {
  const socketIds = new Map([...entry.waitingSockets]);
  const game = Game.createOnline(entry.mode, socketIds, entry.humanColors);
  entry.game = game;
  io.to(code).emit('game-state', game.state);
  if (game.isBotTurn()) scheduleBot(code, game, io);
}

function getPlayerColor(game: Game, socketId: string): PlayerColor | null {
  const players = game.state.players;
  for (const color of game.state.turnOrder) {
    const p = players[color];
    if (p && p.id === socketId) return color as PlayerColor;
  }
  return null;
}

function scheduleBot(roomCode: string, game: Game, io: Server) {
  const delay = 400 + Math.random() * 800;
  setTimeout(() => {
    const entry = rooms.get(roomCode);
    if (!entry || entry.game !== game) return;
    if (game.state.winner) return;

    const color = game.state.currentPlayer;
    const player = game.state.players[color];
    if (!player || !player.isBot || player.eliminated) return;

    const diff = player.difficulty || 'medium';
    const move = findBestMove(game.state.board, color, game.state.mode, game.state.turnOrder, diff, game.getMoveCtx());
    if (!move) return;

    try {
      game.makeMove(move.from, move.to, color);
      io.to(roomCode).emit('game-state', game.state);

      if (!game.state.winner && game.isBotTurn()) scheduleBot(roomCode, game, io);
    } catch { /* ignore bot errors */ }
  }, delay);
}

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (rooms.has(code)) return genCode();
  return code;
}
