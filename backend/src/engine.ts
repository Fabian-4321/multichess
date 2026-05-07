import { Board, GameMode, Piece, PieceType, PlayerColor, Position } from './types';

interface Dir { dr: number; dc: number; }

const BACK_RANK: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

const PAWN_DIR: Record<PlayerColor, Dir> = {
  white: { dr: -1, dc: 0 },
  black: { dr: 1, dc: 0 },
  red: { dr: 0, dc: -1 },
  blue: { dr: 0, dc: 1 },
};

const PAWN_CAPTURES: Record<PlayerColor, Dir[]> = {
  white: [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }],
  black: [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }],
  red: [{ dr: -1, dc: -1 }, { dr: 1, dc: -1 }],
  blue: [{ dr: -1, dc: 1 }, { dr: 1, dc: 1 }],
};

const BISHOP_DIRS: Dir[] = [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
const ROOK_DIRS: Dir[] = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
const QUEEN_DIRS: Dir[] = [...BISHOP_DIRS, ...ROOK_DIRS];
const KNIGHT_OFFSETS: Dir[] = [
  { dr: -2, dc: -1 }, { dr: -2, dc: 1 }, { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
  { dr: 1, dc: -2 }, { dr: 1, dc: 2 }, { dr: 2, dc: -1 }, { dr: 2, dc: 1 },
];

export interface MoveContext {
  lastMove: { from: Position; to: Position; piece: Piece; captured?: Piece; player: PlayerColor } | null;
  castlingRights: Record<PlayerColor, { kingSide: boolean; queenSide: boolean }>;
}

export function defaultMoveContext(): MoveContext {
  return {
    lastMove: null,
    castlingRights: {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true },
      red: { kingSide: true, queenSide: true },
      blue: { kingSide: true, queenSide: true },
    },
  };
}

export function getBoardSize(mode: GameMode): number {
  return mode === '1v1' ? 8 : 14;
}

export function isValidSquare(row: number, col: number, mode: GameMode): boolean {
  const s = getBoardSize(mode);
  if (row < 0 || row >= s || col < 0 || col >= s) return false;
  if (mode === '4player') {
    if (row <= 2 && col <= 2) return false;
    if (row <= 2 && col >= 11) return false;
    if (row >= 11 && col <= 2) return false;
    if (row >= 11 && col >= 11) return false;
  }
  return true;
}

export function createBoard(mode: GameMode): Board {
  const s = getBoardSize(mode);
  const board: Board = Array.from({ length: s }, () => Array(s).fill(null));

  if (mode === '1v1') {
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: BACK_RANK[c], color: 'black' };
      board[1][c] = { type: 'pawn', color: 'black' };
      board[6][c] = { type: 'pawn', color: 'white' };
      board[7][c] = { type: BACK_RANK[c], color: 'white' };
    }
  } else {
    for (let i = 0; i < 8; i++) {
      board[0][3 + i] = { type: BACK_RANK[i], color: 'black' };
      board[1][3 + i] = { type: 'pawn', color: 'black' };
      board[13][3 + i] = { type: BACK_RANK[i], color: 'white' };
      board[12][3 + i] = { type: 'pawn', color: 'white' };
      board[3 + i][0] = { type: BACK_RANK[i], color: 'blue' };
      board[3 + i][1] = { type: 'pawn', color: 'blue' };
      board[3 + i][13] = { type: BACK_RANK[i], color: 'red' };
      board[3 + i][12] = { type: 'pawn', color: 'red' };
    }
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

export function findKing(board: Board, color: PlayerColor, mode: GameMode): Position | null {
  const s = getBoardSize(mode);
  for (let r = 0; r < s; r++)
    for (let c = 0; c < s; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.color === color) return { row: r, col: c };
    }
  return null;
}

function isPawnStart(row: number, col: number, color: PlayerColor, mode: GameMode): boolean {
  if (mode === '1v1') return color === 'white' ? row === 6 : row === 1;
  switch (color) {
    case 'white': return row === 12;
    case 'black': return row === 1;
    case 'red': return col === 12;
    case 'blue': return col === 1;
  }
}

export function shouldPromote(piece: Piece, pos: Position, mode: GameMode): boolean {
  if (mode === '1v1') return piece.color === 'white' ? pos.row === 0 : pos.row === 7;
  const d = PAWN_DIR[piece.color];
  return !isValidSquare(pos.row + d.dr, pos.col + d.dc, mode);
}

