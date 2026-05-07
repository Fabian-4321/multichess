import { Board, BotDifficulty, GameMode, GameState, Move, Piece, PieceType, PlayerColor, Position, DIFFICULTIES } from './types';
import { createBoard, cloneBoard, getValidMoves, getBoardSize, isInCheck, isCheckmated, isStalemate, shouldPromote, posToAlgebraic, isValidSquare, MoveContext, defaultMoveContext, updateCastlingRights } from './engine';

const MODE_COLORS: Record<GameMode, PlayerColor[]> = {
  '1v1': ['white', 'black'],
  '4player': ['white', 'red', 'black', 'blue'],
};

const PAWN_DIR_EP: Record<PlayerColor, { dr: number; dc: number }> = {
  white: { dr: -1, dc: 0 },
  black: { dr: 1, dc: 0 },
  red: { dr: 0, dc: -1 },
  blue: { dr: 0, dc: 1 },
};

const PIECE_SYM: Record<PieceType, string> = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '' };

export class Game {
  public state: GameState;
  private moveCtx: MoveContext;

  static createOnline(mode: GameMode, socketIds: Map<string, PlayerColor>, humanColors: PlayerColor[]): Game {
    const turnOrder = MODE_COLORS[mode];
    const players: Record<PlayerColor, any> = {} as any;
    for (const color of turnOrder) {
      const isHuman = humanColors.includes(color);
      if (isHuman) {
        let sid = '';
        for (const [sid2, c] of socketIds) { if (c === color) { sid = sid2; break; } }
        players[color] = { id: sid || 'unknown', color, eliminated: false, connected: true, isBot: false };
      } else {
        players[color] = { id: `bot-${color}`, color, eliminated: false, connected: true, isBot: true, difficulty: 'medium' as BotDifficulty };
      }
    }
    const game = Object.create(Game.prototype) as Game;
    game.moveCtx = defaultMoveContext();
    game.state = {
      board: createBoard(mode),
      currentPlayer: 'white',
      players,
      capturedPieces: { white: [], red: [], black: [], blue: [] },
      moveHistory: [],
      eliminatedPlayers: [],
      inCheck: [],
      winner: null,
      gameStarted: true,
      mode,
      boardSize: getBoardSize(mode),
      turnOrder,
    };
    return game;
  }

  constructor(mode: GameMode, humanSocketId: string, difficulty: BotDifficulty) {
    const turnOrder = MODE_COLORS[mode];
    const players: Record<PlayerColor, any> = {} as any;
    for (const color of turnOrder) {
      players[color] = color === 'white'
        ? { id: humanSocketId, color, eliminated: false, connected: true, isBot: false }
        : { id: `bot-${color}`, color, eliminated: false, connected: true, isBot: true, difficulty };
    }

    this.moveCtx = defaultMoveContext();
    this.state = {
      board: createBoard(mode),
      currentPlayer: 'white',
      players,
      capturedPieces: { white: [], red: [], black: [], blue: [] },
      moveHistory: [],
      eliminatedPlayers: [],
      inCheck: [],
      winner: null,
      gameStarted: true,
      mode,
      boardSize: getBoardSize(mode),
      turnOrder,
    };
  }

  isBotTurn(): boolean {
    const p = this.state.players[this.state.currentPlayer];
    return p !== null && !p.eliminated && p.isBot;
  }

