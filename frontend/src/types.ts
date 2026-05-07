export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PlayerColor = 'white' | 'black' | 'red' | 'blue';
export type GameMode = '1v1' | '4player';
export type BotDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'master';

export interface Piece { type: PieceType; color: PlayerColor; }
export interface Position { row: number; col: number; }
export type Board = (Piece | null)[][];
export interface Player { id: string; color: PlayerColor; eliminated: boolean; connected: boolean; isBot: boolean; difficulty?: BotDifficulty; }
export interface Move { from: Position; to: Position; piece: Piece; captured?: Piece; player: PlayerColor; notation: string; }
export interface GameState {
  board: Board; currentPlayer: PlayerColor; players: Record<PlayerColor, Player | null>;
  capturedPieces: Record<PlayerColor, Piece[]>; moveHistory: Move[]; eliminatedPlayers: PlayerColor[];
  inCheck: PlayerColor[]; winner: PlayerColor | null; gameStarted: boolean;
  mode: GameMode; boardSize: number; turnOrder: PlayerColor[];
}

export const DIFFICULTIES: Record<BotDifficulty, { label: string; elo: string; depth: number; icon: string }> = {
  beginner: { label: 'Anfänger', elo: '400–600', depth: 1, icon: '♔' },
  easy:     { label: 'Leicht',   elo: '700–900', depth: 2, icon: '♘' },
  medium:   { label: 'Mittel',   elo: '1000–1200', depth: 3, icon: '♗' },
  hard:     { label: 'Schwer',   elo: '1400–1600', depth: 4, icon: '♖' },
  master:   { label: 'Meister',  elo: '1800–2000', depth: 5, icon: '♛' },
};

export const COLOR_NAMES: Record<PlayerColor, string> = { white: 'Weiß', black: 'Schwarz', red: 'Rot', blue: 'Blau' };
export const PIECE_UNICODE: Record<PieceType, string> = { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' };

export type AppView = 'home' | 'playing' | 'waiting' | 'joining' | 'rulebook';
export type OnlinePhase = 'choose' | 'create' | 'join' | 'waiting' | 'playing';