function getPawnMoves(board: Board, pos: Position, color: PlayerColor, mode: GameMode, ctx: MoveContext): Position[] {
  const moves: Position[] = [];
  const { dr, dc } = PAWN_DIR[color];
  const f1r = pos.row + dr, f1c = pos.col + dc;
  if (isValidSquare(f1r, f1c, mode) && !board[f1r][f1c]) {
    moves.push({ row: f1r, col: f1c });
    if (isPawnStart(pos.row, pos.col, color, mode)) {
      const f2r = pos.row + 2 * dr, f2c = pos.col + 2 * dc;
      if (isValidSquare(f2r, f2c, mode) && !board[f2r][f2c])
        moves.push({ row: f2r, col: f2c });
    }
  }
  for (const { dr: cdr, dc: cdc } of PAWN_CAPTURES[color]) {
    const cr = pos.row + cdr, cc = pos.col + cdc;
    if (isValidSquare(cr, cc, mode)) {
      const target = board[cr][cc];
      if (target && target.color !== color) {
        moves.push({ row: cr, col: cc });
      }
      if (ctx.lastMove && ctx.lastMove.piece.type === 'pawn' && ctx.lastMove.piece.color !== color) {
        const lm = ctx.lastMove;
        const pawnDir = PAWN_DIR[lm.piece.color];
        const doubleRow = lm.from.row + 2 * pawnDir.dr;
        const doubleCol = lm.from.col + 2 * pawnDir.dc;
        if (lm.to.row === doubleRow && lm.to.col === doubleCol) {
          const enPassantTarget = { row: lm.to.row - pawnDir.dr, col: lm.to.col - pawnDir.dc };
          if (cr === enPassantTarget.row && cc === enPassantTarget.col) {
            if (!moves.some(m => m.row === cr && m.col === cc)) {
              moves.push({ row: cr, col: cc });
            }
          }
        }
      }
    }
  }
  return moves;
}

function getKnightMoves(board: Board, pos: Position, color: PlayerColor, mode: GameMode): Position[] {
  return KNIGHT_OFFSETS
    .map(({ dr, dc }) => ({ row: pos.row + dr, col: pos.col + dc }))
    .filter(({ row, col }) => isValidSquare(row, col, mode) && (!board[row][col] || board[row][col]!.color !== color));
}

function getSlidingMoves(board: Board, pos: Position, color: PlayerColor, mode: GameMode, dirs: Dir[]): Position[] {
  const moves: Position[] = [];
  for (const { dr, dc } of dirs) {
    let r = pos.row + dr, c = pos.col + dc;
    while (isValidSquare(r, c, mode)) {
      const t = board[r][c];
      if (!t) { moves.push({ row: r, col: c }); }
      else { if (t.color !== color) moves.push({ row: r, col: c }); break; }
      r += dr; c += dc;
    }
  }
  return moves;
}

