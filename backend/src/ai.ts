import { Board, BotDifficulty, DIFFICULTIES, GameMode, Move, Piece, PieceType, PIECE_VALUES, PlayerColor, Position } from './types';
import { getAllMovesForColor, cloneBoard, shouldPromote, getBoardSize, getValidMoves, isInCheck, findKing, MoveContext, defaultMoveContext } from './engine';

const PST_PAWN_8 = [
  0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10,
  5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 0,0,0,0,0,0,0,0,
];
const PST_KNIGHT_8 = [
  -50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30,
  -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30,
  -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50,
];
const PST_BISHOP_8 = [
  -20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10,
  -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10,
  -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20,
];
const PST_ROOK_8 = [
  0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5,
  -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
  5,5,0,0,0,0,5,5, 0,0,0,5,5,0,0,0,
];
const PST_QUEEN_8 = [
  -20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10,
  -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10,
  -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20,
];
const PST_KING_8 = [
  -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10,
  20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20,
];

function getPST(type: PieceType): number[] | null {
  switch (type) {
    case 'pawn': return PST_PAWN_8;
    case 'knight': return PST_KNIGHT_8;
    case 'bishop': return PST_BISHOP_8;
    case 'rook': return PST_ROOK_8;
    case 'queen': return PST_QUEEN_8;
    case 'king': return PST_KING_8;
  }
}

function positionBonus(piece: Piece, row: number, col: number, mode: GameMode): number {
  if (mode === '1v1') {
    const pst = getPST(piece.type);
    if (!pst) return 0;
    const idx = piece.color === 'white' ? row * 8 + col : (7 - row) * 8 + col;
    return pst[idx];
  }
  const s = 14;
  const centerR = (s - 1) / 2, centerC = (s - 1) / 2;
  const dist = Math.abs(row - centerR) + Math.abs(col - centerC);
  const maxDist = 13;
  const centerBonus = (maxDist - dist) * 3;
  if (piece.type === 'pawn') {
    const dir = piece.color === 'white' ? -1 : piece.color === 'black' ? 1 : 0;
    if (dir !== 0) return centerBonus + (piece.color === 'white' ? (12 - row) * 5 : (row - 1) * 5);
    const dcol = piece.color === 'red' ? -1 : 1;
    return centerBonus + (piece.color === 'red' ? (12 - col) * 5 : (col - 1) * 5);
  }
  return centerBonus;
}

export function evaluate(board: Board, color: PlayerColor, mode: GameMode): number {
  const s = getBoardSize(mode);
  let score = 0;
  for (let r = 0; r < s; r++)
    for (let c = 0; c < s; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = PIECE_VALUES[p.type] + positionBonus(p, r, c, mode);
      score += p.color === color ? val : -val;
    }
  const kingPos = findKing(board, color, mode);
  if (kingPos && isInCheck(board, color, mode)) score -= 50;
  const oppColors: PlayerColor[] = mode === '1v1' ? [color === 'white' ? 'black' as PlayerColor : 'white' as PlayerColor] : (['white', 'black', 'red', 'blue'] as PlayerColor[]).filter(c => c !== color);
  for (const opp of oppColors) {
    const oppKing = findKing(board, opp, mode);
    if (oppKing && isInCheck(board, opp, mode)) score += 30;
  }
  return score;
}

function orderMoves(moves: { from: Position; to: Position; piece: Piece; captured?: Piece }[]): { from: Position; to: Position; piece: Piece; captured?: Piece }[] {
  return [...moves].sort((a, b) => {
    const aVal = a.captured ? PIECE_VALUES[a.captured.type] - PIECE_VALUES[a.piece.type] : 0;
    const bVal = b.captured ? PIECE_VALUES[b.captured.type] - PIECE_VALUES[b.piece.type] : 0;
    return bVal - aVal;
  });
}

function applyMoveToBoard(board: Board, move: { from: Position; to: Position; piece: Piece; captured?: Piece }, mode: GameMode): Board {
  const b = cloneBoard(board);
  b[move.to.row][move.to.col] = b[move.from.row][move.from.col];
  b[move.from.row][move.from.col] = null;
  const p = b[move.to.row][move.to.col]!;
  if (p.type === 'pawn' && shouldPromote(p, move.to, mode))
    b[move.to.row][move.to.col] = { type: 'queen', color: p.color };
  return b;
}

function minimax(
  board: Board, maximizingColor: PlayerColor, mode: GameMode,
  turnOrder: PlayerColor[], turnIdx: number,
  depth: number, alpha: number, beta: number, ctx: MoveContext
): number {
  if (depth === 0) return evaluate(board, maximizingColor, mode);

  const color = turnOrder[turnIdx];
  const isMax = color === maximizingColor;
  let moves = getAllMovesForColor(board, color, mode, ctx);

  if (moves.length === 0) {
    if (isInCheck(board, color, mode)) return isMax ? -99999 + (10 - depth) : 99999 - (10 - depth);
    return 0;
  }

  moves = orderMoves(moves);
  const nextIdx = (turnIdx + 1) % turnOrder.length;

  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      const nb = applyMoveToBoard(board, m, mode);
      best = Math.max(best, minimax(nb, maximizingColor, mode, turnOrder, nextIdx, depth - 1, alpha, beta, ctx));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const nb = applyMoveToBoard(board, m, mode);
      best = Math.min(best, minimax(nb, maximizingColor, mode, turnOrder, nextIdx, depth - 1, alpha, beta, ctx));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function findBestMove(
  board: Board, color: PlayerColor, mode: GameMode,
  turnOrder: PlayerColor[], difficulty: BotDifficulty, ctx: MoveContext = defaultMoveContext()
): { from: Position; to: Position; piece: Piece; captured?: Piece } | null {
  const config = DIFFICULTIES[difficulty];
  let moves = getAllMovesForColor(board, color, mode, ctx);
  if (moves.length === 0) return null;

  if (Math.random() < config.randomPct) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  moves = orderMoves(moves);
  const turnIdx = turnOrder.indexOf(color);
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const m of moves) {
    const nb = applyMoveToBoard(board, m, mode);
    const nextIdx = (turnIdx + 1) % turnOrder.length;
    const score = minimax(nb, color, mode, turnOrder, nextIdx, config.depth - 1, -Infinity, Infinity, ctx);
    if (score > bestScore) { bestScore = score; bestMove = m; }
  }
  return bestMove;
}
