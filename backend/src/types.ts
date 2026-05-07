export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PlayerColor = 'white' | 'black' | 'red' | 'blue';
export type GameMode = '1v1' | '4player';
export type BotDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'master';

export interface Piece {
  type: PieceType;
  color: PlayerColor;
}

export interface Position {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export interface Player {
  id: string;
  color: PlayerColor;
  eliminated: boolean;
  connected: boolean;
  isBot: boolean;
  difficulty?: BotDifficulty;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  player: PlayerColor;
  notation: string;
}

export interface GameState {
  board: Board;
  currentPlayer: PlayerColor;
  players: Record<PlayerColor, Player | null>;
  capturedPieces: Record<PlayerColor, Piece[]>;
  moveHistory: Move[];
  eliminatedPlayers: PlayerColor[];
  inCheck: PlayerColor[];
  winner: PlayerColor | null;
  gameStarted: boolean;
  mode: GameMode;
  boardSize: number;
  turnOrder: PlayerColor[];
}

export const DIFFICULTIES: Record<BotDifficulty, { label: string; elo: string; depth: number; randomPct: number }> = {
  beginner: { label: 'Anfänger', elo: '400–600', depth: 1, randomPct: 0.30 },
  easy:     { label: 'Leicht',   elo: '700–900', depth: 2, randomPct: 0.12 },
  medium:   { label: 'Mittel',   elo: '1000–1200', depth: 3, randomPct: 0 },
  hard:     { label: 'Schwer',   elo: '1400–1600', depth: 4, randomPct: 0 },
  master:   { label: 'Meister',  elo: '1800–2000', depth: 5, randomPct: 0 },
};

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000,
};