function getKingMoves(board: Board, pos: Position, color: PlayerColor, mode: GameMode, ctx: MoveContext): Position[] {
  const moves: Position[] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = pos.row + dr, c = pos.col + dc;
      if (isValidSquare(r, c, mode) && (!board[r][c] || board[r][c]!.color !== color))
        moves.push({ row: r, col: c });
    }

  if (mode === '1v1') {
    const rights = ctx.castlingRights[color];
    const row = color === 'white' ? 7 : 0;

    if (pos.row === row && pos.col === 4) {
      if (rights.kingSide && !board[row][5] && !board[row][6]
        && board[row][7]?.type === 'rook' && board[row][7]?.color === color) {
        if (!isSquareAttacked(board, { row, col: 4 }, color, mode) &&
            !isSquareAttacked(board, { row, col: 5 }, color, mode) &&
            !isSquareAttacked(board, { row, col: 6 }, color, mode)) {
          moves.push({ row, col: 6 });
        }
      }
      if (rights.queenSide && !board[row][3] && !board[row][2] && !board[row][1]
        && board[row][0]?.type === 'rook' && board[row][0]?.color === color) {
        if (!isSquareAttacked(board, { row, col: 4 }, color, mode) &&
            !isSquareAttacked(board, { row, col: 3 }, color, mode) &&
            !isSquareAttacked(board, { row, col: 2 }, color, mode)) {
          moves.push({ row, col: 2 });
        }
      }
    }
  } else {
    const rights = ctx.castlingRights[color];
    type CastleInfo = {
      kr: number; kc: number;
      ksTo: [number, number]; ksRookFrom: [number, number]; ksRookTo: [number, number]; ksEmpty: [number, number][];
      qsTo: [number, number]; qsRookFrom: [number, number]; qsRookTo: [number, number]; qsEmpty: [number, number][];
    };
    const castle: Record<PlayerColor, CastleInfo> = {
      white: {
        kr: 13, kc: 7,
        ksTo: [13, 9], ksRookFrom: [13, 10], ksRookTo: [13, 8], ksEmpty: [[13, 8], [13, 9]],
        qsTo: [13, 5], qsRookFrom: [13, 3], qsRookTo: [13, 6], qsEmpty: [[13, 6], [13, 5], [13, 4]],
      },
      black: {
        kr: 0, kc: 7,
        ksTo: [0, 9], ksRookFrom: [0, 10], ksRookTo: [0, 8], ksEmpty: [[0, 8], [0, 9]],
        qsTo: [0, 5], qsRookFrom: [0, 3], qsRookTo: [0, 6], qsEmpty: [[0, 6], [0, 5], [0, 4]],
      },
      red: {
        kr: 7, kc: 13,
        ksTo: [9, 13], ksRookFrom: [10, 13], ksRookTo: [8, 13], ksEmpty: [[8, 13], [9, 13]],
        qsTo: [5, 13], qsRookFrom: [3, 13], qsRookTo: [6, 13], qsEmpty: [[6, 13], [5, 13], [4, 13]],
      },
      blue: {
        kr: 7, kc: 0,
        ksTo: [9, 0], ksRookFrom: [10, 0], ksRookTo: [8, 0], ksEmpty: [[8, 0], [9, 0]],
        qsTo: [5, 0], qsRookFrom: [3, 0], qsRookTo: [6, 0], qsEmpty: [[6, 0], [5, 0], [4, 0]],
      },
    };
    const ci = castle[color];
    if (pos.row !== ci.kr || pos.col !== ci.kc) return moves;

    if (rights.kingSide) {
      const allEmpty = ci.ksEmpty.every(([r, c]) => !board[r][c]);
      const rookOk = isValidSquare(ci.ksRookFrom[0], ci.ksRookFrom[1], mode) &&
        board[ci.ksRookFrom[0]][ci.ksRookFrom[1]]?.type === 'rook' &&
        board[ci.ksRookFrom[0]][ci.ksRookFrom[1]]?.color === color;
      const safe = !isSquareAttacked(board, { row: ci.kr, col: ci.kc }, color, mode) &&
        !isSquareAttacked(board, { row: ci.ksEmpty[0][0], col: ci.ksEmpty[0][1] }, color, mode) &&
        !isSquareAttacked(board, { row: ci.ksTo[0], col: ci.ksTo[1] }, color, mode);
      if (allEmpty && rookOk && safe) moves.push({ row: ci.ksTo[0], col: ci.ksTo[1] });
    }
    if (rights.queenSide) {
      const allEmpty = ci.qsEmpty.every(([r, c]) => !board[r][c]);
      const rookOk = isValidSquare(ci.qsRookFrom[0], ci.qsRookFrom[1], mode) &&
        board[ci.qsRookFrom[0]][ci.qsRookFrom[1]]?.type === 'rook' &&
        board[ci.qsRookFrom[0]][ci.qsRookFrom[1]]?.color === color;
      const safe = !isSquareAttacked(board, { row: ci.kr, col: ci.kc }, color, mode) &&
        !isSquareAttacked(board, { row: ci.qsEmpty[0][0], col: ci.qsEmpty[0][1] }, color, mode) &&
        !isSquareAttacked(board, { row: ci.qsTo[0], col: ci.qsTo[1] }, color, mode);
      if (allEmpty && rookOk && safe) moves.push({ row: ci.qsTo[0], col: ci.qsTo[1] });
    }
  }

  return moves;
}

function getRawMoves(board: Board, pos: Position, mode: GameMode, ctx: MoveContext): Position[] {
  const p = board[pos.row][pos.col];
  if (!p) return [];
  switch (p.type) {
    case 'pawn': return getPawnMoves(board, pos, p.color, mode, ctx);
    case 'knight': return getKnightMoves(board, pos, p.color, mode);
    case 'bishop': return getSlidingMoves(board, pos, p.color, mode, BISHOP_DIRS);
    case 'rook': return getSlidingMoves(board, pos, p.color, mode, ROOK_DIRS);
    case 'queen': return getSlidingMoves(board, pos, p.color, mode, QUEEN_DIRS);
    case 'king': return getKingMoves(board, pos, p.color, mode, ctx);
  }
}