  makeMove(from: Position, to: Position, playerColor: PlayerColor): void {
    if (this.state.winner) throw new Error('Spiel vorbei');
    if (playerColor !== this.state.currentPlayer) throw new Error('Nicht dein Zug');
    const player = this.state.players[playerColor];
    if (!player || player.eliminated) throw new Error('Spieler ausgeschieden');

    const piece = this.state.board[from.row][from.col];
    if (!piece || piece.color !== playerColor) throw new Error('Ungueltige Figur');

    const valid = getValidMoves(this.state.board, from, this.state.mode, this.moveCtx);
    if (!valid.some(m => m.row === to.row && m.col === to.col)) throw new Error('Ungueltiger Zug');

    let captured = this.state.board[to.row][to.col];

    if (piece.type === 'pawn' && this.moveCtx.lastMove?.piece.type === 'pawn' && this.moveCtx.lastMove.piece.color !== playerColor) {
      const lm = this.moveCtx.lastMove;
      const pd = PAWN_DIR_EP[lm.piece.color];
      const doubleRow = lm.from.row + 2 * pd.dr;
      const doubleCol = lm.from.col + 2 * pd.dc;
      if (lm.to.row === doubleRow && lm.to.col === doubleCol) {
        const epTarget = { row: lm.to.row - pd.dr, col: lm.to.col - pd.dc };
        if (to.row === epTarget.row && to.col === epTarget.col) {
          captured = this.state.board[lm.to.row][lm.to.col];
          this.state.board[lm.to.row][lm.to.col] = null;
        }
      }
    }

    if (piece.type === 'king' && (Math.abs(to.col - from.col) === 2 || Math.abs(to.row - from.row) === 2)) {
      if (this.state.mode === '1v1') {
        const row = from.row;
        if (to.col === 6) {
          this.state.board[row][5] = this.state.board[row][7];
          this.state.board[row][7] = null;
        } else if (to.col === 2) {
          this.state.board[row][3] = this.state.board[row][0];
          this.state.board[row][0] = null;
        }
      } else {
        const castle4: Record<string, {
          kr: number; kc: number;
          ksToRookFrom: [number, number]; ksToRookTo: [number, number];
          qsToRookFrom: [number, number]; qsToRookTo: [number, number];
        }> = {
          white: { kr: 13, kc: 7, ksToRookFrom: [13, 10], ksToRookTo: [13, 8], qsToRookFrom: [13, 3], qsToRookTo: [13, 6] },
          black: { kr: 0, kc: 7, ksToRookFrom: [0, 10], ksToRookTo: [0, 8], qsToRookFrom: [0, 3], qsToRookTo: [0, 6] },
          red: { kr: 7, kc: 13, ksToRookFrom: [10, 13], ksToRookTo: [8, 13], qsToRookFrom: [3, 13], qsToRookTo: [6, 13] },
          blue: { kr: 7, kc: 0, ksToRookFrom: [10, 0], ksToRookTo: [8, 0], qsToRookFrom: [3, 0], qsToRookTo: [6, 0] },
        };
        const c = castle4[piece.color];
        if (c) {
          const isKs = (Math.abs(to.col - from.col) === 2 && to.col > from.col) || (Math.abs(to.row - from.row) === 2 && to.row > from.row);
          const isQs = (Math.abs(to.col - from.col) === 2 && to.col < from.col) || (Math.abs(to.row - from.row) === 2 && to.row < from.row);
          if (isKs) {
            this.state.board[c.ksToRookTo[0]][c.ksToRookTo[1]] = this.state.board[c.ksToRookFrom[0]][c.ksToRookFrom[1]];
            this.state.board[c.ksToRookFrom[0]][c.ksToRookFrom[1]] = null;
          } else if (isQs) {
            this.state.board[c.qsToRookTo[0]][c.qsToRookTo[1]] = this.state.board[c.qsToRookFrom[0]][c.qsToRookFrom[1]];
            this.state.board[c.qsToRookFrom[0]][c.qsToRookFrom[1]] = null;
          }
        }
      }
    }

    this.state.board[from.row][from.col] = null;
    this.state.board[to.row][to.col] = piece;

    if (captured) this.state.capturedPieces[captured.color].push(captured);

    if (piece.type === 'pawn' && shouldPromote(piece, to, this.state.mode)) {
      this.state.board[to.row][to.col] = { type: 'queen', color: piece.color };
    }

    const move: Move = {
      from, to, piece: { ...piece }, captured: captured || undefined, player: playerColor,
      notation: this.buildNotation(piece, from, to, captured),
    };
    this.state.moveHistory.push(move);
    this.moveCtx.lastMove = move;
    updateCastlingRights(this.moveCtx.castlingRights, move, this.state.mode);

    this.checkGameEnd();
    this.updateInCheck();
    this.advanceTurn();
  }