function isSquareAttacked(board: Board, pos: Position, byNotColor: PlayerColor, mode: GameMode): boolean {
  for (const { dr, dc } of ROOK_DIRS) {
    let r = pos.row + dr, c = pos.col + dc;
    while (isValidSquare(r, c, mode)) {
      const p = board[r][c];
      if (p) { if (p.color !== byNotColor && (p.type === 'rook' || p.type === 'queen')) return true; break; }
      r += dr; c += dc;
    }
  }
  for (const { dr, dc } of BISHOP_DIRS) {
    let r = pos.row + dr, c = pos.col + dc;
    while (isValidSquare(r, c, mode)) {
      const p = board[r][c];
      if (p) { if (p.color !== byNotColor && (p.type === 'bishop' || p.type === 'queen')) return true; break; }
      r += dr; c += dc;
    }
  }
  for (const { dr, dc } of KNIGHT_OFFSETS) {
    const r = pos.row + dr, c = pos.col + dc;
    if (isValidSquare(r, c, mode)) {
      const p = board[r][c];
      if (p && p.color !== byNotColor && p.type === 'knight') return true;
    }
  }
  for (let cdr = -1; cdr <= 1; cdr += 2)
    for (let cdc = -1; cdc <= 1; cdc += 2) {
      const r = pos.row + cdr, c = pos.col + cdc;
      if (isValidSquare(r, c, mode)) {
        const p = board[r][c];
        if (p && p.color !== byNotColor && p.type === 'pawn') {
          if (PAWN_CAPTURES[p.color].some(cap => cap.dr === -cdr && cap.dc === -cdc)) return true;
        }
      }
    }
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = pos.row + dr, c = pos.col + dc;
      if (isValidSquare(r, c, mode)) {
        const p = board[r][c];
        if (p && p.color !== byNotColor && p.type === 'king') return true;
      }
    }
  return false;
}

export function isInCheck(board: Board, color: PlayerColor, mode: GameMode): boolean {
  const king = findKing(board, color, mode);
  if (!king) return false;
  return isSquareAttacked(board, king, color, mode);
}

function wouldBeInCheck(board: Board, from: Position, to: Position, color: PlayerColor, mode: GameMode, ctx: MoveContext): boolean {
  const tmp = cloneBoard(board);
  tmp[to.row][to.col] = tmp[from.row][from.col];
  tmp[from.row][from.col] = null;

  if (tmp[to.row][to.col]?.type === 'king' && (Math.abs(to.col - from.col) === 2 || Math.abs(to.row - from.row) === 2)) {
    if (mode === '1v1') {
      const row = from.row;
      if (to.col === 6) {
        tmp[row][5] = tmp[row][7];
        tmp[row][7] = null;
      } else if (to.col === 2) {
        tmp[row][3] = tmp[row][0];
        tmp[row][0] = null;
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
      const c = castle4[color];
      if (c) {
        const isKs = (Math.abs(to.col - from.col) === 2 && to.col > from.col) || (Math.abs(to.row - from.row) === 2 && to.row > from.row);
        const isQs = (Math.abs(to.col - from.col) === 2 && to.col < from.col) || (Math.abs(to.row - from.row) === 2 && to.row < from.row);
        if (isKs) {
          tmp[c.ksToRookTo[0]][c.ksToRookTo[1]] = tmp[c.ksToRookFrom[0]][c.ksToRookFrom[1]];
          tmp[c.ksToRookFrom[0]][c.ksToRookFrom[1]] = null;
        } else if (isQs) {
          tmp[c.qsToRookTo[0]][c.qsToRookTo[1]] = tmp[c.qsToRookFrom[0]][c.qsToRookFrom[1]];
          tmp[c.qsToRookFrom[0]][c.qsToRookFrom[1]] = null;
        }
      }
    }
  }

  if (tmp[to.row][to.col]?.type === 'pawn' && ctx.lastMove?.piece.type === 'pawn') {
    const lm = ctx.lastMove;
    if (lm.piece.color !== color) {
      const pawnDir = PAWN_DIR[lm.piece.color];
      const doubleRow = lm.from.row + 2 * pawnDir.dr;
      const doubleCol = lm.from.col + 2 * pawnDir.dc;
      if (lm.to.row === doubleRow && lm.to.col === doubleCol) {
        const enPassantTarget = { row: lm.to.row - pawnDir.dr, col: lm.to.col - pawnDir.dc };
        if (to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
          tmp[lm.to.row][lm.to.col] = null;
        }
      }
    }
  }

  return isInCheck(tmp, color, mode);
}

export function getValidMoves(board: Board, pos: Position, mode: GameMode, ctx: MoveContext = defaultMoveContext()): Position[] {
  const p = board[pos.row][pos.col];
  if (!p) return [];
  return getRawMoves(board, pos, mode, ctx).filter(to => !wouldBeInCheck(board, pos, to, p.color, mode, ctx));
}

export function isCheckmated(board: Board, color: PlayerColor, mode: GameMode, ctx: MoveContext = defaultMoveContext()): boolean {
  if (!isInCheck(board, color, mode)) return false;
  return !hasAnyLegalMove(board, color, mode, ctx);
}

export function isStalemate(board: Board, color: PlayerColor, mode: GameMode, ctx: MoveContext = defaultMoveContext()): boolean {
  if (isInCheck(board, color, mode)) return false;
  return !hasAnyLegalMove(board, color, mode, ctx);
}

function hasAnyLegalMove(board: Board, color: PlayerColor, mode: GameMode, ctx: MoveContext): boolean {
  const s = getBoardSize(mode);
  for (let r = 0; r < s; r++)
    for (let c = 0; c < s; c++) {
      const p = board[r][c];
      if (p && p.color === color && getValidMoves(board, { row: r, col: c }, mode, ctx).length > 0) return true;
    }
  return false;
}

export function posToAlgebraic(pos: Position): string {
  return `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
}

export function getAllMovesForColor(board: Board, color: PlayerColor, mode: GameMode, ctx: MoveContext = defaultMoveContext()): { from: Position; to: Position; piece: Piece; captured?: Piece }[] {
  const s = getBoardSize(mode);
  const moves: { from: Position; to: Position; piece: Piece; captured?: Piece }[] = [];
  for (let r = 0; r < s; r++)
    for (let c = 0; c < s; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      for (const to of getValidMoves(board, { row: r, col: c }, mode, ctx)) {
        moves.push({ from: { row: r, col: c }, to, piece: p, captured: board[to.row][to.col] || undefined });
      }
    }
  return moves;
}

export function updateCastlingRights(rights: Record<PlayerColor, { kingSide: boolean; queenSide: boolean }>, move: { from: Position; to: Position; piece: Piece }, mode: GameMode): void {
  const color = move.piece.color;
  if (move.piece.type === 'king') {
    rights[color].kingSide = false;
    rights[color].queenSide = false;
  }
  if (move.piece.type === 'rook') {
    if (mode === '1v1') {
      const row = color === 'white' ? 7 : 0;
      if (move.from.row === row && move.from.col === 0) rights[color].queenSide = false;
      if (move.from.row === row && move.from.col === 7) rights[color].kingSide = false;
    } else {
      const rookPositions: Record<PlayerColor, { ks: [number, number]; qs: [number, number] }> = {
        white: { ks: [13, 10], qs: [13, 3] },
        black: { ks: [0, 10], qs: [0, 3] },
        red: { ks: [10, 13], qs: [3, 13] },
        blue: { ks: [10, 0], qs: [3, 0] },
      };
      const rp = rookPositions[color];
      if (move.from.row === rp.ks[0] && move.from.col === rp.ks[1]) rights[color].kingSide = false;
      if (move.from.row === rp.qs[0] && move.from.col === rp.qs[1]) rights[color].queenSide = false;
    }
  }
  if (mode === '1v1') {
    const opp = color === 'white' ? 'black' : 'white';
    const oppRow = opp === 'white' ? 7 : 0;
    if (move.to.row === oppRow && move.to.col === 0) rights[opp].queenSide = false;
    if (move.to.row === oppRow && move.to.col === 7) rights[opp].kingSide = false;
  } else {
    const allRookPositions: Record<PlayerColor, { ks: [number, number]; qs: [number, number] }> = {
      white: { ks: [13, 10], qs: [13, 3] },
      black: { ks: [0, 10], qs: [0, 3] },
      red: { ks: [10, 13], qs: [3, 13] },
      blue: { ks: [10, 0], qs: [3, 0] },
    };
    for (const c of (['white', 'black', 'red', 'blue'] as PlayerColor[])) {
      if (c === color) continue;
      const rp = allRookPositions[c];
      if (move.to.row === rp.ks[0] && move.to.col === rp.ks[1]) rights[c].kingSide = false;
      if (move.to.row === rp.qs[0] && move.to.col === rp.qs[1]) rights[c].queenSide = false;
    }
  }
}