  private buildNotation(piece: Piece, from: Position, to: Position, captured: Piece | null): string {
    const sym = PIECE_SYM[piece.type];
    const cap = captured ? 'x' : '→';
    let n = `${sym}${posToAlgebraic(from)}${cap}${posToAlgebraic(to)}`;
    if (piece.type === 'king' && (Math.abs(to.col - from.col) === 2 || Math.abs(to.row - from.row) === 2)) {
      const isKs = (Math.abs(to.col - from.col) === 2 && to.col > from.col) || (Math.abs(to.row - from.row) === 2 && to.row > from.row);
      n = isKs ? 'O-O' : 'O-O-O';
    }
    return n;
  }

  getValidMovesFor(position: Position, playerColor: PlayerColor): Position[] {
    const p = this.state.board[position.row][position.col];
    if (!p || p.color !== playerColor || playerColor !== this.state.currentPlayer) return [];
    if (this.state.players[playerColor]?.eliminated) return [];
    return getValidMoves(this.state.board, position, this.state.mode, this.moveCtx);
  }

  getMoveCtx(): MoveContext {
    return this.moveCtx;
  }

  restart() {
    this.moveCtx = defaultMoveContext();
    this.state.board = createBoard(this.state.mode);
    this.state.currentPlayer = 'white';
    this.state.capturedPieces = { white: [], red: [], black: [], blue: [] };
    this.state.moveHistory = [];
    this.state.eliminatedPlayers = [];
    this.state.inCheck = [];
    this.state.winner = null;
    this.state.gameStarted = true;
    for (const color of this.state.turnOrder) {
      const p = this.state.players[color];
      if (p) { p.eliminated = false; p.connected = true; }
    }
  }

  private checkGameEnd() {
    if (this.state.mode === '1v1') {
      for (const color of this.state.turnOrder) {
        const player = this.state.players[color];
        if (!player || player.eliminated) continue;
        if (isCheckmated(this.state.board, color, this.state.mode, this.moveCtx)) {
          this.state.winner = this.state.turnOrder.find(c => c !== color) || null;
          return;
        }
        if (isStalemate(this.state.board, color, this.state.mode, this.moveCtx)) {
          this.state.winner = this.state.turnOrder.find(c => c !== color) || null;
          return;
        }
      }
      return;
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const color of this.state.turnOrder) {
        const player = this.state.players[color];
        if (!player || player.eliminated) continue;
        if (isCheckmated(this.state.board, color, this.state.mode, this.moveCtx)) {
          player.eliminated = true;
          this.state.eliminatedPlayers.push(color);
          const s = this.state.boardSize;
          for (let r = 0; r < s; r++)
            for (let c = 0; c < s; c++) {
              const p = this.state.board[r][c];
              if (p && p.color === color) {
                this.state.capturedPieces[color].push(p);
                this.state.board[r][c] = null;
              }
            }
          changed = true;
        }
      }
      const active = this.state.turnOrder.filter(c => this.state.players[c] && !this.state.players[c]!.eliminated);
      if (active.length <= 1) { this.state.winner = active[0] || null; return; }
    }
  }

  private updateInCheck() {
    this.state.inCheck = this.state.turnOrder.filter(c => {
      const p = this.state.players[c];
      return p && !p.eliminated && isInCheck(this.state.board, c, this.state.mode);
    });
  }

  private advanceTurn() {
    const idx = this.state.turnOrder.indexOf(this.state.currentPlayer);
    for (let i = 1; i <= this.state.turnOrder.length; i++) {
      const next = this.state.turnOrder[(idx + i) % this.state.turnOrder.length];
      const p = this.state.players[next];
      if (p && !p.eliminated) { this.state.currentPlayer = next; return; }
    }
  }
}
